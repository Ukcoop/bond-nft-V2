// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import '@openzeppelin-contracts-5.0.2/utils/ReentrancyGuard.sol';

import {CommsRail} from '../comms/commsRail.sol';
import {BorrowerNFTManager} from '../modules/NFT/borrowerNFT.sol';
import {LenderNFTManager} from '../modules/NFT/lenderNFT.sol';
import '../shared.sol';

contract BondContractsManager is HandlesETH, ReentrancyGuard {
  mapping(uint256 => bondData) internal bondContractsData;
  uint32 internal maxIds;
  uintPair[] internal bondPairs;
  LenderNFTManager internal immutable lenderNFTManager;
  BorrowerNFTManager internal immutable borrowerNFTManager;
  CommsRail internal immutable commsRail;

  constructor(address _commsRail) {
    commsRail = CommsRail(_commsRail);
    lenderNFTManager = new LenderNFTManager(_commsRail);
    borrowerNFTManager = new BorrowerNFTManager(_commsRail);
  }

  function getBondPairs() public view returns (uintPair[] memory) {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');
    return bondPairs;
  }

  function getNextId() internal returns (uint32) {
    uint32 len = maxIds;
    for (uint32 i = 0; i < len; i++) {
      // that is not a timestamp slither...
      //slither-disable-next-line timestamp
      if (bondContractsData[i].owner == address(0)) {
        return i;
      }
    }
    return maxIds++;
  }

  function getNFTAddresses() public view returns (address[2] memory) {
    return [address(borrowerNFTManager), address(lenderNFTManager)];
  }

  function getBondAddresses() public view returns (address[2] memory) {
    return [address(borrowerNFTManager.getContractAddress()), address(lenderNFTManager.getContractAddress())];
  }

  function createBond(uint32 bondId, uint32 borrowerId, uint32 lenderId, uint256 borrowedAmount, bondRequest memory request) internal {
    bondContractsData[bondId] = bondData(
      borrowerId,
      lenderId,
      request.durationInHours,
      request.intrestYearly,
      uint32(block.timestamp),
      address(this),
      request.collatralToken,
      request.borrowingToken,
      request.collatralAmount,
      borrowedAmount,
      0,
      borrowedAmount,
      false
    );
  }

  function getBondData(uint32 bondId) public view returns (bondData memory) {
    return bondContractsData[bondId];
  }

  function setBondData(address sender, uint32 bondId, bondData memory data) public {
    require(
      msg.sender == address(commsRail) && (sender == borrowerNFTManager.getContractAddress() || sender == lenderNFTManager.getContractAddress()),
      'you are not authorized to do this action'
    );
    bondContractsData[bondId] = data;
  }

  // slither-disable-start costly-loop
  function deleteBondPair(uint32 borrowerId, uint32 lenderId) internal {
    uint256 index = 0;
    uintPair[] memory _bondPairs = bondPairs;
    uint256 len = _bondPairs.length;
    for (uint256 i; i < len; i++) {
      if (_bondPairs[i].borrowerId == borrowerId && _bondPairs[i].lenderId == lenderId) {
        index = i;
        break;
      }
    }

    if (index >= len) {
      bondPairs.pop();
      return;
    }

    for (uint256 i = index; i < len - 1; i++) {
      bondPairs[i] = bondPairs[i + 1];
    }

    bondPairs.pop();
  }
  // slither-disable-end costly-loop

  function liquidate(uint32 borrowerId, uint32 lenderId, uint256 quota) public {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');
    deleteBondPair(borrowerId, lenderId);
    commsRail.liquidateLoan(
      keccak256(abi.encodePacked(borrowerId, lenderId)), borrowerNFTManager.ownerOf(borrowerId), lenderNFTManager.getContractAddress(), quota
    );
    borrowerNFTManager.burnBorrowerContract(borrowerId);
    lenderNFTManager.setLiquidated(lenderId, quota);
  }

  function getBorrowersIds() public view returns (uint32[] memory) {
    return borrowerNFTManager.getIds(msg.sender);
  }

  function getLendersIds() public view returns (uint32[] memory) {
    return lenderNFTManager.getIds(msg.sender);
  }

  function getAddressOfBorrowerContract() public view returns (address) {
    return borrowerNFTManager.getContractAddress();
  }

  function getAddressOfLenderContract() public view returns (address) {
    return lenderNFTManager.getContractAddress();
  }

  // slither-disable-start reentrancy-benign
  // slither-disable-start reentrancy-no-eth
  function lendToBorrower(bondRequest memory request) public payable nonReentrant {
    int256 index = commsRail.indexOfBondRequest(request);
    require(index != -1, 'no bond request for this address');

    uint256 borrowedAmount = commsRail.getRequiredAmountForRequest(request);
    uint32 bondId = getNextId();
    uint32 lenderId = lenderNFTManager.getNextId();
    uint32 borrowerId = borrowerNFTManager.getNextId();
    bondPairs.push(uintPair(borrowerId, lenderId));

    createBond(bondId, borrowerId, lenderId, borrowedAmount, request);
    lenderNFTManager.createLenderNFT(msg.sender, bondId, lenderId);
    borrowerNFTManager.createBorrowerNFT(request.borrower, bondId, borrowerId);

    commsRail.deleteBondRequest(uint256(index));

    address bondBankAddress = commsRail.getAddresses()[1];
    commsRail.spendFromBondContractsManager(request);
    uint256 requiredETHValue =
      (request.collatralToken == address(1) ? request.collatralAmount : 0) + (request.borrowingToken == address(1) ? borrowedAmount : 0);
    uint256 totalToApprove = 0;

    if (request.borrowingToken != address(1)) {
      (bool status, uint256 i) = commsRail.spenderCanSpendAmount(address(this), msg.sender, request.borrowingToken, borrowedAmount);
      require(status, 'an entry was not found with the minimum amount');
      commsRail.spendEntry(address(this), i, borrowedAmount);
      if (request.borrowingToken == request.collatralToken) {
        totalToApprove = borrowedAmount;
      } else {
        require(IERC20(request.borrowingToken).approve(bondBankAddress, borrowedAmount), 'approve failed');
      }
    }

    if (request.collatralToken != address(1)) {
      require(IERC20(request.collatralToken).approve(bondBankAddress, totalToApprove + request.collatralAmount), 'approve failed');
    }
    //slither-disable-next-line arbitrary-send-eth
    commsRail.submitBondEntry{value: requiredETHValue}(
      keccak256(abi.encodePacked(borrowerId, lenderId)), request.collatralToken, request.borrowingToken, request.collatralAmount, borrowedAmount
    );
  }
  // slither-disable-end reentrancy-benign
  // slither-disable-end reentrancy-no-eth
}
