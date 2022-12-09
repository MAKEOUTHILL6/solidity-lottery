require("dotenv").config();
const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONTEND_ADDRESSES_FILE =
  "../Lottery Fullstack/frontend/constants/contractAddresses.json";
const FRONTEND_ABI_FILE =
  "../Lottery Fullstack/frontend/constants/abi.json";

module.exports = async () => {
  if (process.env.UPDATE_FRONTEND) {
    console.log("Writing to frontend");
    await updateContractAddresses();
    await updateAbi();
    console.log("Frontend written!");
  }
};

async function updateContractAddresses() {
  const lottery = await ethers.getContract("Lottery");
  const chainId = network.config.chainId.toString();
  const currentAddress = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8")
  );
  console.log(currentAddress);
  if (chainId in currentAddress) {
    if (!currentAddress[chainId].includes(lottery.address)) {
      currentAddress[chainId].push(lottery.address);
    }
  }
  // else
  {
    currentAddress[chainId] = [lottery.address];
  }

  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddress));
}

async function updateAbi() {
    const lottery = await ethers.getContract("Lottery");
    fs.writeFileSync(FRONTEND_ABI_FILE, lottery.interface.format(ethers.utils.FormatTypes.json))
}

module.exports.tags = ["all", "frontend"];
