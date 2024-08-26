// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC721/IERC721.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC721/utils/ERC721Holder.sol';

import {CommsRail} from '../../src/comms/commsRail.sol';
import {BondRequestBank} from '../../src/modules/bank.sol';

import {BondContractsManager} from '../../src/modules/bondContractsManager.sol';
import {RequestManager} from '../../src/modules/requestManager.sol';
import {ExternalUtils} from '../../src/utils/externalUtils.sol';
import {Test, console} from 'forge-std/Test.sol';

contract RequestManagerTest is Test, ERC721Holder {
  CommsRail public commsRail;
  RequestManager public requestManager;
  BondContractsManager public bondContractsManager;

  address[] public tokenAddresses;
  address public bondRequestBank;

  function setUp() public {
    commsRail = new CommsRail();
    BondRequestBank testBank = new BondRequestBank(address(commsRail));
    requestManager = new RequestManager(address(commsRail));
    bondContractsManager = new BondContractsManager(address(commsRail));
    bondRequestBank = address(testBank);
    address[2] memory nftAddresses = bondContractsManager.getNFTAddresses();
    commsRail.addAddress(nftAddresses[0], 'BorrowerNFTManager');
    commsRail.addAddress(address(bondContractsManager), 'BondContractsManager');
    commsRail.addAddress(address(testBank), 'BondRequestBank');
    commsRail.addAddress(address(requestManager), 'RequestManager');
    tokenAddresses = requestManager.getWhitelistedTokens();
  }

  function addAddress(address contractAddress, string memory contractName) public {
    commsRail.addAddress(contractAddress, contractName);
  }

  function sendNFTToTestContract(address to) public {
    IERC721 nft = IERC721(commsRail.borrowerNFTManager());
    nft.safeTransferFrom(address(this), to, 0);
  }

  function testPostingABondRequest(uint64 amountIn, uint8 collatralIndex, uint8 borrowingIndex, uint8 percentage, uint16 termInHours, uint8 intrest)
    public
    payable
    returns (bool)
  {
    amountIn = uint64(bound(amountIn, 10 ** 16, 10 ** 20));
    collatralIndex = uint8(bound(collatralIndex, 0, tokenAddresses.length - 1));
    borrowingIndex = uint8(bound(borrowingIndex, 0, tokenAddresses.length - 1));

    bool expectRevert = false;
    if (percentage > 80 || percentage < 20) expectRevert = true;
    if (termInHours < 24) expectRevert = true;
    if (intrest > 15 || intrest < 2) expectRevert = true;

    address collatral = tokenAddresses[collatralIndex];
    address borrowing = tokenAddresses[borrowingIndex];

    if (collatral == address(1)) {
      try requestManager.postBondRequest{value: amountIn}(collatral, amountIn, borrowing, percentage, termInHours, intrest) {
        require(!expectRevert, 'failed to revert');
      } catch {
        require(expectRevert, 'reverted unexpectidly');
      }
    } else {
      try commsRail.swapETHforToken{value: amountIn}(collatral, 0) {}
      catch {
        return true;
      }
      IERC20 token = IERC20(collatral);
      uint256 amount = token.balanceOf(address(this));
      token.approve(bondRequestBank, amount);
      commsRail.submitEntry(collatral, address(this), address(requestManager), amount);
      try requestManager.postBondRequest(collatral, amount, borrowing, percentage, termInHours, intrest) {
        require(!expectRevert, 'failed to revert');
      } catch {
        require(expectRevert, 'reverted unexpectidly');
      }
    }
    return expectRevert;
  }
}
