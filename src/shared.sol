// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {CommsRail} from './comms/commsRail.sol';

struct bondRequest {
  address borrower;
  address collatralToken;
  uint256 collatralAmount;
  address borrowingToken;
  uint32 borrowingPercentage;
  uint32 durationInHours;
  uint32 intrestYearly;
}

struct uintPair {
  uint32 borrowerId;
  uint32 lenderId;
}

struct balancePair {
  address token;
  uint256 balance;
}

struct bondData {
  uint32 borrowerId;
  uint32 lenderId;
  uint32 durationInHours;
  uint32 interestYearly;
  uint32 startTime;
  address owner;
  address collatralToken; // this will be address(1) for native eth
  address borrowingToken; // this will be address(1) for native eth
  uint256 collatralAmount;
  uint256 borrowingAmount;
  uint256 borrowed;
  uint256 total;
  bool liquidated;
}

interface BondInterface {
  function getData() external view returns (bondData memory);
  function getOwed() external view returns (uint256);
  function hasMatured() external view returns (bool);
  function isUnderCollateralized() external view returns (bool);
}

interface NFTManagerInterface {
  function getOwner(uint32 id) external view returns (address);
  function getContractAddress() external view returns (address payable);
}

abstract contract HandlesETH {
  receive() external payable {}

  // slither-disable-start low-level-calls
  // slither-disable-start arbitrary-send-eth
  function sendViaCall(address to, uint256 value) internal {
    require(to != address(0), 'cant send to the 0 address');
    require(value != 0, 'can not send nothing');
    (bool sent,) = payable(to).call{value: value}('');
    require(sent, 'Failed to send Ether');
  }
  // slither-disable-end low-level-calls
  // slither-disable-end arbitrary-send-eth
}

contract Bond {
  mapping(uint32 => uint32) internal toBondId;
  NFTManagerInterface internal immutable lenderNFTManager;
  NFTManagerInterface internal immutable borrowerNFTManager;
  CommsRail internal immutable commsRail;

  constructor(address _commsRail, address _lenderNFTManager, address _borrowerNFTManager) {
    commsRail = CommsRail(_commsRail);
    lenderNFTManager = NFTManagerInterface(_lenderNFTManager);
    borrowerNFTManager = NFTManagerInterface(_borrowerNFTManager);
  }

  function setBondId(uint32 bondId, uint32 nftId) public {
    require(msg.sender == address(lenderNFTManager) || msg.sender == address(borrowerNFTManager), ' you are not authorized to do this action');
    toBondId[nftId] = bondId;
  }

  function getBondData(uint32 id) internal view returns (bondData memory) {
    return commsRail.getBondData(toBondId[id]);
  }

  function setBondData(uint32 id, bondData memory data) internal {
    commsRail.setBondData(toBondId[id], data);
  }

  function getData(uint32 id) public view returns (bondData memory) {
    return getBondData(id);
  }

  // slither-disable-start timestamp
  // slither-disable-start divide-before-multiply
  // slither-disable-start assembly
  function getOwed(uint32 id) public view returns (uint256 owed) {
    bondData memory data = getBondData(id);
    uint256 start = data.startTime;
    uint32 interestYearly = data.interestYearly;
    uint256 borrowing = data.borrowingAmount;

    assembly {
      let currentTime := timestamp()
      let elapsedTime := sub(currentTime, start)
      let interestRatePerSecond := div(mul(interestYearly, exp(10, 18)), mul(36525, 86400))
      let interestAccrued := div(mul(interestRatePerSecond, elapsedTime), exp(10, 20))
      let totalOwed := add(borrowing, mul(borrowing, interestAccrued))
      owed := totalOwed
    }
  }
  // slither-disable-end divide-before-multiply
  // slither-disable-end assembly

  function hasMatured(uint32 id) public view returns (bool) {
    bondData memory data = getBondData(id);
    return ((block.timestamp - data.startTime) / 3600) >= data.durationInHours;
  }
  // slither-disable-end timestamp

  function getCollatralizationPercentage(uint32 id) public view returns (uint256) {
    bondData memory data = getBondData(id);
    uint256 collatralValue = commsRail.getPrice(
      data.collatralAmount,
      (data.collatralToken == address(1) ? 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 : data.collatralToken),
      (data.borrowingToken == address(1) ? 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 : data.borrowingToken)
    );
    return ((data.borrowed * 100) / (collatralValue * 100));
  }

  function isUnderCollateralized(uint32 id) public view returns (bool) {
    bondData memory data = getBondData(id);
    if (data.borrowed == 0) return false;
    return getCollatralizationPercentage(id) >= 90;
  }

  /*
  // slither-disable-start low-level-calls
  // slither-disable-start arbitrary-send-eth
  function sendETHToBorrower(uint32 id, uint256 value) internal {
    bondData memory data = getBondData(id);
    require(value != 0, 'cannot send nothing');
  (bool sent,) = payable(borrowerNFTManager.getOwner(data.borrowerId)).call{value: value}(''); // the owner of the nft is the only address that this
  function will send eth to.
    require(sent, 'Failed to send Ether');
  }
  */

  function sendETHToLender(uint32 id, uint256 value) internal {
    bondData memory data = getBondData(id);
    require(value != 0, 'cannot send nothing');
    (bool sent,) = payable(lenderNFTManager.getOwner(data.lenderId)).call{value: value}(''); // the owner of the nft is the only address that this
      // function will send eth to.
    require(sent, 'Failed to send Ether');
  }

  // slither-disable-end low-level-calls
  // slither-disable-end arbitrary-send-eth
}
