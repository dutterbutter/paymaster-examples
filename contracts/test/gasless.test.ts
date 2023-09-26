import { expect } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as ethers from "ethers";

import { deployContract, fundAccount } from "./utils";

// load env file
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

describe("GaslessPaymaster", function () {
  let provider: Provider;
  let wallet: Wallet;
  let deployer: Deployer;
  let emptyWallet: Wallet;
  let userWallet: Wallet;
  let ownerInitialBalance: ethers.BigNumber;
  let paymaster: Contract;
  let greeter: Contract;

  before(async function () {
    console.log("Setting up environment...");

    provider = new Provider("http://127.0.0.1:8011");
    console.log("Provider: ", provider);
    wallet = new Wallet(PRIVATE_KEY, provider);
    deployer = new Deployer(hre, wallet);
    emptyWallet = Wallet.createRandom();
    console.log(`Empty wallet's address: ${emptyWallet.address}`);
    userWallet = new Wallet(emptyWallet.privateKey, provider);
    
    console.log("Deploying contracts...");
    paymaster = await deployContract(deployer, "GaslessPaymaster", []);
    console.log("Paymaster deployed at: ", paymaster.address);
    greeter = await deployContract(deployer, "Greeter", ["Hi"]);
    console.log(`Paymaster deployed at: ${paymaster.address}`);
    console.log(`Greeter deployed at: ${greeter.address}`);

    console.log("Funding Paymaster...");
    await fundAccount(wallet, paymaster.address, "3");
    ownerInitialBalance = await wallet.getBalance();
    console.log(`Owner initial balance: ${ownerInitialBalance}`);
  });

  async function executeGreetingTransaction(user: Wallet) {
    console.log("Executing greeting transaction...");
    const gasPrice = await provider.getGasPrice();
    console.log(`Gas price: ${gasPrice}`);

    const paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: new Uint8Array(),
    });

    const setGreetingTx = await greeter
      .connect(user)
      .setGreeting("Hola, mundo!", {
        maxPriorityFeePerGas: ethers.BigNumber.from(0),
        maxFeePerGas: gasPrice,
        gasLimit: 6000000,
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams,
        },
      });

    await setGreetingTx.wait();
    const newBalance = await wallet.getBalance();
    console.log(`New balance after transaction: ${newBalance}`);

    return newBalance;
  }

  it("Owner can update message for free", async function () {
    console.log("Testing owner's ability to update message for free...");
    const newBalance = await executeGreetingTransaction(userWallet);

    const greetMessage = await greeter.greet();
    console.log(`Greeter message: ${greetMessage}`);
    expect(greetMessage).to.equal("Hola, mundo!");
    expect(newBalance).to.eql(ownerInitialBalance);
  });

  it("should allow owner to withdraw all funds", async function () {
    console.log("Testing owner's ability to withdraw all funds...");
    try {
      const tx = await paymaster.connect(wallet).withdraw(userWallet.address);
      await tx.wait();
    } catch (e) {
      console.error("Error executing withdrawal:", e);
    }

    const finalContractBalance = await provider.getBalance(paymaster.address);
    console.log(`Final contract balance: ${finalContractBalance}`);
    expect(finalContractBalance).to.eql(ethers.BigNumber.from(0));
  });
});
