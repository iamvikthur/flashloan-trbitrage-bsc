const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { impersonateFundErc20 } = require("../utils/utilities");
const { abi } = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");
const provider = ethers.provider;

describe("Flashswap contract", () => {
    let FLASHSWAP, BORROW_AMOUNT, INITIAL_FUND_HUMAN, FUND_AMOUNT, TX_ARBITRAGE, GAS_USED_USD;
    const DECIMALS = 18;
    const BUSD_WALE = "0x5a52e96bacdabb82fd05763e25335261b270efcb";
    const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
    const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
    const CROX = "0x2c094F5A7D1146BB93850f629501eB749f6Ed491";

    const BASE_TOKEN_ADDRESS = BUSD;
    const TOKEN_BASE = new ethers.Contract(BASE_TOKEN_ADDRESS, abi, provider);

    beforeEach(async () => {
        //get owner as signer
        [owner] = await ethers.getSigners();

        // ensure that the WALE has a balance 
        const whale_balance = await provider.getBalance(BUSD_WALE);
        expect(whale_balance).not.equal("0");

        // Deploy smart contract 
        const FlashSwap = await ethers.getContractFactory("PancakeFlashSwapLive");
        FLASHSWAP = await FlashSwap.deploy();
        await FLASHSWAP.deployed();

        // Configure Our Borrowing 
        const borrowAmountHuman = "1";
        BORROW_AMOUNT = ethers.utils.parseUnits(borrowAmountHuman, DECIMALS);

        // Configure Funding - FOR TESTING ONLY 
        INITIAL_FUND_HUMAN = "100";
        FUND_AMOUNT = ethers.utils.parseUnits(INITIAL_FUND_HUMAN, DECIMALS);

        // Fund our Contract - FOR TESTING ONLY 
        await impersonateFundErc20(TOKEN_BASE, BUSD_WALE, FLASHSWAP.address, INITIAL_FUND_HUMAN);
    });

    describe("Arbitrage Execution", () => {
        it("Ensures the contract is funded", async () => {
            const flashSwapBlance = await FLASHSWAP.getBalanceOfToken(BASE_TOKEN_ADDRESS);

            const flashSwapBalanceHuman = ethers.utils.formatUnits(flashSwapBlance, DECIMALS);

            console.log(flashSwapBalanceHuman);

            expect(Number(flashSwapBalanceHuman)).to.equal(Number(INITIAL_FUND_HUMAN))
        })

        it("Execute's arbitrage", async () => {

            const ADDRESSES = [WBNB, BUSD, CAKE, CROX];

            TX_ARBITRAGE = await FLASHSWAP.startArbitrage(BORROW_AMOUNT, ADDRESSES);

            assert(TX_ARBITRAGE);

            // // Print balance of BUSD
            const contractBalanceBUSD = await FLASHSWAP.getBalanceOfToken(BUSD);
            const contractBalanceBUSDHuman = Number(ethers.utils.formatUnits(contractBalanceBUSD, DECIMALS));
            console.log("Balance of contract, BUSD: " , contractBalanceBUSDHuman)

            // print balance of CROX 
            const contractBalanceCROX = await FLASHSWAP.getBalanceOfToken(CROX);
            const contractBalanceCROXHuman = Number(ethers.utils.formatUnits(contractBalanceCROX, DECIMALS));
            console.log("Balance of contract, CROX: " , contractBalanceCROXHuman)

            // print balance of CAKE 
            const contractBalanceCAKE = await FLASHSWAP.getBalanceOfToken(CAKE);
            const contractBalanceCAKEHuman = Number(ethers.utils.formatUnits(contractBalanceCAKE, DECIMALS));
            console.log("Balance of contract, CAKE: " , contractBalanceCAKEHuman)
        })

        it("Outputs gas price", async () => {
            const txReceipt = await provider.getTransactionReceipt(TX_ARBITRAGE.hash);
            const effGasPrice = txReceipt.effectiveGasPrice;
            const txGasUsed = txReceipt.gasUsed;
            const gasUsedETH = effGasPrice * txGasUsed;
            console.log("Total Gas Used: "+ ethers.utils.formatEther(gasUsedETH.toString()) * 1538);
            expect(gasUsedETH).not.equal(0);
        });
    })
})