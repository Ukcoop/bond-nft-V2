// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {CommsRail} from '../comms/commsRail.sol';
import '../shared.sol';

contract RequestManager is HandlesETH {
  address[] internal whitelistedTokens;
  bondRequest[] internal bondRequests;
  CommsRail internal immutable commsRail;

  constructor(address _commsRail) {
    address[] memory _whitelistedTokens = new address[](6);
    _whitelistedTokens[0] = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1; // wrapped ETH
    _whitelistedTokens[1] = 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9; // USDT
    _whitelistedTokens[2] = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831; // USDC
    _whitelistedTokens[3] = 0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f; // wrapped BTC
    _whitelistedTokens[4] = 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1; // DAI
    _whitelistedTokens[5] = address(1); // native ETH
    whitelistedTokens = _whitelistedTokens;

    commsRail = CommsRail(_commsRail);
  }

  function getWhitelistedTokens() public view returns (address[] memory) {
    return whitelistedTokens;
  }

  function isWhitelistedToken(address token) public view returns (bool) {
    address[] memory _whitelistedTokens = whitelistedTokens;
    uint256 len = _whitelistedTokens.length;
    for (uint256 i; i < len; i++) {
      if (token == _whitelistedTokens[i]) {
        return true;
      }
    }
    return false;
  }

  function getBondRequests() public view returns (bondRequest[] memory) {
    return bondRequests;
  }

  // slither-disable-start calls-loop
  function getBalances(address addr) public view returns (balancePair[] memory) {
    uint256 len = whitelistedTokens.length;
    balancePair[] memory res = new balancePair[](len);
    address[] memory _whitelistedTokens = whitelistedTokens;

    res[0] = balancePair(address(1), addr.balance);

    for (uint256 i = 1; i < len; i++) {
      res[i] = balancePair(_whitelistedTokens[i - 1], commsRail.getTokenBalance(_whitelistedTokens[i - 1], addr));
    }

    return res;
  }
  // slither-disable-end calls-loop

  function indexOfBondRequest(bondRequest calldata request) public view returns (int256) {
    bondRequest[] memory _bondRequests = bondRequests;
    uint256 len = _bondRequests.length;
    for (uint256 i = 0; i < len; i++) {
      bool isMatching = (
        (_bondRequests[i].borrower == request.borrower) && (_bondRequests[i].collatralToken == request.collatralToken)
          && (_bondRequests[i].collatralAmount == request.collatralAmount) && (_bondRequests[i].borrowingToken == request.borrowingToken)
          && (_bondRequests[i].durationInDays == request.durationInDays) && (_bondRequests[i].intrestYearly == request.intrestYearly)
      );
      if (isMatching) {
        return int256(i);
      }
    }
    return -1;
  }

  function getRequiredAmountForRequest(bondRequest calldata request) public view returns (uint256) {
    uint256 percent = request.borrowingPercentage;
    uint256 full = commsRail.getPrice(
      request.collatralAmount,
      (request.collatralToken == address(1) ? 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 : request.collatralToken),
      (request.borrowingToken == address(1) ? 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 : request.borrowingToken)
    );
    uint256 res = (full * percent) / 100;
    return res;
  }

  function postBondRequest(
    address borrower,
    address collatralToken,
    uint256 collatralAmount,
    address borrowingToken,
    uint32 borrowingPercentage,
    uint32 durationInDays,
    uint32 intrestYearly
  ) public {
    require(collatralAmount != 0, 'cant post a bond with no collatral');
    if (collatralToken != address(1)) require(isWhitelistedToken(collatralToken), 'this token is not whitelisted');
    if (borrowingToken != address(1)) require(isWhitelistedToken(borrowingToken), 'this token is not whitelisted');
    require(borrowingPercentage <= 80 && borrowingPercentage >= 20, 'borrowingPercentage is not in range: (20 to 80)%');
    require(durationInDays >= 1 && durationInDays <= 365, 'bond duration is not in range: (1 to 365 days)');
    require(intrestYearly >= 2 && intrestYearly <= 15, 'intrest is not in this range: (2 to 15)%');

    bondRequests.push(bondRequest(borrower, collatralToken, collatralAmount, borrowingToken, borrowingPercentage, durationInDays, intrestYearly));

    // slither-disable-next-line unused-return
    (bool passed,) = commsRail.requestEntryExists(borrower, collatralToken, borrowingToken, collatralAmount);
    require(passed, 'this entry was not found or has not been made yet');
  }

  function _deleteBondRequest(uint256 index) internal {
    uint256 len = bondRequests.length;
    if (index >= len) {
      bondRequests.pop();
      return;
    }

    for (uint256 i = index; i < len - 1; i++) {
      bondRequests[i] = bondRequests[i + 1];
    }
    bondRequests.pop();
  }

  function deleteBondRequest(uint256 index) public {
    require(msg.sender == address(commsRail), 'you are not authorized to do this action');
    _deleteBondRequest(index);
  }

  function cancelBondRequest(address borrower, bondRequest calldata request) public {
    bondRequest[] memory _bondRequests = bondRequests;
    int256 index = indexOfBondRequest(request);
    require(index != -1, 'no bond request for this address');
    require(_bondRequests[uint256(index)].borrower == borrower, 'not the borrower');
    _deleteBondRequest(uint256(index));
    commsRail.cancelRequestEntry(request.borrower, request.collatralToken, request.borrowingToken, request.collatralAmount);
  }
}
