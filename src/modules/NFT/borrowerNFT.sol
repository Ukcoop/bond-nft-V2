// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/access/Ownable.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC721/extensions/ERC721Burnable.sol';

import '../../shared.sol';

contract BorrowerNFTManager is ERC721Burnable, Ownable, NFTManagerInterface {
  Borrower internal immutable borrowerContract;
  mapping(uint32 => bool) internal burned;
  uint32 internal totalNFTs;

  constructor(address _commsRail, address _lenderNFTManager) ERC721('bond NFT borrower', 'BNFTB') Ownable(msg.sender) {
    borrowerContract = new Borrower(_commsRail, _lenderNFTManager, address(this));
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
    return payable(address(borrowerContract));
  }

  function getIds(address borrower) public view returns (uint32[] memory res) {
    uint32 total = totalNFTs;
    uint32[] memory possibleIds = new uint32[](total);
    uint256 index = 0;

    for (uint32 i; i < total; i++) {
      if (ownerOf(i) == borrower) {
        possibleIds[index] = i;
        index++;
      }
    }

    res = new uint32[](index);
    for (uint256 i; i < index; i++) {
      res[i] = possibleIds[i];
    }
  }

  function createBorrowerNFT(address borrower, uint32 bondId, uint32 borrowerId) public onlyOwner {
    borrowerContract.setBondId(bondId, borrowerId);
    _safeMint(borrower, borrowerId);
    burned[borrowerId] = false;
  }

  function burnBorrowerContract(uint32 id) public onlyOwner {
    _burn(id);
    burned[id] = true;
  }
}

contract Borrower is Bond, HandlesETH {
  constructor(address _commsRail, address _lenderNFTManager, address _borrowerNFTManager) Bond(_commsRail, _lenderNFTManager, _borrowerNFTManager) {}

  event Withdraw(address borrower, uint256 amount);
  event Deposit(address sender, address borrower, uint256 amount);

  function withdraw(uint32 id, uint256 amount) public {
    emit Withdraw(borrowerNFTManager.getOwner(id), amount);
    bondData memory data = getBondData(id);
    require(msg.sender == borrowerNFTManager.getOwner(id), 'you are not the borrower');
    data.borrowed += amount;
    setBondData(id, data);
    require(data.borrowed <= data.borrowingAmount, 'not enough balance');

    /* the tokens will be handeld diffrently with a bank contract
    if(data.borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(data.borrowingToken);
      bool status = tokenContract.transfer(borrowerNFTManager.getOwner(id), amount);
      require(status, 'withdraw failed');
    } else {
      sendETHToBorrower(id, amount);
    }*/
  }

  function deposit(uint32 id, uint256 amount) public payable {
    emit Deposit(msg.sender, borrowerNFTManager.getOwner(id), amount);
    bondData memory data = getBondData(id);
    // this can be called by anywone, for users with bots that want them to pay off debts.
    if (data.borrowingToken == address(0)) require(msg.value == amount, 'amount must match sent ETH');
    require(amount <= data.borrowed, 'you are sending too much tokens');
    data.borrowed -= amount;
    setBondData(id, data);
    /* the tokens will be handeld diffrently with a bank contract
    if(data.borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(data.borrowingToken);
      require(tokenContract.allowance(msg.sender, address(this)) >= amount, 'allowance is not high enough');
      bool status = tokenContract.transferFrom(msg.sender, address(this), amount);
      require(status, 'deposit failed');
    }*/
  }
}
