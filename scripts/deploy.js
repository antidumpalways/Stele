#!/usr/bin/env node
/**
 * Deploy InscriptionRegistry to World Chain Sepolia (testnet)
 * Usage: DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy.js [--mainnet]
 */
import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";

const useMainnet = process.argv.includes("--mainnet");

const NETWORKS = {
  worldchain_sepolia: {
    rpc: "https://worldchain-sepolia.g.alchemy.com/public",
    chainId: 4801,
    name: "World Chain Sepolia",
    explorer: "https://worldchain-sepolia.explorer.alchemy.com",
  },
  worldchain: {
    rpc: "https://worldchain-mainnet.g.alchemy.com/public",
    chainId: 480,
    name: "World Chain Mainnet",
    explorer: "https://worldscan.org",
  },
};

const network = useMainnet ? NETWORKS.worldchain : NETWORKS.worldchain_sepolia;

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not set in environment!");
    console.error("   Run: node scripts/generate-wallet.js first");
    process.exit(1);
  }

  const artifact = JSON.parse(readFileSync("artifacts/InscriptionRegistry.json", "utf8"));
  const provider = new ethers.JsonRpcProvider(network.rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);

  console.log("=".repeat(60));
  console.log("STELE — InscriptionRegistry Deployment");
  console.log("=".repeat(60));
  console.log("Network:  ", network.name);
  console.log("Chain ID: ", network.chainId);
  console.log("Deployer: ", wallet.address);
  console.log("Balance:  ", ethers.formatEther(balance), "ETH");
  console.log("=".repeat(60));

  if (balance === 0n) {
    console.error(`\n❌ Wallet has no ETH! Fund it first at:`);
    if (!useMainnet) {
      console.error("   https://faucet.quicknode.com/world-chain/sepolia");
      console.error("   https://www.alchemy.com/faucets/world-chain-sepolia");
    }
    process.exit(1);
  }

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  console.log("\nDeploying...");
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction().wait();

  const address = await contract.getAddress();
  const txHash = receipt.hash;

  console.log("\n✅ Deployed successfully!");
  console.log("Contract: ", address);
  console.log("Tx hash:  ", txHash);
  console.log(`Explorer: ${network.explorer}/address/${address}`);

  const deployment = {
    contractAddress: address,
    txHash,
    network: useMainnet ? "worldchain" : "worldchain_sepolia",
    chainId: network.chainId,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${network.explorer}/address/${address}`,
    abi: artifact.abi,
  };

  writeFileSync("deployment.json", JSON.stringify(deployment, null, 2));
  console.log("\n📄 Saved → deployment.json");
  console.log("=".repeat(60));

  console.log("\n👉 Next step: add this to your .env or Replit Secrets:");
  console.log(`   WORLD_CHAIN_CONTRACT=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
