// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.6;

// import "hardhat/console.sol";

// Unisawp libraries and interface import
// librabies 
import "./libraries/UniswapV2Library.sol";
import "./libraries/SafeERC20.sol";

// interfaces
import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./interfaces/IUniswapV2Router02.sol";


contract PancakeFlashSwapLive {
    using SafeERC20 for IERC20;

    // Factory and Router Addresses
    address private constant PANCAKE_FACTORY = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
    address private constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    // Token Addresses 
    address private COIN_ONE;
    address private COIN_TWO;
    address private COIN_THREE;

    // address private constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    // address private constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    // address private constant CAKE = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;
    // address private constant CROX = 0x2c094F5A7D1146BB93850f629501eB749f6Ed491;

    // Trade variable 
    address private constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address private constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address private constant USDC = 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d;
    address private constant CAKE = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;

    // Trade Variables 
    uint256 private MAX_INT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;

    // FUND SMART CONTARCT
    // A function that allows smart contract to be funded 
    function fundFlashSwapContract(address _owner, address _token, uint256 _amount) public {
        IERC20(_token).transferFrom(_owner, address(this), _amount);
    }

    // GET CONTARCT BALANCE 
    // A function to get the balance of a token 
    function getBalanceOfToken(address _token) public view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    // PLACE A TRADE 
    // Executes placing a trade 
    function placeTrade(address _fromToken, address _toToken, uint256 _amountIn) private returns (uint256) {
        address pair = IUniswapV2Factory(PANCAKE_FACTORY).getPair(_fromToken, _toToken);

        require(pair != address(0), "Pool does not exist");

        // Calculate Amount Out
        address[] memory path = new address[](2);
        path[0] = _fromToken;
        path[1] = _toToken;

        uint256 amountRequired = IUniswapV2Router01(PANCAKE_ROUTER).getAmountsOut(_amountIn, path)[1];

        // console.log("Amount Required: ", amountRequired);
        uint256 deadline = block.timestamp + 30 minutes;
        // Perform Arbitrage - Swap token for another token 
        uint256 amountReceived = IUniswapV2Router01(PANCAKE_ROUTER)
            .swapExactTokensForTokens(
                _amountIn, // amountIn
                amountRequired, // amountOutMin
                path, // path
                address(this), // address to
                deadline
            )[1];

        // console.log("Amount Received: ", amountReceived);

        require(amountReceived > 0, "Aborted Tx:, Trade returned zero");

        return amountReceived;
    }

    // CHECK PROFITABILITY 
    // checks if the trade was profitable
    function checkProfitability(uint256 _input, uint256 _output) private pure returns(bool) {
        return _output > _input;
    }

    // INITIATE ARBITRAGE 
    // begins receiving loans to engage performing arbitrage trades 
    function startArbitrage(uint256 _amount, address[3] calldata coins) external {

        // assign or reassign state variables 
        COIN_ONE = coins[0];
        COIN_TWO = coins[1];
        COIN_THREE = coins[2];

        // approve router to spend coins on our behalf 
        IERC20(COIN_ONE).safeApprove(PANCAKE_ROUTER, MAX_INT);
        IERC20(COIN_TWO).safeApprove(PANCAKE_ROUTER, MAX_INT);
        IERC20(COIN_THREE).safeApprove(PANCAKE_ROUTER, MAX_INT);


        // Assign dummy token change if needed
        address dummyToken;
        if (COIN_ONE != WBNB && COIN_TWO != WBNB && COIN_THREE != WBNB) {
            dummyToken = WBNB;
        } else if (
            COIN_ONE != BUSD && COIN_TWO != BUSD && COIN_THREE != BUSD
        ) {
            dummyToken = BUSD;
        } else if (
            COIN_ONE != CAKE && COIN_TWO != CAKE && COIN_THREE != CAKE
        ) {
            dummyToken = CAKE;
        } else {
            dummyToken = USDC;
        }

        // Get the Factory Pair address for combined tokens 
        address pair = IUniswapV2Factory(PANCAKE_FACTORY).getPair(COIN_ONE, dummyToken);

        // Return error is pai does not exist 
        require(pair != address(0), "UniswapV2Factory: Pair does not exist");

        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint256 amount0Out = COIN_ONE == token0 ? _amount : 0;
        uint256 amount1Out = COIN_ONE == token1 ? _amount : 0;

        // Passing data as byted so that the 'swap' function knows it is a flashload 
        bytes memory data = abi.encode(COIN_ONE, _amount, msg.sender);


        // Execute the initial swap to get the loan 
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);

    }

    function pancakeCall(
        address _sender, 
        uint256 _amount0, 
        uint256 _amount1, 
        bytes calldata _data
    ) external {
        // Ensure request came from the contract 
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        address pair = IUniswapV2Factory(PANCAKE_FACTORY).getPair(token0, token1);

        require(msg.sender == pair, "The function caller must match the pair");
        require(_sender == address(this), "Sender must match this contract");

        // Decode data for calculating the repayment 
        (address tokenBorrow, uint256 amount, address myAddress) = abi.decode(_data, (address, uint256, address));

        // Calculate the amount to repay at the end 
        uint256 fee = ((amount * 3) / 997 ) + 1;
        uint256 amountToRepay = amount + fee;

        // DO ARBITRAGE
        // !!!!!!!!!!!!!!!!!!!!!

        // Assign loan amount 
        uint256 loanAmount = _amount0 > 0 ? _amount0 : _amount1;


        // console.log("This is the loan amount", loanAmount);

        // place Trades
        uint256 trade1AcquiedCoin = placeTrade(COIN_ONE, COIN_TWO, loanAmount);
        uint256 trade2AcquiedCoin = placeTrade(COIN_TWO, COIN_THREE, trade1AcquiedCoin);
        uint256 trade3AcquiedCoin = placeTrade(COIN_THREE, COIN_ONE, trade2AcquiedCoin);


        // CHECK PROFITABILITY 
        // check if arbtrage was profitable
        bool profitCheck = checkProfitability(amountToRepay, trade3AcquiedCoin);
        require(profitCheck, "Arbirage was not profitable");


        // PAY YOURSELF 
        uint256 profit = trade3AcquiedCoin - amountToRepay;
        IERC20 otherToken = IERC20(COIN_ONE);
        otherToken.transfer(myAddress, profit);

        // Pay Loan Back 
        IERC20(tokenBorrow).transfer(pair, amountToRepay);
    }

}