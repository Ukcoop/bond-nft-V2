// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {CommsRail} from '../../src/comms/commsRail.sol';
import {BondBank, BondRequestBank} from '../../src/modules/bank.sol';

import {BondContractsManager} from '../../src/modules/bondContractsManager.sol';
import {AutomationManager} from '../../src/modules/automationManager.sol';
import {RequestManager} from '../../src/modules/requestManager.sol';
import {Test, console} from 'forge-std/Test.sol';

contract CommsRailTest is Test {
  CommsRail internal commsRail;

  function testDeployment() public {
    commsRail = new CommsRail();
    BondRequestBank testBank = new BondRequestBank(address(commsRail));
    BondBank testBondBank = new BondBank(address(commsRail));
    RequestManager requestManager = new RequestManager(address(commsRail));
    BondContractsManager bondContractsManager = new BondContractsManager(address(commsRail));
    AutomationManager automationManager = new AutomationManager(address(commsRail), false);
    address[2] memory nftAddresses = bondContractsManager.getNFTAddresses();
    address[2] memory bondAddresses = bondContractsManager.getBondAddresses();
    commsRail.addAddress(address(testBank), 'BondRequestBank');
    commsRail.addAddress(address(testBondBank), 'BondBank');
    commsRail.addAddress(address(requestManager), 'RequestManager');
    commsRail.addAddress(address(bondContractsManager), 'BondContractsManager');
    commsRail.addAddress(nftAddresses[0], 'BorrowerNFTManager');
    commsRail.addAddress(nftAddresses[1], 'LenderNFTManager');
    commsRail.addAddress(bondAddresses[0], 'Borrower');
    commsRail.addAddress(bondAddresses[1], 'Lender');
    commsRail.addAddress(address(automationManager), 'AutomationManager');
  }
}
