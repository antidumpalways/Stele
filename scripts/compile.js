#!/usr/bin/env node
/**
 * Compile InscriptionRegistry.sol using solc
 * Outputs ABI and bytecode to artifacts/InscriptionRegistry.json
 */
import solc from "solc";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve("contracts/InscriptionRegistry.sol"), "utf8");

const input = {
  language: "Solidity",
  sources: {
    "InscriptionRegistry.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] },
    },
  },
};

console.log("Compiling InscriptionRegistry.sol...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors?.some((e) => e.severity === "error")) {
  console.error("Compilation errors:");
  output.errors.forEach((e) => console.error(e.formattedMessage));
  process.exit(1);
}

if (output.errors?.length) {
  output.errors.forEach((e) => console.warn("Warning:", e.formattedMessage));
}

const contract = output.contracts["InscriptionRegistry.sol"]["InscriptionRegistry"];
const artifact = {
  contractName: "InscriptionRegistry",
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
};

mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/InscriptionRegistry.json", JSON.stringify(artifact, null, 2));
console.log("✅ Compiled! → artifacts/InscriptionRegistry.json");
console.log("   ABI entries:", contract.abi.length);
console.log("   Bytecode size:", (contract.evm.bytecode.object.length / 2), "bytes");
