// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/access/Ownable.sol';
//import {IERC20} from  '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import {ERC721, ERC721Burnable} from '@openzeppelin-contracts-5.0.2/token/ERC721/extensions/ERC721Burnable.sol';

import '../../shared.sol';
//import '../../utils/externalUtils.sol';
//import '../bondContractsManager.sol';

contract LenderNFTManager is ERC721Burnable, Ownable, NFTManagerInterface {
  Lender internal lenderContract;
  mapping(uint32 => bool) internal burned;
  uint32 internal totalNFTs;
  address internal immutable commsRail;

  constructor(address _commsRail) ERC721('bond NFT lender', 'BNFTL') Ownable(msg.sender) {
    require(_commsRail != address(0), 'commsRail address can not be address(0)');
    commsRail = _commsRail;
  }

  function setAddress(address borrowerNFTManager) public onlyOwner {
    lenderContract = new Lender(commsRail, address(this), borrowerNFTManager);
  }

  function getNextId() public onlyOwner returns (uint32) {
    uint32 total = totalNFTs;
    for (uint32 i = 0; i < total; i++) {
      if (burned[i]) {
        return i;
      }
    }
    return totalNFTs++;
  }

  function getOwner(uint32 id) public view returns (address) {
    return ownerOf(id);
  }

  function getContractAddress() public view returns (address payable) {
    return payable(address(lenderContract));
  }

  function getIds(address lender) public view returns (uint32[] memory res) {
    uint32 total = totalNFTs;
    uint32[] memory possibleIds = new uint32[](total);
    uint32 index = 0;

    for (uint32 i; i < total; i++) {
      if (ownerOf(i) == lender) {
        possibleIds[index] = i;
        index++;
      }
    }

    res = new uint32[](index);
    for (uint32 i; i < index; i++) {
      res[i] = possibleIds[i];
    }
  }

  function createLenderNFT(address lender, uint32 bondId, uint32 lenderId) public onlyOwner {
    lenderContract.setBondId(bondId, lenderId);
    _safeMint(lender, lenderId);
    burned[lenderId] = false;
  }

  function burnLenderContract(uint32 id) public onlyOwner {
    _burn(id);
    burned[id] = true;
  }
}

contract Lender is Bond {
  constructor(address _commsRail, address _lenderNFTManager, address _borrowerNFTManager) Bond(_commsRail, _lenderNFTManager, _borrowerNFTManager) {}

  //receive() external payable {}

  // new liquidation logic will be located here
  /* would be needed when liquidation logic is implemented
  function withdraw(address lender, uint32 id) public view {
    bondData memory data = getBondData(id);
    require(lender == lenderNFTManager.getOwner(id), 'you are not the lender');
    require(data.liquidated, 'this bond has not yet been liquidated');

    /* the tokens will be handeld diffrently with a bank contract
    if(data.borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(data.borrowingToken);
      bool status = tokenContract.transfer(lender, data.total);
      require(status, "Withdraw failed");
    } else {
      console.log(address(this).balance, data.total, data.borrowingAmount);
      require(address(this).balance >= data.total, 'lender did not end up with enough ETH');
      sendETHToLender(id, data.total);
    }

    //BondContractsManager burn = BondContractsManager(owner);
    //burn.burnFromLender(id);
  }
  */
}
