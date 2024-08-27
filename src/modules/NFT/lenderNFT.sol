// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/access/Ownable.sol';
import {IERC20} from '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import {ERC721, ERC721Burnable} from '@openzeppelin-contracts-5.0.2/token/ERC721/extensions/ERC721Burnable.sol';

import '../../shared.sol';

contract LenderNFTManager is ERC721Burnable, Ownable, NFTManagerInterface {
  Lender internal immutable lenderContract;
  mapping(uint32 => bool) internal burned;
  uint32 internal totalNFTs;
  address internal immutable commsRail;

  constructor(address _commsRail) ERC721('bond NFT lender', 'BNFTL') Ownable(msg.sender) {
    require(_commsRail != address(0), 'commsRail address can not be address(0)');
    commsRail = _commsRail;
    lenderContract = new Lender(commsRail, address(this));
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

  function setLiquidated(uint32 id, uint256 quota) public onlyOwner {
    lenderContract.setLiquidated(id, quota);
  }
}

contract Lender is BondQueries, InterfacesWithNFTManager, HandlesETH {
  constructor(address _commsRail, address _lenderNFTManager) BondQueries(_commsRail, _lenderNFTManager) InterfacesWithNFTManager(_lenderNFTManager) {}

  function setLiquidated(uint32 id, uint256 quota) public {
    require(msg.sender == address(NFTManager), 'you are not authorized to do this action');
    bondData memory data = getBondData(id);
    data.liquidated = true;
    data.total = quota;
    setBondData(id, data);
  }

  function withdraw(uint32 id) public {
    bondData memory data = getBondData(id);
    require(msg.sender == NFTManager.getOwner(id), 'you are not the lender');
    require(data.liquidated, 'this bond has not yet been liquidated');

    if (data.borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(data.borrowingToken);
      bool status = tokenContract.transfer(msg.sender, data.total);
      require(status, 'Withdraw failed');
    } else {
      require(address(this).balance >= data.total, 'lender did not end up with enough ETH');
      sendViaCall(msg.sender, data.total);
    }
  }
}
