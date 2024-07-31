// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import "@openzeppelin-contracts-5.0.2/token/ERC721/utils/ERC721Holder.sol";

import {CommsRail} from '../../src/comms/commsRail.sol';
import {BondRequestBank} from '../../src/modules/bank.sol';
import {RequestManager} from '../../src/modules/requestManager.sol';
import {ExternalUtils} from '../../src/utils/externalUtils.sol';
import {Test, console} from 'forge-std/Test.sol';

contract RequestManagerTest is Test, ERC721Holder {
  CommsRail public commsRail;
  RequestManager public requestManager;

  address[] public tokenAddresses;
  address public bondRequestBank;

  function setUp() public {
    commsRail = new CommsRail();
    BondRequestBank testBank = new BondRequestBank(address(commsRail));
    requestManager = new RequestManager(address(commsRail));
    bondRequestBank = address(testBank);
    commsRail.addAddress(address(testBank), 'BondRequestBank');
    commsRail.addAddress(address(requestManager), 'RequestManager');
    tokenAddresses = requestManager.getWhitelistedTokens();
  }

  function addAddress(address contractAddress, string memory contractName) public {
    commsRail.addAddress(contractAddress, contractName);
  }

  function testPostingABondRequest(uint64 amountIn, uint8 collatralIndex, uint8 borrowingIndex, uint8 percentage, uint16 termInHours, uint8 intrest) public payable {
    amountIn = uint64(bound(amountIn, 10 ** 16, 10 ** 20));
    collatralIndex = uint8(bound(collatralIndex, 0, tokenAddresses.length - 1));
    borrowingIndex = uint8(bound(borrowingIndex, 0, tokenAddresses.length - 1));
    percentage = uint8(bound(percentage, 20, 80));
    termInHours = uint16(bound(termInHours, 24, 65535));
    intrest = uint8(bound(intrest, 2, 15));

    address collatral = tokenAddresses[collatralIndex];
    address borrowing = tokenAddresses[borrowingIndex];

    if (collatral == address(1)) {
      requestManager.postBondRequest{value: amountIn}(collatral, amountIn, borrowing, percentage, termInHours, intrest);
    } else {
      uint256 amount = commsRail.swapETHforToken{value: amountIn}(collatral, 0);
      IERC20 token = IERC20(collatral);
      token.approve(bondRequestBank, amount);
      commsRail.submitEntry(collatral, address(this), address(requestManager), amount);
      requestManager.postBondRequest(collatral, amount, borrowing, percentage, termInHours, intrest);
    }
  }
}
