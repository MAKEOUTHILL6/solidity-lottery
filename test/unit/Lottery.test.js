const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe("Lottery Unit Tests", () => {
      let lottery, vrfCoordinatorV2Mock, lotteryEntranceFee, deployer, interval;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        lottery = await ethers.getContract("Lottery", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        lotteryEntranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });

      describe("constructor", () => {
        it("initializes the lottery correctly", async () => {
          const lotteryState = await lottery.getLotteryState();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(
            interval.toString(),
            networkConfig[network.config.chainId]["interval"]
          );
        });
      });

      describe("enterLottery", () => {
        it("it reverts if not enough ETH", async () => {
          await expect(lottery.enterRaffle()).to.be.revertedWith(
            "Lottery__NotEnoughETHEntered"
          );
        });

        it("records participants when they enter", async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          const playerFromContract = await lottery.getParticipantByIndex(0);
          assert.equal(playerFromContract, deployer);
        });
        //testing events
        it("emits event on enter", async () => {
          await expect(
            lottery.enterRaffle({ value: lotteryEntranceFee })
          ).to.emit(lottery, "RaffleEnter");
        });
        it("doesn't allow entering when raffle is calculating", async () => {
          console.log(await lottery.getLotteryState());
          await lottery.enterRaffle({ value: lotteryEntranceFee });

          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);

          await network.provider.request({ method: "evm_mine", params: [] });
          // fake a perfrom
          await lottery.performUpkeep([]); 
          console.log("After state" + (await lottery.getLotteryState()));
          await expect(
            lottery.enterRaffle({ value: lotteryEntranceFee })
          ).to.be.revertedWith("Lottery__NotOpen");
        });
      });

      describe("checkUpKeep", () => {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);

          await network.provider.request({ method: "evm_mine", params: [] });

          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        it("returns false if raffle isn't open", async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await lottery.performUpkeep("0x");
          const lotteryState = await lottery.getLotteryState();
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert.equal(lotteryState.toString(), "1");
          assert.equal(upkeepNeeded, false);
        });

        it("returns false if enough time hasn't passed", async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 5,
          ]); // use a higher number here if this test fails
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", () => {
        it("can only run if checkUpkeep is true", async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await lottery.performUpkeep([]);
          assert.equal(tx);
        });

        it("reverts when chekUpkeep is false", async () => {
          await expect(lottery.performUpkeep([])).to.be.revertedWith(
            "Lottery__InvalidUpkeep"
          );
        });

        it("upadates the lottery state, emits event, and calls the vrf coordinator", async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });

          const tx = await lottery.performUpkeep([]);
          const txReceipt = await tx.wait(1);
          const requestId = txReceipt.events[1].args.requestId;
          const raffleState = await lottery.getLotteryState();
          assert(requestId.toNumber() > 0);
          assert(raffleState.toNumber() == 1);
        });
      });

      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await lottery.enterRaffle({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });

        it("can only perform after performUpkeep", async () => {
          await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)).to.be.revertedWith("nonexistent request");
          await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)).to.be.revertedWith("nonexistent request");
        });
      });
    })
  : describe.skip;
