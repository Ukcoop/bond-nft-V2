// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol';

interface Irouter {
  //slither-disable-next-line naming-convention
  function WETH() external pure returns (address);
  function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory amounts);
  function getAmountsIn(uint256 amountOut, address[] memory path) external view returns (uint256[] memory amounts);
  function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts);
  function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts);
  function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts);
}

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint256 value) external returns (bool);
  function withdraw(uint256) external;
}

contract ExternalUtils {
  Irouter immutable router;

  constructor() {
    router = Irouter(0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506);
  }

  function swapETHforToken(address token, address to) public payable returns (uint256) {
    address[] memory path = new address[](2);
    path[0] = router.WETH();
    path[1] = token;

    if (path[0] == path[1]) {
      IWETH(path[0]).deposit{value: msg.value}();
      require(IWETH(path[0]).transfer(to, msg.value), 'transfer failed');
      return msg.value;
    }

    uint256[] memory amountsOut = router.getAmountsOut(msg.value, path);
    uint256 outMin = amountsOut[1] - (amountsOut[1] / 10);

    return router.swapExactETHForTokens{value: msg.value}(outMin, path, to, block.timestamp + 1200)[1];
  }

  function swapTokenForETH(address token, uint256 amount) public returns (uint256) {
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = router.WETH();

    uint256[] memory amountsOut = router.getAmountsOut(amount, path);
    uint256 outMin = amountsOut[1] - (amountsOut[1] / 10);

    IERC20 tokenContract = IERC20(token);
    require(tokenContract.allowance(msg.sender, address(this)) >= amount, 'allowance is not high enough');
    bool status = tokenContract.transferFrom(msg.sender, address(this), amount);
    require(status, 'transferFrom, failed');
    status = tokenContract.approve(address(router), amount);
    require(status, 'approve failed');

    return router.swapExactTokensForETH(amount, outMin, path, msg.sender, block.timestamp + 1200)[1];
  }

  function swapTokenForToken(address tokenA, address tokenB, uint256 amount) public returns (uint256) {
    address[] memory path = new address[](2);
    path[0] = tokenA;
    path[1] = tokenB;

    IERC20 tokenContract = IERC20(tokenA);
    require(tokenContract.allowance(msg.sender, address(this)) >= amount, 'allowance is not high enough');
    bool status = tokenContract.transferFrom(msg.sender, address(this), amount);
    require(status, 'transferFrom, failed');
    status = tokenContract.approve(address(router), amount);
    require(status, 'approve failed');

    uint256 resAmount = router.getAmountsOut(amount, path)[1];
    return router.swapExactTokensForTokens(amount, resAmount, path, msg.sender, block.timestamp + 1200)[1];
  }

  function getTokenBalance(address token, address addr) public view returns (uint256) {
    return IERC20(token).balanceOf(addr);
  }

  function getAmountIn(address input, address output, uint256 amountRequired) public view returns (uint256) {
    address[] memory path = new address[](2);
    path[0] = input;
    path[1] = output;
    return router.getAmountsIn(amountRequired, path)[0];
  }
}
