// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {AutomationCompatibleInterface} from '@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol';

import {CommsRail} from '../comms/commsRail.sol';
import {Lender} from '../modules/NFT/lenderNFT.sol';
import '../shared.sol';

contract AutomationManager is AutomationCompatibleInterface {
  bool internal immutable testing;
  CommsRail internal immutable commsRail;

  constructor(address _commsRail, bool _testing) {
    testing = _testing;
    commsRail = CommsRail(_commsRail);
  }

  function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory data) {
    upkeepNeeded = false;
    data = bytes('');
    Bond bondContractInstance = Bond(commsRail.lender());
    uintPair[] memory bondPairs = commsRail.getBondPairs();
    uint256 len = bondPairs.length;

    // slither-disable-start calls-loop
    for (uint256 i = 0; i < len; i++) {
      bool yes =
        testing || bondContractInstance.isUnderCollateralized(bondPairs[i].lenderId) || bondContractInstance.hasMatured(bondPairs[i].lenderId);
      if (yes) {
        upkeepNeeded = true;
      }
    }
    // slither-disable-end calls-loop
  }

  function performUpkeep(bytes calldata) external override {
    Bond bondContractInstance = Bond(commsRail.lender());
    uintPair[] memory bondPairs = commsRail.getBondPairs();
    uint256 len = bondPairs.length;

    // slither-disable-start calls-loop
    for (uint256 i; i < len; i++) {
      bool yes =
        testing || bondContractInstance.isUnderCollateralized(bondPairs[i].lenderId) || bondContractInstance.hasMatured(bondPairs[i].lenderId);
      if (yes) {
        commsRail.liquidate(bondPairs[i].borrowerId, bondPairs[i].lenderId, bondContractInstance.getOwed(bondPairs[i].lenderId));
      }
    }
    // slither-disable-end calls-loop
  }
}
