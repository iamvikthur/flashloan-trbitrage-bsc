require("@nomicfoundation/hardhat-toolbox");

require("@nomiclabs/hardhat-etherscan");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.5.0" },
      { version: "0.5.5" },
      { version: "0.6.6" },
      { version: "0.8.9" } 
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc-dataseed.binance.org/",
      }
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: ["0ae9be380d18a5418bf4d34d44d575c58b2ffa371cf4394444f37bccdf3f2ff7"],
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: ["0ae9be380d18a5418bf4d34d44d575c58b2ffa371cf4394444f37bccdf3f2ff7"],
      chainId: 56
    }
  },
  etherscan: {
    apiKey: {
      bsc: "MS1P67SGGQPX2ISWVXK1P9VKV5EEV1TNA4"
    }
  }
};
