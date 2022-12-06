const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const networkName = network.name;

  if (developmentChains.includes(networkName)) {
    console.log("Local network detected! Deploying mocks...");
  }
};
