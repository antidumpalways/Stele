import { ethers } from "ethers";

async function main() {
  const wallet = ethers.Wallet.createRandom();

  console.log("=".repeat(60));
  console.log("New deployer wallet generated");
  console.log("=".repeat(60));
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);
  console.log("Mnemonic:    ", wallet.mnemonic?.phrase);
  console.log("=".repeat(60));
  console.log("\n⚠️  Save the private key as DEPLOYER_PRIVATE_KEY in Secrets");
  console.log(`\nFund this address on World Chain Sepolia:`);
  console.log(`https://faucet.quicknode.com/world-chain/sepolia`);
  console.log(`(or) https://www.alchemy.com/faucets/world-chain-sepolia`);
  console.log("=".repeat(60));
}

main();
