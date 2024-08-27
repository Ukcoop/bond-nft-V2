// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {AutomationManager} from '../../src/modules/automationManager.sol';

import {CommsRail} from '../../src/comms/commsRail.sol';
import '../../src/shared.sol';
import {BorrowerTest} from './NFT/borrowerNFT.t.sol';
import {Test, console} from 'forge-std/Test.sol';

contract AutomationManagerTest is Test {
  BorrowerTest public borrowerTest;
  CommsRail public commsRail;
  AutomationManager internal automationManager;

  address[] public tokenAddresses;

  function setUp() public {
    borrowerTest = new BorrowerTest();
    borrowerTest.setUp();
    commsRail = borrowerTest.commsRail();
    automationManager = new AutomationManager(address(commsRail), true);
    borrowerTest.addAddress(address(automationManager), 'AutomationManager');
    tokenAddresses = commsRail.getWhitelistedTokens();
  }

  function testLiquidationOfBond(
    uint8 withdrawAmount,
    uint8 depositAmount,
    uint64 amountIn,
    uint8 collatralIndex,
    uint8 borrowingIndex,
    uint8 percentage,
    uint16 termInHours,
    uint8 intrest
  ) public payable returns (bool reverted) {
    withdrawAmount = uint8(bound(withdrawAmount, 0, 100));
    depositAmount = uint8(bound(depositAmount, 0, 100));
    amountIn = uint64(bound(amountIn, 3 * 10 ** 16, 10 ** 18));
    collatralIndex = uint8(bound(collatralIndex, 0, tokenAddresses.length - 1));
    borrowingIndex = uint8(bound(borrowingIndex, 0, tokenAddresses.length - 1));

    reverted = borrowerTest.testBorrowerNFTFunctions{value: amountIn}(
      withdrawAmount, depositAmount, amountIn, collatralIndex, borrowingIndex, percentage, termInHours, intrest
    );
    if (reverted) return reverted;

    (bool upkeepNeeded,) = automationManager.checkUpkeep(bytes(''));
    if (upkeepNeeded) {
      try automationManager.performUpkeep(bytes('')) {}
      catch Error(string memory reason) {
        if (keccak256(bytes(reason)) == keccak256('ds-math-sub-underflow')) {
          reverted = true;
          return reverted;
        } else {
          require(false, reason);
        }
      }
    }
  }
}
