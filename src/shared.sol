// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

struct bondRequest {
  address borrower;
  address collatralToken;
  uint256 collatralAmount;
  address borrowingToken;
  uint32 borrowingPercentage;
  uint32 durationInHours;
  uint32 intrestYearly;
}

struct balancePair {
  address token;
  uint256 balance;
}

abstract contract HandlesETH {
  receive() external payable {}

  // slither-disable-start low-level-calls
  // slither-disable-start arbitrary-send-eth
  function sendViaCall(address to, uint256 value) internal {
    require(to != address(0), 'cant send to the 0 address');
    require(value != 0, 'can not send nothing');
    (bool sent,) = payable(to).call{value: value}('');
    require(sent, 'Failed to send Ether');
  }
  // slither-disable-end low-level-calls
  // slither-disable-end arbitrary-send-eth
}
