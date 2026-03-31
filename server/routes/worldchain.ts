/**
 * World Chain — InscriptionRegistry connector
 * Fire-and-forget: anchors inscriptions, vouches, and flags on World Chain Sepolia
 */
import { ethers } from "ethers";
import { db } from "../db.js";

const CONTRACT_ADDRESS = process.env.WORLD_CHAIN_CONTRACT || "0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6";
const NETWORK_RPC = "https://worldchain-sepolia.g.alchemy.com/public";

const ABI = [
  "function inscribe(bytes32 contentHash, bytes32 nullifierHash, string calldata ipfsCid, string calldata verificationTier) external returns (uint256 id)",
  "function vouch(bytes32 inscriptionContentHash, bytes32 nullifierHash, string calldata verificationTier) external returns (uint256 id)",
  "function flag(bytes32 inscriptionContentHash, bytes32 nullifierHash) external returns (uint256 id)",
  "function getCount() external view returns (uint256)",
  "function getVouchCount() external view returns (uint256)",
  "function getFlagCount() external view returns (uint256)",
  "function isContentAnchored(bytes32 contentHash) external view returns (bool)",
  "function hasVouched(bytes32 inscriptionContentHash, bytes32 nullifierHash) external view returns (bool)",
  "function hasFlagged(bytes32 inscriptionContentHash, bytes32 nullifierHash) external view returns (bool)",
];

// Keccak4 selectors for custom errors (ethers v6 doesn't decode them by name)
const ERR_ALREADY_VOUCHED      = "0xbde702e3";
const ERR_ALREADY_FLAGGED      = "0x031eeff2";
const ERR_CONTENT_ANCHORED     = "0xc9868927";
const ERR_INSCRIPTION_NOTFOUND = "0xc10023f0";

function isCustomError(err: any, selector: string): boolean {
  const data: string = err?.data ?? err?.info?.error?.data ?? "";
  if (typeof data === "string" && data.startsWith(selector)) return true;
  const msg: string = err?.message ?? String(err);
  return msg.includes(selector);
}

function toBytes32(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const padded = clean.padStart(64, "0").slice(0, 64);
  return "0x" + padded;
}

let _contract: ethers.Contract | null = null;

