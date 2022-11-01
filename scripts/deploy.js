const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("!!! DEPLOYING CONTRACT USING THE ADDRESS !!!", deployer.address);

  const FLASHSWAP = await ethers.getContractFactory("PancakeFlashSwapLive");
  const flashswap = await FLASHSWAP.deploy();
  await flashswap.deployed();

  console.log("!!! CONTRACT DEPLOYED SUCCESSFULLY !!!")
  console.log("!!! CONTRACT ADDRESS !!!", flashswap.address);

}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1)
});
