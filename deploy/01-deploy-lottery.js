const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const {verify} = require("../utils/verify");

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let VRFCoordinatorV2Address, subscriptionId;

  if (chainId == 31337) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    VRFCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;

    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);

  } else {
    VRFCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: [VRFCoordinatorV2Address, entranceFee, gasLane, subscriptionId, callbackGasLimit, interval],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
    console.log('Verifying...');
    await verify(lottery.address, args);
  }

  console.log("...................................");
};
// run deploy locally -> npx hardhat deploy
module.exports.tags = ["all", "lottery"];