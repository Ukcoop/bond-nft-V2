// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BondRequestBank} from '../modules/bank.sol';
import {ExternalUtils} from '../utils/externalUtils.sol';
import {PriceOracleManager} from '../utils/priceOracleManager.sol';

contract CommsRail {
  ExternalUtils internal immutable externalUtils;
  PriceOracleManager internal immutable priceOracleManager;
  BondRequestBank internal bondRequestBank;
  address internal immutable deployer;

  constructor() {
    externalUtils = new ExternalUtils();
    priceOracleManager = new PriceOracleManager();
    deployer = msg.sender;
  }

  function addAddress(address contractAddress, string memory contractName) public {
    require(msg.sender == deployer, 'you are not authorized to do this action');

    if (keccak256(bytes(contractName)) == keccak256('BondRequestBank')) {
      require(address(bondRequestBank) == address(0), 'this interface was allredy defined');
      bondRequestBank = BondRequestBank(payable(contractAddress));
    } else {
      revert('invalid interface');
    }
  }

  function getAddresses() public view returns (address[1] memory) {
    return [address(bondRequestBank)];
  }

  function getTokenBalance(address token, address addr) public view returns (uint256) {
    return externalUtils.getTokenBalance(token, addr);
  }

  function swapETHforToken(address token) public payable returns (uint256) {
    return externalUtils.swapETHforToken{value: msg.value}(token, msg.sender);
  }

  function getPrice(uint256 amount, address addressA, address addressB) public view returns (uint256 price) {
    return priceOracleManager.getPrice(amount, addressA, addressB);
  }

  function spenderCanSpendAmount(address spender, address allower, address coin, uint256 amount) public view returns (bool, uint256) {
    // slither-disable-next-line unused-return
    return bondRequestBank.spenderCanSpendAmount(spender, allower, coin, amount);
  }

  function submitEntry(address coin, address allower, address spender, uint256 amount) public payable {
    return bondRequestBank.submitEntry{value: msg.value}(coin, allower, spender, amount);
  }

  function spendEntry(address to, uint256 index, uint256 amount) public {
    return bondRequestBank.spendEntry(msg.sender, to, index, amount);
  }
}
