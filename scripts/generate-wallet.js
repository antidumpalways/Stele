#!/usr/bin/env node
import { ethers } from "ethers";

const wallet = ethers.Wallet.createRandom();

console.log("=".repeat(60));
console.log("New deployer wallet generated");
console.log("=".repeat(60));
console.log("Address:     ", wallet.address);
console.log("Private Key: ", wallet.privateKey);
console.log("=".repeat(60));
console.log("\n📋 Steps:");
console.log("1. Copy DEPLOYER_PRIVATE_KEY →", wallet.privateKey);
console.log("   Add it to Replit Secrets as DEPLOYER_PRIVATE_KEY");
console.log("");
console.log("2. Fund the address with testnet ETH:");
console.log("   Address:", wallet.address);
console.log("   Faucet:  https://faucet.quicknode.com/world-chain/sepolia");
console.log("   Faucet:  https://www.alchemy.com/faucets/world-chain-sepolia");
console.log("");
console.log("3. Then run:");
console.log("   node scripts/compile.js");
console.log("   node scripts/deploy.js");
console.log("=".repeat(60));
