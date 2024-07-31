// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {CommsRail} from '../../src/comms/commsRail.sol';
import {BondBank, BondRequestBank} from '../../src/modules/bank.sol';

import {BondContractsManager} from '../../src/modules/bondContractsManager.sol';
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
    commsRail.addAddress(address(testBank), 'BondRequestBank');
    commsRail.addAddress(address(testBondBank), 'BondBank');
    commsRail.addAddress(address(requestManager), 'RequestManager');
    commsRail.addAddress(address(bondContractsManager), 'BondContractsManager');
  }
}
