// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BondBank, BondRequestBank} from '../modules/bank.sol';

import {BondContractsManager} from '../modules/bondContractsManager.sol';
import {RequestManager} from '../modules/requestManager.sol';

import '../shared.sol';
import {ExternalUtils} from '../utils/externalUtils.sol';
import {PriceOracleManager} from '../utils/priceOracleManager.sol';

contract CommsRail {
  ExternalUtils internal immutable externalUtils;
  PriceOracleManager internal immutable priceOracleManager;
  BondRequestBank internal bondRequestBank;
  BondBank internal bondBank;
  RequestManager internal requestManager;
  BondContractsManager internal bondContractsManager;
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
    } else if (keccak256(bytes(contractName)) == keccak256('BondBank')) {
      bondBank = BondBank(payable(contractAddress));
    } else if (keccak256(bytes(contractName)) == keccak256('RequestManager')) {
      require(address(requestManager) == address(0), 'this interface was allredy defined');
      requestManager = RequestManager(payable(contractAddress));
    } else if (keccak256(bytes(contractName)) == keccak256('BondContractsManager')) {
      require(address(bondContractsManager) == address(0), 'this interface was allredy defined');
      bondContractsManager = BondContractsManager(payable(contractAddress));
    } else {
      revert('invalid interface');
    }
  }

  function getAddresses() public view returns (address[2] memory) {
    return [address(bondContractsManager), address(bondBank)];
  }

  function getTokenBalance(address token, address addr) public view returns (uint256) {
    return externalUtils.getTokenBalance(token, addr);
  }

  function getAmountIn(address input, address output, uint256 amountRequired) public view returns (uint256) {
    return externalUtils.getAmountIn(input, output, amountRequired);
  }

  function canTrade(address token, uint256 amountIn, uint256 amountOutMin) public view returns (bool) {
    return externalUtils.canTrade(token, amountIn, amountOutMin);
  }

  function swapETHforToken(address token, uint256 amountOut) public payable returns (uint256) {
    return externalUtils.swapETHforToken{value: msg.value}(token, msg.sender, amountOut);
  }

  function getPrice(uint256 amount, address addressA, address addressB) public view returns (uint256 price) {
    return priceOracleManager.getPrice(amount, addressA, addressB);
  }

  function spenderCanSpendAmount(address spender, address allower, address coin, uint256 amount) public view returns (bool, uint256) {
    require(msg.sender == address(requestManager) || msg.sender == address(bondContractsManager), 'you are not authorized to do this action');
    // slither-disable-next-line unused-return
    return bondRequestBank.spenderCanSpendAmount(spender, allower, coin, amount);
  }

  function submitEntry(address coin, address allower, address spender, uint256 amount) public payable {
    return bondRequestBank.submitEntry{value: msg.value}(coin, allower, spender, amount);
  }

  function submitBondEntry(bytes32 uid, address collatralToken, address borrowingToken, uint256 collatralAmount, uint256 borrowingAmount) public payable {
    return bondBank.submitBondEntry{value: msg.value}(msg.sender, uid, collatralToken, borrowingToken, collatralAmount, borrowingAmount);
  }

  function spendEntry(address to, uint256 index, uint256 amount) public {
    require(msg.sender == address(requestManager) || msg.sender == address(bondContractsManager), 'you are not authorized to do this action');
    return bondRequestBank.spendEntry(msg.sender, to, index, amount);
  }

  function indexOfBondRequest(bondRequest calldata request) public view returns (int256) {
    return requestManager.indexOfBondRequest(request);
  }

  function getRequiredAmountForRequest(bondRequest calldata request) public view returns (uint256) {
    return requestManager.getRequiredAmountForRequest(request);
  }

  function deleteBondRequest(uint256 index) public {
    require(msg.sender == address(bondContractsManager), 'you are not authorized to do this action');
    return requestManager.deleteBondRequest(index);
  }

  function spendFromBondContractsManager(bondRequest calldata request) public {
    require(msg.sender == address(bondContractsManager), 'you are not authorized to do this action');
    return requestManager.spendFromBondContractsManager(address(bondContractsManager), request);
  }

  function getBondData(uint32 bondId) public view returns (bondData memory) {
    return bondContractsManager.getBondData(bondId);
  }

  function setBondData(uint32 bondId, bondData memory data) public {
    return bondContractsManager.setBondData(msg.sender, bondId, data);
  }
}
