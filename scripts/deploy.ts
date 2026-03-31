import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("STELE — InscriptionRegistry Deployment");
  console.log("=".repeat(60));
  console.log("Network:  ", (await ethers.provider.getNetwork()).name);
  console.log("Deployer: ", deployer.address);
  console.log("Balance:  ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("=".repeat(60));

  const factory = await ethers.getContractFactory("InscriptionRegistry");
  console.log("\nDeploying InscriptionRegistry...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;
  const network = await ethers.provider.getNetwork();

  console.log("\n✅ Deployed successfully!");
  console.log("Contract address:", address);
  console.log("Tx hash:        ", txHash);

  const explorerBase = network.chainId === 480n
    ? "https://worldchain-mainnet.explorer.alchemy.com"
    : "https://worldchain-sepolia.explorer.alchemy.com";

  console.log(`Explorer:        ${explorerBase}/address/${address}`);
  console.log(`Tx:              ${explorerBase}/tx/${txHash}`);

  const deployment = {
    contractAddress: address,
    txHash,
    network: network.chainId === 480n ? "worldchain" : "worldchain_sepolia",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerBase}/address/${address}`,
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deployment, null, 2));
  console.log("\nSaved to deployment.json");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
