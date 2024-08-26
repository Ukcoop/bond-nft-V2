// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {HandlesETH} from '../shared.sol';
import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';

interface Irouter {
  //slither-disable-next-line naming-convention
  function WETH() external pure returns (address);
  function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory amounts);
  function getAmountsIn(uint256 amountOut, address[] memory path) external view returns (uint256[] memory amounts);
  function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
    external
    payable
    returns (uint256[] memory amounts);
  function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
    external
    returns (uint256[] memory amounts);
  function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
    external
    returns (uint256[] memory amounts);
  function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline)
    external
    returns (uint256[] memory amounts);
  function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline)
    external
    payable
    returns (uint256[] memory amounts);
  function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline)
    external
    returns (uint256[] memory amounts);
}

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint256 value) external returns (bool);
  function withdraw(uint256) external;
}

contract ExternalUtils is HandlesETH {
  Irouter immutable router;
  address internal immutable commsRail;

  constructor() {
    router = Irouter(0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506);
    commsRail = msg.sender;
  }

  function canTrade(address token, uint256 amountIn, uint256 amountOutMin) public view returns (bool) {
    address[] memory path = new address[](2);
    path[0] = router.WETH();
    path[1] = token;

    if (path[0] == path[1]) return true;
    uint256[] memory amountsOut = router.getAmountsOut(amountIn, path);
    uint256 amountOutExpected = amountsOut[1];

    return amountOutExpected >= amountOutMin;
  }

  // slither-disable-start timestamp
  function swapETHforToken(address token, address to, uint256 amountOutMin) public payable {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    address[] memory path = new address[](2);
    path[0] = router.WETH();
    path[1] = token;

    if (path[0] == path[1]) {
      if (amountOutMin == 0) {
        IWETH(path[0]).deposit{value: msg.value}();
        require(IWETH(path[0]).transfer(to, msg.value), 'transfer failed');
      } else {
        IWETH(path[0]).deposit{value: amountOutMin}();
        require(IWETH(path[0]).transfer(to, amountOutMin), 'transfer failed');
        sendViaCall(to, msg.value - amountOutMin);
      }
    }

    uint256 amountInUsed;
    uint256[] memory amounts;
    if (amountOutMin == 0) {
      amounts = router.swapExactETHForTokens{value: msg.value}(0, path, to, block.timestamp + 1200);
      amountInUsed = msg.value;
    } else {
      amounts = router.swapETHForExactTokens{value: msg.value}(amountOutMin, path, to, block.timestamp + 1200);
      amountInUsed = amounts[0];
      if (msg.value > amountInUsed) {
        payable(to).transfer(msg.value - amountInUsed);
      }
    }
  }

  function swapTokenForETH(address token, address to, uint256 amount, uint256 amountOutMin) public {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = router.WETH();

    IERC20 tokenContract = IERC20(token);
    require(tokenContract.allowance(to, address(this)) >= amount, 'allowance is not high enough');
    // this function can only be called by the commsRail, witch sets to to msg.sender
    // slither-disable-next-line arbitrary-send-erc20
    bool status = tokenContract.transferFrom(to, address(this), amount);
    require(status, 'transferFrom failed');

    if (token == router.WETH()) {
      if (amountOutMin == 0) {
        IWETH(token).withdraw(amount);
        sendViaCall(to, amount);
      } else {
        IWETH(token).withdraw(amountOutMin);
        sendViaCall(to, amountOutMin);
        status = IWETH(token).transfer(to, amount - amountOutMin);
        require(status, 'transfer failed');
      }
    }

    status = tokenContract.approve(address(router), amount);
    require(status, 'approve failed');

    uint256 amountInUsed;
    uint256[] memory amounts;
    if (amountOutMin == 0) {
      amounts = router.swapExactTokensForETH(amount, 0, path, to, block.timestamp + 1200);
      amountInUsed = amount;
    } else {
      amounts = router.swapTokensForExactETH(amountOutMin, amount, path, to, block.timestamp + 1200);
      amountInUsed = amounts[0];
      if (amount > amountInUsed) {
        status = tokenContract.transfer(to, amount - amountInUsed);
        require(status, 'transfer failed');
      }
    }
  }

  function swapTokenForToken(address tokenA, address tokenB, address to, uint256 amount, uint256 amountOutMin) public {
    require(msg.sender == commsRail, 'you are not authorized to do this action');
    address[] memory path = new address[](2);
    path[0] = tokenA;
    path[1] = tokenB;

    IERC20 tokenContract = IERC20(tokenA);
    require(tokenContract.allowance(to, address(this)) >= amount, 'allowance is not high enough');
    // this function can only be called by the commsRail, witch sets to to msg.sender
    // slither-disable-next-line arbitrary-send-erc20
    bool status = tokenContract.transferFrom(to, address(this), amount);
    require(status, 'transferFrom failed');
    status = tokenContract.approve(address(router), amount);
    require(status, 'approve failed');

    uint256 amountInUsed;
    uint256[] memory amounts;
    if (amountOutMin == 0) {
      amounts = router.swapExactTokensForTokens(amount, 0, path, to, block.timestamp + 1200);
      amountInUsed = amount;
    } else {
      amounts = router.swapTokensForExactTokens(amountOutMin, amount, path, to, block.timestamp + 1200);
      amountInUsed = amounts[0];
      if (amount > amountInUsed) {
        status = tokenContract.transfer(to, amount - amountInUsed);
        require(status, 'transfer failed');
      }
    }
  }
  // slither-disable-end timestamp

  function getTokenBalance(address token, address addr) public view returns (uint256) {
    return IERC20(token).balanceOf(addr);
  }

  function getAmountIn(address input, address output, uint256 amountRequired) public view returns (uint256) {
    address[] memory path = new address[](2);
    path[0] = input;
    path[1] = output;
    if (path[0] == path[1]) return amountRequired;
    return router.getAmountsIn(amountRequired, path)[0];
  }
}
