// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';

import {HandlesETH} from '../shared.sol';

struct BondRequestEntry {
  address coin; // ETH is address(1)
  address allower;
  uint256 amount;
}

struct BondEntry {
  address collatralToken; // ETH is address(1)
  address borrowingToken; // ETH is address(1)
  uint256 collatralAmount;
  uint256 borrowingAmount;
  uint256 borrowed;
}

contract BondRequestBank is HandlesETH {
  address internal immutable commsRail;
  mapping(address => BondRequestEntry[]) internal entries;

  constructor(address _commsRail) {
    require(_commsRail != address(0), 'commsRail address can not be address(0)');
    commsRail = _commsRail;
  }

  function spenderCanSpendAmount(address spender, address allower, address coin, uint256 amount) public view returns (bool, uint256) {
    bool passed = false;
    uint256 index = 0;
    BondRequestEntry[] memory spendersEntries = entries[spender];

    for (uint256 i = 0; i < spendersEntries.length; i++) {
      if (spendersEntries[i].coin == coin && spendersEntries[i].allower == allower && spendersEntries[i].amount == amount) {
        passed = true;
        index = i;
      }
    }

    return (passed, index);
  }

  function _removeEntry(address spender, uint256 index) internal {
    uint256 len = entries[spender].length;

    if (index == len) return;

    for (uint256 i = index; i < len; i++) {
      entries[spender][i] = entries[spender][i + 1];
    }

    entries[spender].pop();
  }

  function submitEntry(address coin, address allower, address spender, uint256 amount) public payable {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    if (coin == address(1)) {
      require(amount == msg.value, 'amount does not match ETH sent');
    } else {
      IERC20 tokenContract = IERC20(coin);
      uint256 allowance = tokenContract.allowance(allower, address(this));
      require(allowance >= amount, 'allowance is not high enough');
    }

    entries[spender].push(BondRequestEntry(coin, allower, amount));
    if (coin != address(1)) {
      IERC20 tokenContract = IERC20(coin);
      // msg.sender is set to allower at the commsRail
      //slither-disable-next-line arbitrary-send-erc20
      bool status = tokenContract.transferFrom(allower, address(this), amount);
      require(status, 'transferFrom failed');
    }
  }

  function spendEntry(address spender, address to, uint256 index, uint256 amount) public {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    BondRequestEntry memory entry = entries[spender][index];
    require(entry.amount == amount, 'this entry does not have the amount provided');

    if (entry.coin == address(1)) {
      _removeEntry(msg.sender, index);
      sendViaCall(to, entry.amount);
    } else {
      _removeEntry(msg.sender, index);
      IERC20 tokenContract = IERC20(entry.coin);
      bool status = tokenContract.transfer(to, entry.amount);
      require(status, 'transferFrom failed');
    }
  }
}

contract BondBank is HandlesETH {
  address internal immutable commsRail;
  mapping(bytes32 => BondEntry) internal entries;

  constructor(address _commsRail) {
    require(_commsRail != address(0), 'commsRail address can not be address(0)');
    commsRail = _commsRail;
  }

  function submitBondEntry(address sender, bytes32 uid, address collatralToken, address borrowingToken, uint256 collatralAmount, uint256 borrowingAmount) public payable {
    require(msg.sender == commsRail, 'you are not authorized to do this action');

    uint256 requiredETHValue = (collatralToken == address(1) ? collatralAmount : 0) + (borrowingToken == address(1) ? borrowingAmount : 0);
    if (requiredETHValue > 0) require(msg.value >= requiredETHValue, 'not enough ETH was sent');
    entries[uid] = BondEntry(collatralToken, borrowingToken, collatralAmount, borrowingAmount, 0);

    if (collatralToken != address(1)) {
      IERC20 tokenContract = IERC20(collatralToken);
      uint256 collateralAllowance = tokenContract.allowance(sender, address(this));
      require(collateralAllowance >= collatralAmount, 'collateral token allowance too low');
      // msg.sender is set to allower at the commsRail
      //slither-disable-next-line arbitrary-send-erc20
      bool status = tokenContract.transferFrom(sender, address(this), collatralAmount);
      require(status, 'transferFrom failed');
    }

    if (borrowingToken != address(1)) {
      IERC20 tokenContract = IERC20(borrowingToken);
      uint256 borrowingAllowance = tokenContract.allowance(sender, address(this));
      require(borrowingAllowance >= borrowingAmount, 'borrowing token allowance too low');
      // msg.sender is set to allower at the commsRail
      //slither-disable-next-line arbitrary-send-erc20
      bool status = tokenContract.transferFrom(sender, address(this), borrowingAmount);
      require(status, 'transferFrom failed');
    }
  }

  function withdraw(bytes32 uid, address to, uint256 amount) public {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    require(to != address(0), 'the to address can not be address(0)');
    require(amount != 0, 'you can not withdraw nothing');

    BondEntry memory entry = entries[uid];
    require(entry.borrowingAmount - entry.borrowed >= amount, 'you are trying to withdraw to much coins');

    entry.borrowed += amount;
    entries[uid] = entry;

    if (entry.borrowingToken == address(1)) {
      sendViaCall(to, amount);
    } else {
      IERC20 tokenContract = IERC20(entry.borrowingToken);
      bool status = tokenContract.transfer(to, amount);
      require(status, 'transfer failed');
    }
  }

  function deposit(bytes32 uid, address sender, uint256 amount) public payable {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    require(sender != address(0), 'the sender address can not be address(0)');
    require(amount != 0, 'you can not deposit nothing');
    if (msg.value > 0) require(msg.value == amount, 'amount does not match ETH sent');

    BondEntry memory entry = entries[uid];
    require(entry.borrowed >= amount, 'you are trying to deposit to much coins');

    entry.borrowed -= amount;
    entries[uid] = entry;

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
