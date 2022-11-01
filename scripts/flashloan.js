const ethers = require("ethers");
const { abi } = require("../artifacts/contracts/FlashSwap.sol/PancakeFlashSwapLive.json");

const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const privateKey = "YOUR PRIVATE KEY HERE";
const signer = new ethers.Wallet(privateKey, provider);
const contractAddress = "0xeaDF9d96584028c37BbBE5b2379F86Da47C9fb19";
const DECIMALS = 18;


const COIN_ZERO = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const COIN_ONE = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const COIN_TWO = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const COIN_THREE = "0x8519EA49c997f50cefFa444d240fB655e89248Aa";


const ADDRs = [COIN_ZERO, COIN_ONE, COIN_TWO, COIN_THREE];

const AMOUNT_HUMAN = "5000";

const AMOUNT_FORMATTED = ethers.utils.parseUnits(AMOUNT_HUMAN, DECIMALS);


const runFlashswap = async () => {

    console.log(" !!! STARTING TRANSACTION !!!");

    const flashswapContract = new ethers.Contract(contractAddress, abi, signer);

    const TX = await flashswapContract.startArbitrage(AMOUNT_FORMATTED, ADDRs);
    const balanceOfBorrowedCoin = await flashswapContract.getBalanceOfToken(COIN_ZERO);
    const balanceOfBorrowedCoinHuman = ethers.utils.formatUnits(balanceOfBorrowedCoin, DECIMALS);

    console.log("!!! ARBITRAGE WAS SUCCESSFUL !!!");
    console.log("!!! CONTRACT BALANCE IS:", balanceOfBorrowedCoinHuman);

    const txReceipt = await provider.getTransactionReceipt(TX.hash);
    const effGasPrice = txReceipt.effectiveGasPrice;
    const txGasUsed = txReceipt.gasUsed;
    const gasUsedETH = effGasPrice * txGasUsed;

    console.log("TOTAL GAS USED  $"+ ethers.utils.formatEther(gasUsedETH.toString()) * 1538);
}

runFlashswap();