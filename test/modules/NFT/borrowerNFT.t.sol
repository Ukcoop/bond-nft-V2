// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC721/utils/ERC721Holder.sol';

import {CommsRail} from '../../../src/comms/commsRail.sol';
import {Borrower} from '../../../src/modules/NFT/borrowerNFT.sol';

import '../../../src/shared.sol';
import {BondContractsManagerTest} from '../bondContractsManager.t.sol';
import {RequestManagerTest} from '../requestManager.t.sol';
import {Test, console} from 'forge-std/Test.sol';

contract BorrowerTest is Test, HandlesETH, ERC721Holder {
  CommsRail internal commsRail;
  Borrower internal borrower;
  BondContractsManagerTest internal bondContractsManagerTest;
  RequestManagerTest internal requestManagerTest;

  address[] public tokenAddresses;

  function setUp() public {
    bondContractsManagerTest = new BondContractsManagerTest();
    requestManagerTest = bondContractsManagerTest.requestManagerTest();
    bondContractsManagerTest.setUp();
    commsRail = bondContractsManagerTest.commsRail();
    borrower = Borrower(commsRail.borrower());
    tokenAddresses = commsRail.getWhitelistedTokens();
  }

  function testBorrowerNFTFunctions(uint8 withdrawAmount, uint8 depositAmount, uint64 amountIn, uint8 collatralIndex, uint8 borrowingIndex, uint8 percentage, uint16 termInHours, uint8 intrest)
    public
    returns (bool reverted)
  {
    withdrawAmount = uint8(bound(withdrawAmount, 0, 100));
    depositAmount = uint8(bound(depositAmount, 0, 100));
    amountIn = uint64(bound(amountIn, 3 * 10 ** 16, 10 ** 18));
    collatralIndex = uint8(bound(collatralIndex, 0, tokenAddresses.length - 1));
    borrowingIndex = uint8(bound(borrowingIndex, 0, tokenAddresses.length - 1));

    reverted = bondContractsManagerTest.testSupplyingABondRequest{value: amountIn}(amountIn, collatralIndex, borrowingIndex, percentage, termInHours, intrest);
    if (reverted) return reverted;

    bondContractsManagerTest.sendBorrowerNFTToTestContract();
    bondData memory data = borrower.getData(0);

    bool withdrawRevert = false;
    bool depositRevert = false;
    if (withdrawAmount == 0) withdrawRevert = true;
    if (depositAmount == 0 || withdrawAmount < depositAmount) depositRevert = true;

    try borrower.withdraw(0, data.borrowingAmount * withdrawAmount / 100) {
      require(!withdrawRevert, 'failed to revert');
    } catch {
      require(withdrawRevert, 'reverted unexpectidly');
    }
    if (data.borrowingToken == address(1)) {
      try borrower.deposit{value: data.borrowingAmount * depositAmount / 100}(0, data.borrowingAmount * depositAmount / 100) {
        require(!depositRevert, 'failed to revert');
      } catch {
        require(depositRevert, 'reverted unexpectidly');
      }
    } else {
      IERC20 token = IERC20(data.borrowingToken);
      token.approve(address(commsRail.bondBank()), data.borrowingAmount * depositAmount / 100);
      try borrower.deposit(0, data.borrowingAmount * depositAmount / 100) {
        require(!depositRevert, 'failed to revert');
      } catch {
        require(depositRevert, 'reverted unexpectidly');
      }
    }
  }
}