function getContract(): ethers.Contract | null {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) return null;
  try {
    if (!_contract) {
      const provider = new ethers.JsonRpcProvider(NETWORK_RPC);
      const wallet = new ethers.Wallet(pk, provider);
      _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    }
    return _contract;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function inscribeOnChain(
  inscriptionId: string,
  contentHash: string,
  nullifierHash: string,
  ipfsCid: string,
  verificationTier: string
): Promise<void> {
  const contract = getContract();
  if (!contract) {
    console.log("[WorldChain] No DEPLOYER_PRIVATE_KEY — skipping on-chain anchor");
    return;
  }

  try {
    const ch = toBytes32(contentHash);
    const nh = toBytes32(nullifierHash);
    const tier = verificationTier === "orb" ? "orb" : "device";

    console.log(`[WorldChain] Anchoring inscription ${inscriptionId}...`);
    const tx = await contract.inscribe(ch, nh, ipfsCid, tier);
    const receipt = await tx.wait();
    const txHash = receipt.hash;
    console.log(`[WorldChain] ✅ Inscribed! tx=${txHash}`);

    db.prepare("UPDATE inscriptions SET world_chain_tx = ? WHERE id = ?").run(txHash, inscriptionId);
  } catch (err: any) {
    if (isCustomError(err, ERR_CONTENT_ANCHORED)) {
      console.log(`[WorldChain] Content already anchored — skipping`);
    } else {
      console.error("[WorldChain] Inscribe failed:", err?.message || String(err));
    }
  }
}

/**
 * Vouch on-chain with automatic retry if the inscription hasn't landed yet.
 * Waits up to 90 seconds for the inscription to appear on-chain, then vouches.
 */
export async function vouchOnChain(
  inscriptionId: string,
  contentHash: string,
  nullifierHash: string,
  verificationTier: string
): Promise<string | null> {
  const contract = getContract();
  if (!contract) return null;

  const ch = toBytes32(contentHash);
  const nh = toBytes32(nullifierHash);
  const tier = verificationTier === "orb" ? "orb" : "device";

  const MAX_ATTEMPTS = 6;
  const RETRY_DELAY_MS = 15_000; // 15 s between retries

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[WorldChain] On-chain vouch attempt ${attempt}/${MAX_ATTEMPTS} for ${contentHash.slice(0, 10)}...`);
      const tx = await contract.vouch(ch, nh, tier);
      const receipt = await tx.wait();
      console.log(`[WorldChain] ✅ Vouched on-chain! tx=${receipt.hash}`);
      return receipt.hash;
    } catch (err: any) {
      if (isCustomError(err, ERR_ALREADY_VOUCHED)) {
        console.log(`[WorldChain] Already vouched on-chain — skipping`);
        return null;
      }
      if (isCustomError(err, ERR_INSCRIPTION_NOTFOUND)) {
        if (attempt < MAX_ATTEMPTS) {
          console.log(`[WorldChain] Inscription not on-chain yet — waiting ${RETRY_DELAY_MS / 1000}s before retry...`);
          // Check if the inscription has been anchored in the meantime
          await sleep(RETRY_DELAY_MS);

          // If DB has the TX now, inscription landed — continue to retry vouch
          const row = db.prepare("SELECT world_chain_tx FROM inscriptions WHERE id = ?").get(inscriptionId) as { world_chain_tx: string | null } | undefined;
          if (row?.world_chain_tx) {
            console.log(`[WorldChain] Inscription now anchored (tx=${row.world_chain_tx}) — retrying vouch`);
          }
          continue;
        }
        console.warn(`[WorldChain] Gave up waiting for inscription to anchor — vouch not recorded on-chain`);
        return null;
      }
      console.error(`[WorldChain] Vouch failed (attempt ${attempt}):`, err?.message || String(err));
      return null;
    }
  }
  return null;
}

/**
 * Flag on-chain with automatic retry if the inscription hasn't landed yet.
 */
export async function flagOnChain(
  inscriptionId: string,
  contentHash: string,
  nullifierHash: string
): Promise<string | null> {
  const contract = getContract();
  if (!contract) return null;

  const ch = toBytes32(contentHash);
  const nh = toBytes32(nullifierHash);

  const MAX_ATTEMPTS = 6;
  const RETRY_DELAY_MS = 15_000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[WorldChain] On-chain flag attempt ${attempt}/${MAX_ATTEMPTS} for ${contentHash.slice(0, 10)}...`);
      const tx = await contract.flag(ch, nh);
      const receipt = await tx.wait();
      console.log(`[WorldChain] ✅ Flagged on-chain! tx=${receipt.hash}`);
      return receipt.hash;
    } catch (err: any) {
      if (isCustomError(err, ERR_ALREADY_FLAGGED)) {
        console.log(`[WorldChain] Already flagged on-chain — skipping`);
        return null;
      }
      if (isCustomError(err, ERR_INSCRIPTION_NOTFOUND)) {
        if (attempt < MAX_ATTEMPTS) {
          console.log(`[WorldChain] Inscription not on-chain yet — waiting ${RETRY_DELAY_MS / 1000}s before retry...`);
          await sleep(RETRY_DELAY_MS);
          const row = db.prepare("SELECT world_chain_tx FROM inscriptions WHERE id = ?").get(inscriptionId) as { world_chain_tx: string | null } | undefined;
          if (row?.world_chain_tx) {
            console.log(`[WorldChain] Inscription now anchored — retrying flag`);
          }
          continue;
        }
        console.warn(`[WorldChain] Gave up waiting for inscription to anchor — flag not recorded on-chain`);
        return null;
      }
      console.error(`[WorldChain] Flag failed (attempt ${attempt}):`, err?.message || String(err));
      return null;
    }
  }
  return null;
}

export async function getOnChainCount(): Promise<number> {
  try {
    const contract = getContract();
    if (!contract) return 0;
    const count = await contract.getCount();
    return Number(count);
  } catch {
    return 0;
  }
}
