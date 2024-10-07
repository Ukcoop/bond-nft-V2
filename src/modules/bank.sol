// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';

import {CommsRail} from '../comms/commsRail.sol';
import {HandlesETH} from '../shared.sol';

struct UnifiedBondEntry {
  address collatralToken; // ETH is address(1)
  address borrowingToken; // ETH is address(1)
  uint256 collatralAmount;
  uint256 borrowingAmount;
  uint256 borrowed;
}

contract UnifiedBondBank is HandlesETH {
  CommsRail internal immutable commsRail;
  mapping(bytes32 => UnifiedBondEntry) internal bondEntries;
  mapping(address => UnifiedBondEntry[]) internal entries;

  constructor(address _commsRail) {
    require(_commsRail != address(0), 'commsRail address can not be address(0)');
    commsRail = CommsRail(_commsRail);
  }

  function _removeEntry(address borrower, uint256 index) internal {
    uint256 len = entries[borrower].length;

    if (index == len - 1) {
      entries[borrower].pop();
      return;
    }

    for (uint256 i = index; i < len; i++) {
      entries[borrower][i] = entries[borrower][i + 1];
    }

    entries[borrower].pop();
  }

  function requestEntryExists(address borrower, address collatralToken, address borrowingToken, uint256 collatralAmount)
    public
    view
    returns (bool, uint256)
  {
    UnifiedBondEntry[] memory borrowersEntries = entries[borrower];
    uint256 len = borrowersEntries.length;

    for (uint256 i = 0; i < len; i++) {
      if (
        borrowersEntries[i].collatralToken == collatralToken && borrowersEntries[i].borrowingToken == borrowingToken
          && borrowersEntries[i].collatralAmount == collatralAmount
      ) {
        return (true, i);
      }
    }

    return (false, 0);
  }

  function addRequestEntry(address borrower, address collatralToken, address borrowingToken, uint256 collatralAmount) public payable {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');

    if (collatralToken == address(1)) {
      require(collatralAmount == msg.value, 'amount does not match ETH sent');
    } else {
      IERC20 tokenContract = IERC20(collatralToken);
      uint256 allowance = tokenContract.allowance(borrower, address(this));
      require(allowance >= collatralAmount, 'allowance is not high enough');
    }

    entries[borrower].push(UnifiedBondEntry(collatralToken, borrowingToken, collatralAmount, 0, 0));

    if (collatralToken != address(1)) {
      IERC20 tokenContract = IERC20(collatralToken);
      // msg.sender is set to allower at the commsRail
      //slither-disable-next-line arbitrary-send-erc20
      bool status = tokenContract.transferFrom(borrower, address(this), collatralAmount);
      require(status, 'transferFrom failed');
    }
  }

  function cancelRequestEntry(address borrower, address collatralToken, address borrowingToken, uint256 collatralAmount) public {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');

    (bool passed, uint256 index) = requestEntryExists(borrower, collatralToken, borrowingToken, collatralAmount);
    require(passed, 'this entry was not found');
    UnifiedBondEntry memory entry = entries[borrower][index];

    if (entry.collatralToken == address(1)) {
      _removeEntry(borrower, index);
      sendViaCall(borrower, entry.collatralAmount);
    } else {
      _removeEntry(borrower, index);
      IERC20 tokenContract = IERC20(entry.collatralToken);
      bool status = tokenContract.transfer(borrower, entry.collatralAmount);
      require(status, 'transferFrom failed');
    }
  }

  function compelteBondEntry(
    address borrower,
    address lender,
    uint32 borrowerId,
    uint32 lenderId,
    address collatralToken,
    address borrowingToken,
    uint256 collatralAmount,
    uint256 borrowingAmount
  ) public payable {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');
    if(borrowingToken == address(1)) require(msg.value >= borrowingAmount, 'not enough ETH was sent');

    (bool passed, uint256 index) = requestEntryExists(borrower, collatralToken, borrowingToken, collatralAmount);
    require(passed, 'this entry was not found');
    UnifiedBondEntry memory entry = entries[borrower][index];
    entry.borrowingAmount = borrowingAmount;
    _removeEntry(borrower, index);
    bondEntries[keccak256(abi.encodePacked(borrowerId, lenderId))] = entry;

    if (borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(borrowingToken);
      uint256 borrowingAllowance = tokenContract.allowance(lender, address(this));
      require(borrowingAllowance >= borrowingAmount, 'borrowing token allowance too low');
      // msg.sender is set to allower at the commsRail
      //slither-disable-next-line arbitrary-send-erc20
      bool status = tokenContract.transferFrom(lender, address(this), borrowingAmount);
      require(status, 'transferFrom failed');
    }
  }

  function liquidateLoan(bytes32 uid, address borrower, address lenderContract, uint256 quota) public {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');

    UnifiedBondEntry memory entry = bondEntries[uid];
    uint256 amountNeeded = quota - (entry.borrowingAmount - entry.borrowed);
    uint256 amountUsed = 0;

    if (entry.collatralToken == entry.borrowingToken) {
      if (entry.collatralToken == address(1)) {
        sendViaCall(lenderContract, quota);
        sendViaCall(borrower, entry.collatralAmount - amountNeeded);
      } else {
        IERC20 tokenContract = IERC20(entry.borrowingToken);
        bool status = tokenContract.transfer(lenderContract, quota);
        require(status, 'transfer failed');
        status = tokenContract.transfer(borrower, entry.collatralAmount - amountNeeded);
        require(status, 'transfer failed');
      }
    } else {
      if (entry.collatralToken == address(1)) {
        amountUsed = address(this).balance;
        if (amountNeeded != 0) {
          commsRail.swapETHforToken{value: entry.collatralAmount}(entry.borrowingToken, amountNeeded);
        }
        amountUsed = amountUsed - address(this).balance;
        IERC20 tokenContract = IERC20(entry.borrowingToken);
        bool status = tokenContract.transfer(lenderContract, quota);
        require(status, 'transfer failed');
        sendViaCall(borrower, entry.collatralAmount - amountUsed);
      } else {
        IERC20 tokenContract = IERC20(entry.collatralToken);
        amountUsed = tokenContract.balanceOf(address(this));
        if (entry.borrowingToken == address(1)) {
          if (amountNeeded != 0) {
            bool status = tokenContract.approve(address(commsRail.externalUtils()), entry.collatralAmount);
            require(status, 'approve failed');
            commsRail.swapTokenForETH(entry.collatralToken, entry.collatralAmount, amountNeeded);
          }
          amountUsed -= tokenContract.balanceOf(address(this));
          sendViaCall(lenderContract, quota);
          bool status2 = tokenContract.transfer(borrower, entry.collatralAmount - amountUsed);
          require(status2, 'transfer failed');
        } else {
          IERC20 token2Contract = IERC20(entry.borrowingToken);
          if (amountNeeded != 0) {
            bool status = tokenContract.approve(address(commsRail.externalUtils()), entry.collatralAmount);
            require(status, 'transfer failed');
            commsRail.swapTokenForToken(entry.collatralToken, entry.borrowingToken, entry.collatralAmount, amountNeeded);
          }
          amountUsed -= tokenContract.balanceOf(address(this));
          bool status2 = token2Contract.transfer(lenderContract, quota);
          require(status2, 'transfer failed');
          status2 = tokenContract.transfer(borrower, entry.collatralAmount - amountUsed);
          require(status2, 'transfer failed');
        }
      }
    }
  }

  function withdraw(bytes32 uid, address to, uint256 amount) public {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');
    require(to != address(0), 'the to address can not be address(0)');
    require(amount != 0, 'you can not withdraw nothing');

    UnifiedBondEntry memory entry = bondEntries[uid];
    require(entry.borrowingAmount - entry.borrowed >= amount, 'you are trying to withdraw to much coins');

    entry.borrowed += amount;
    bondEntries[uid] = entry;

    if (entry.borrowingToken == address(1)) {
      sendViaCall(to, amount);
    } else {
      IERC20 tokenContract = IERC20(entry.borrowingToken);
      bool status = tokenContract.transfer(to, amount);
      require(status, 'transfer failed');
    }
  }

  function deposit(bytes32 uid, address sender, uint256 amount) public payable {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');
    require(sender != address(0), 'the sender address can not be address(0)');
    require(amount != 0, 'you can not deposit nothing');
    if (msg.value > 0) require(msg.value == amount, 'amount does not match ETH sent');

    UnifiedBondEntry memory entry = bondEntries[uid];
    require(entry.borrowed >= amount, 'you are trying to deposit to much coins');

    entry.borrowed -= amount;
    bondEntries[uid] = entry;

    if (entry.borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(entry.borrowingToken);
      uint256 allowance = tokenContract.allowance(sender, address(this));
      require(allowance >= amount, 'allowance too low');
      // msg.sender is set to allower at the commsRail
      //slither-disable-next-line arbitrary-send-erc20
      bool status = tokenContract.transferFrom(sender, address(this), amount);
      require(status, 'transferFrom failed');
    }
  }
}
