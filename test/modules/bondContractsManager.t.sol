// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC721/utils/ERC721Holder.sol';

import {CommsRail} from '../../src/comms/commsRail.sol';
import {BondBank} from '../../src/modules/bank.sol';
import {BondContractsManager} from '../../src/modules/bondContractsManager.sol';
import {RequestManager} from '../../src/modules/requestManager.sol';

import '../../src/shared.sol';
import {RequestManagerTest} from './requestManager.t.sol';
import {Test, console} from 'forge-std/Test.sol';

contract BondContractsManagerTest is Test, HandlesETH, ERC721Holder {
  CommsRail public commsRail;
  BondContractsManager public bondContractsManager;
  BondBank public bondBank;
  RequestManager public requestManager;
  RequestManagerTest public requestManagerTest;

  address[] public tokenAddresses;
  address public bondRequestBank;

  function setUp() public {
    requestManagerTest = new RequestManagerTest();
    requestManagerTest.setUp();
    commsRail = requestManagerTest.commsRail();
    bondContractsManager = requestManagerTest.bondContractsManager();
    bondBank = new BondBank(address(commsRail));
    address[2] memory nftAddresses = bondContractsManager.getNFTAddresses();
    address[2] memory bondAddresses = bondContractsManager.getBondAddresses();
    requestManagerTest.addAddress(nftAddresses[1], 'LenderNFTManager');
    requestManagerTest.addAddress(bondAddresses[0], 'Borrower');
    requestManagerTest.addAddress(bondAddresses[1], 'Lender');
    requestManagerTest.addAddress(address(bondBank), 'BondBank');
    requestManager = requestManagerTest.requestManager();
    tokenAddresses = requestManager.getWhitelistedTokens();
    bondRequestBank = requestManagerTest.bondRequestBank();
  }

  function sendBorrowerNFTToTestContract() public {
    requestManagerTest.sendNFTToTestContract(msg.sender);
  }

  function testSupplyingABondRequest(uint64 amountIn, uint8 collatralIndex, uint8 borrowingIndex, uint8 percentage, uint16 termInHours, uint8 intrest) public payable returns (bool reverted) {
    amountIn = uint64(bound(amountIn, 3 * 10 ** 16, 10 ** 18));
    collatralIndex = uint8(bound(collatralIndex, 0, tokenAddresses.length - 1));
    borrowingIndex = uint8(bound(borrowingIndex, 0, tokenAddresses.length - 1));

    reverted = requestManagerTest.testPostingABondRequest{value: amountIn / 2}(amountIn / 2, collatralIndex, borrowingIndex, percentage, termInHours, intrest);
    if (reverted) return reverted;

    bondRequest memory request = requestManager.getBondRequests()[0];

    if (request.borrowingToken == address(1)) {
      uint256 amount = requestManager.getRequiredAmountForRequest(request);
      if (amount > address(this).balance) vm.assume(false);
      bondContractsManager.lendToBorrower{value: amount}(request);
    } else {
      uint256 amountRequired = requestManager.getRequiredAmountForRequest(request);
      if (!commsRail.canTrade(request.borrowingToken, amountIn, amountRequired)) vm.assume(false);
      if (amountIn > address(this).balance) amountIn = uint64(address(this).balance * 90 / 100);
      uint256 amount;
      try commsRail.swapETHforToken{value: amountIn}(request.borrowingToken, amountRequired) returns (uint256 returned) {
        amount = returned;
      } catch {
        vm.assume(false);
      }
      if (amount < amountRequired) vm.assume(false);
      IERC20 token = IERC20(request.borrowingToken);
      token.approve(bondRequestBank, amountRequired);
      commsRail.submitEntry(request.borrowingToken, address(this), address(bondContractsManager), amountRequired);
      bondContractsManager.lendToBorrower(request);
    }
  }
}
