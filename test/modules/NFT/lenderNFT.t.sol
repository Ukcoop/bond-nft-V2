// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC721/utils/ERC721Holder.sol';

import {CommsRail} from '../../../src/comms/commsRail.sol';
import {Lender} from '../../../src/modules/NFT/lenderNFT.sol';

import '../../../src/shared.sol';

import {AutomationManagerTest} from '../automationManager.t.sol';
import {BondContractsManagerTest} from '../bondContractsManager.t.sol';
import {BorrowerTest} from './borrowerNFT.t.sol';
import {Test, console} from 'forge-std/Test.sol';

contract LenderTest is Test, HandlesETH, ERC721Holder {
  CommsRail internal commsRail;
  Lender internal lender;
  BondContractsManagerTest internal bondContractsManagerTest;
  AutomationManagerTest internal automationManagerTest;

  address[] public tokenAddresses;

  function setUp() public {
    automationManagerTest = new AutomationManagerTest();
    automationManagerTest.setUp();
    commsRail = automationManagerTest.commsRail();
    lender = Lender(payable(commsRail.lender()));
    BorrowerTest borrowerTest = automationManagerTest.borrowerTest();
    bondContractsManagerTest = borrowerTest.bondContractsManagerTest();
    tokenAddresses = commsRail.getWhitelistedTokens();
  }

  function testLenderNFTWithdraw(
    uint8 withdrawAmount,
    uint8 depositAmount,
    uint64 amountIn,
    uint8 collatralIndex,
    uint8 borrowingIndex,
    uint8 percentage,
    uint16 termInHours,
    uint8 intrest
  ) public returns (bool reverted) {
    withdrawAmount = uint8(bound(withdrawAmount, 0, 100));
    depositAmount = uint8(bound(depositAmount, 0, 100));
    amountIn = uint64(bound(amountIn, 3 * 10 ** 16, 10 ** 18));
    collatralIndex = uint8(bound(collatralIndex, 0, tokenAddresses.length - 1));
    borrowingIndex = uint8(bound(borrowingIndex, 0, tokenAddresses.length - 1));

    try automationManagerTest.testLiquidationOfBond{value: amountIn * 2}(
      withdrawAmount, depositAmount, amountIn, collatralIndex, borrowingIndex, percentage, termInHours, intrest
    ) returns (bool _reverted) {
      reverted = _reverted;
    } catch Error(string memory reason) {
      if(keccak256(bytes(reason)) == keccak256('ERC20: transfer amount exceeds balance')) {
        reverted = true;
        return reverted;
      } else {
        require(false, reason);
      }
    }
    if (reverted) return reverted;

    bondContractsManagerTest.sendLenderNFTToTestContract();

    lender.withdraw(0);
  }
}
