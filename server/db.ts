import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");
try {
  mkdirSync(dataDir, { recursive: true });
} catch {}
const dbPath = process.env.SQLITE_PATH || path.join(dataDir, "stele.db");

export const db: InstanceType<typeof Database> = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS inscriptions (
    id TEXT PRIMARY KEY,
    cid TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'All',
    content_hash TEXT NOT NULL,
    nullifier_hash TEXT NOT NULL,
    author_hash TEXT NOT NULL,
    evidence_paths TEXT,
    verification_tier TEXT NOT NULL DEFAULT 'device',
    flag_count INTEGER NOT NULL DEFAULT 0,
    ela_score REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vouches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inscription_id TEXT NOT NULL,
    nullifier_hash TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'device',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(inscription_id, nullifier_hash),
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id)
  );

  CREATE TABLE IF NOT EXISTS flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inscription_id TEXT NOT NULL,
    nullifier_hash TEXT NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(inscription_id, nullifier_hash),
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_inscriptions_created ON inscriptions(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_inscriptions_category ON inscriptions(category);
`);

// Additive migrations — safe to run multiple times
const migrate = (sql: string) => {
  try { db.exec(sql); } catch {}
};
migrate(`ALTER TABLE inscriptions ADD COLUMN verification_tier TEXT NOT NULL DEFAULT 'device'`);
migrate(`ALTER TABLE inscriptions ADD COLUMN flag_count INTEGER NOT NULL DEFAULT 0`);
migrate(`ALTER TABLE inscriptions ADD COLUMN ela_score REAL`);
migrate(`ALTER TABLE vouches ADD COLUMN tier TEXT NOT NULL DEFAULT 'device'`);
migrate(`ALTER TABLE inscriptions ADD COLUMN world_chain_tx TEXT`);
migrate(`ALTER TABLE vouches ADD COLUMN world_chain_tx TEXT`);
migrate(`ALTER TABLE flags ADD COLUMN world_chain_tx TEXT`);

// Seed initial data if database is empty
const seedIfEmpty = db.transaction(() => {
  const count = (db.prepare("SELECT COUNT(*) as n FROM inscriptions").get() as { n: number }).n;
  if (count > 0) return;

  const insInscription = db.prepare(`
    INSERT OR IGNORE INTO inscriptions
      (id, cid, title, excerpt, location, category, content_hash, nullifier_hash,
       author_hash, evidence_paths, created_at, verification_tier, flag_count, ela_score, world_chain_tx)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insVouch = db.prepare(`
    INSERT OR IGNORE INTO vouches
      (inscription_id, nullifier_hash, created_at, tier, world_chain_tx)
    VALUES (?,?,?,?,?)
  `);
  const insFlag = db.prepare(`
    INSERT OR IGNORE INTO flags
      (inscription_id, nullifier_hash, reason, created_at, world_chain_tx)
    VALUES (?,?,?,?,?)
  `);

  insInscription.run(
    "214c12e6-352e-46b5-a9ca-ca1085f67782",
    "bafybeichghkk7dina6vmfgnyhuqmdsevn3bxvpnkz6pazrjemyoxmuyr4q",
    "First STELE Protocol Test: Atomic Hash Binding Verified",
    "Initial test inscription to verify the full STELE pipeline: SHA-256 content hash bound to World ID nullifier, uploaded to Storacha (IPFS), anchored on World Chain Sepolia. Protocol integrity confirmed.",
    "Global: Decentralized Network",
    "Governance",
    "17869577e109109faf828c8477dbad415a8474c8e7f55c4801eaf16f759491b0",
    "0x1b45fe2b9ed4939b067f835323debb1de4f49afebb27520e298fb5d946e66a72",
    "0x1b45...6a72",
    JSON.stringify(["Screenshot 2024-07-30 030245.png"]),
    "2026-03-11 12:30:45",
    "device", 1, null,
    "0x0c4d837c880abac3abab4cdbba67085f159f44a2379cf19c5887d1cc769ab759"
  );
  insInscription.run(
    "fa144e37-f748-410d-9cdc-a1644dff95b8",
    "bafybeidjezh6vwqkntchy7pxusrzt2fxsis7jt4jojdcj6yubmtyy5y4ky",
    "Data Analytics Dashboard Shows Performance Metrics Tracking",
    "Screenshot reveals a bar chart dashboard displaying numerical performance data across multiple time periods or categories with varying metrics.",
    "Unknown",
    "All",
    "d5b6433493d6b810c73c7e377f833b1f65c53d5b19b94d1e691a03197e6d369c",
    "0x1b45fe2b9ed4939b067f835323debb1de4f49afebb27520e298fb5d946e66a72",
    "0x1b45...6a72",
    JSON.stringify(["Screenshot 2024-07-18 122832.png"]),
    "2026-03-12 18:16:24",
    "device", 0, 11,
    "0x7b02a61099c1108433dec8bb6697f905ee72955443e680484e8013707ab936d2"
  );
  insInscription.run(
    "83f2e7ad-adde-41c2-9b10-22758fdbf1e9",
    "bafybeiep6xoon573s7ufydslq3xybpwy4ovolfoxrr42yuzexfyzfvknqu",
    "Cryptocurrency Market Analysis Shows Varied Token Performance Over Time",
    "Dashboard displays comparative performance data for multiple cryptocurrency tokens including stablecoins and DeFi tokens across different time periods.",
    "Unknown",
    "Governance",
    "5970ce3d7e44e97963904e6bc75972311f17755f81193dd9c72ad0cfaf6893b8",
    "0x1b45fe2b9ed4939b067f835323debb1de4f49afebb27520e298fb5d946e66a72",
    "0x1b45...6a72",
    JSON.stringify(["Screenshot 2024-07-13 162954.png"]),
    "2026-03-14 18:30:30",
    "device", 1, 23,
    "0x0f406764997994ac0f3a005b7a749ab21061176ae5bace98cd7146389a2cda48"
  );

  insVouch.run("214c12e6-352e-46b5-a9ca-ca1085f67782", "visitor_865fdd80-2396-4370-a26a-f572f0302801", "2026-03-11 12:31:33", "device", null);
  insVouch.run("fa144e37-f748-410d-9cdc-a1644dff95b8", "demo-orb-9358573d-847f-4f82-a88d-4e094d52013a", "2026-03-14 16:15:08", "orb", null);
  insVouch.run("fa144e37-f748-410d-9cdc-a1644dff95b8", "demo-orb-7f6fe61a-40ab-45ec-8e15-1fec9412f126", "2026-03-14 16:30:56", "orb", null);
  insVouch.run("fa144e37-f748-410d-9cdc-a1644dff95b8", "demo-orb-4ab4db69-f13b-4711-be6d-bc450a02e9b2", "2026-03-14 16:31:04", "orb", null);
  insVouch.run("83f2e7ad-adde-41c2-9b10-22758fdbf1e9", "0x1b45fe2b9ed4939b067f835323debb1de4f49afebb27520e298fb5d946e66a72", "2026-03-26 15:26:03", "device", "0x25bdd281fe40e6ca760aef14a445130ca3355e17f02c5bb38aa3671813e494bc");
  insVouch.run("fa144e37-f748-410d-9cdc-a1644dff95b8", "0x1b45fe2b9ed4939b067f835323debb1de4f49afebb27520e298fb5d946e66a72", "2026-03-26 15:31:52", "device", null);
  insVouch.run("83f2e7ad-adde-41c2-9b10-22758fdbf1e9", "demo-orb-c39ff8c9-d89f-474b-af65-0bda612ebfcb", "2026-03-28 10:32:50", "orb", null);
  insVouch.run("83f2e7ad-adde-41c2-9b10-22758fdbf1e9", "0x680a06f7297f49248c0babba8222ef09ae64694654d44ea288b3671bac10b731", "2026-03-28 10:34:10", "orb", null);
  insVouch.run("83f2e7ad-adde-41c2-9b10-22758fdbf1e9", "0x59779c5fb9e84fdd8a866b8e4cf1246745c9458d06c541cb8a47c84e4d65fdb4", "2026-03-28 10:39:48", "orb", "0x2d8d1d562b8df624c370b78bb76ee7ad4e810e35148b5d39d83f253d9b3199b5");

  insFlag.run("214c12e6-352e-46b5-a9ca-ca1085f67782", "visitor_865fdd80-2396-4370-a26a-f572f0302801", "Reported as disputed", "2026-03-12 17:55:22", null);
  insFlag.run("83f2e7ad-adde-41c2-9b10-22758fdbf1e9", "0x1b45fe2b9ed4939b067f835323debb1de4f49afebb27520e298fb5d946e66a72", "Reported as disputed", "2026-03-28 15:21:22", null);

  console.log("[seed] Seeded 3 inscriptions, 9 vouches, 2 flags into fresh database.");
});

seedIfEmpty();
