// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {CommsRail} from '../../src/comms/commsRail.sol';
import {BondRequestBank} from '../../src/modules/bank.sol';
import {Test, console} from 'forge-std/Test.sol';

contract CommsRailTest is Test {
  CommsRail internal commsRail;

  function testDeployment() public {
    commsRail = new CommsRail();
    BondRequestBank testBank = new BondRequestBank(address(commsRail));
    commsRail.addAddress(address(testBank), 'BondRequestBank');
  }
}
