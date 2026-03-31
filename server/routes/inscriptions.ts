import { Router } from "express";
import { db } from "../db.js";
import { randomUUID } from "crypto";
import { pinToPinata } from "./pinata.js";
import { inscribeOnChain, vouchOnChain, flagOnChain, getOnChainCount } from "./worldchain.js";

const router = Router();

const FLAG_THRESHOLD = 5;
const VERIFIED_THRESHOLD = parseInt(process.env.VERIFIED_THRESHOLD || "3");

function computeStatus(vouchScore: number, flagCount: number): "verified" | "disputed" | "pending" {
  const netScore = vouchScore - flagCount;
  if (flagCount >= FLAG_THRESHOLD || netScore < 0) return "disputed";
  if (netScore >= VERIFIED_THRESHOLD) return "verified";
  return "pending";
}

function netScore(vouchScore: number, flagCount: number): number {
  return vouchScore - flagCount;
}

router.get("/stats", async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT i.flag_count,
        COALESCE((
          SELECT SUM(CASE WHEN v.tier = 'orb' THEN 10 ELSE 1 END)
          FROM vouches v WHERE v.inscription_id = i.id
        ), 0) as consensus_score,
        i.verification_tier,
        i.cid,
        i.created_at
      FROM inscriptions i
    `).all() as any[];

    let verified = 0, disputed = 0, pending = 0;
    for (const r of rows) {
      const s = computeStatus(r.consensus_score, r.flag_count || 0);
      if (s === "verified") verified++;
      else if (s === "disputed") disputed++;
      else pending++;
    }

    const orbAuthors = rows.filter(r => r.verification_tier === "orb").length;
    const orbWitnesses = (db.prepare(`SELECT COUNT(*) as cnt FROM vouches WHERE tier = 'orb'`).get() as any).cnt;
    const totalVouches = (db.prepare(`SELECT COUNT(*) as cnt FROM vouches`).get() as any).cnt;
    const recentCids = rows
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map(r => r.cid);

    // Weighted net consensus: sum of all weighted vouch scores minus total flag count
    const weightedConsensus = rows.reduce((acc, r) => acc + (r.consensus_score - (r.flag_count || 0)), 0);

    const onChainCount = await getOnChainCount();
    const onChainAnchored = (db.prepare("SELECT COUNT(*) as cnt FROM inscriptions WHERE world_chain_tx IS NOT NULL").get() as any).cnt;
    const totalFlags = (db.prepare("SELECT COUNT(*) as cnt FROM flags").get() as any).cnt;

    const recentVouchTxs = (db.prepare(`
      SELECT v.world_chain_tx, v.tier, i.title, v.inscription_id
      FROM vouches v
      JOIN inscriptions i ON i.id = v.inscription_id
      WHERE v.world_chain_tx IS NOT NULL
      ORDER BY v.id DESC LIMIT 6
    `).all() as any[]);

    const recentFlagTxs = (db.prepare(`
      SELECT f.world_chain_tx, i.title, f.inscription_id
      FROM flags f
      JOIN inscriptions i ON i.id = f.inscription_id
      WHERE f.world_chain_tx IS NOT NULL
      ORDER BY f.id DESC LIMIT 4
    `).all() as any[]);

    res.json({
      total: rows.length,
      verified,
      disputed,
      pending,
      uniqueCids: rows.length,
      delegationsIssued: rows.length,
      orbAuthors,
      orbWitnesses,
      totalVouches,
      totalFlags,
      weightedConsensus,
      recentCids,
      recentVouchTxs,
      recentFlagTxs,
      worldChain: {
        contractAddress: process.env.WORLD_CHAIN_CONTRACT || "0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6",
        chainId: 4801,
        network: "World Chain Sepolia",
        explorerBase: "https://worldchain-sepolia.explorer.alchemy.com",
        onChainCount,
        onChainAnchored,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/", (req, res) => {
  try {
    const { category } = req.query;
    const stmt = db.prepare(`
      SELECT i.*,
        COALESCE((
          SELECT SUM(CASE WHEN v.tier = 'orb' THEN 10 ELSE 1 END)
          FROM vouches v WHERE v.inscription_id = i.id
        ), 0) as consensus_score,
        COALESCE((SELECT COUNT(*) FROM vouches v WHERE v.inscription_id = i.id), 0) as vouches
      FROM inscriptions i
      ORDER BY i.created_at DESC
    `);
    let rows = stmt.all() as any[];
    if (category && category !== "All") {
      rows = rows.filter((r) => r.category === category);
    }
    const result = rows.map((r) => {
      const flags = r.flag_count || 0;
      const ns = netScore(r.consensus_score, flags);
      return {
        ...r,
        net_score: ns,
        status: computeStatus(r.consensus_score, flags),
      };
    });
    res.json(result);
  } catch (err) {
    console.error("List inscriptions error:", err);
    res.status(500).json({ error: "Failed to list inscriptions" });
  }
});

router.get("/:id/vouches", (req, res) => {
  try {
    const { id } = req.params;
    const vouches = db.prepare(`
      SELECT nullifier_hash, tier, world_chain_tx, created_at
      FROM vouches WHERE inscription_id = ?
      ORDER BY created_at ASC
    `).all(id) as { nullifier_hash: string; tier: string; world_chain_tx: string | null; created_at: string }[];
    res.json(vouches);
  } catch (err) {
    console.error("Vouches error:", err);
    res.status(500).json({ error: "Failed to get vouches" });
  }
});

router.get("/:id/flags", (req, res) => {
  try {
    const { id } = req.params;
    const flags = db.prepare(`
      SELECT nullifier_hash, reason, world_chain_tx, created_at
      FROM flags WHERE inscription_id = ?
      ORDER BY created_at ASC
    `).all(id) as { nullifier_hash: string; reason: string | null; world_chain_tx: string | null; created_at: string }[];
    res.json(flags);
  } catch (err) {
    console.error("Flags error:", err);
    res.status(500).json({ error: "Failed to get flags" });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      cid, title, excerpt, location, category,
      contentHash, nullifierHash, authorHash,
      evidencePaths, verificationTier, elaScore,
    } = req.body;

    if (!cid || !title || !excerpt || !location || !contentHash || !nullifierHash || !authorHash) {
      return res.status(400).json({
        error: "Missing required fields: cid, title, excerpt, location, contentHash, nullifierHash, authorHash",
      });
    }

    const id = randomUUID();
    const tier = verificationTier === "orb" ? "orb" : "device";
    const ela = typeof elaScore === "number" ? elaScore : null;

    db.prepare(`
      INSERT INTO inscriptions (id, cid, title, excerpt, location, category, content_hash, nullifier_hash, author_hash, evidence_paths, verification_tier, ela_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, cid, title, excerpt || "", location, category || "All", contentHash, nullifierHash, authorHash,
      evidencePaths ? JSON.stringify(evidencePaths) : null, tier, ela);

    pinToPinata(cid).catch(() => null);

    // Fire-and-forget: anchor on World Chain
    inscribeOnChain(id, contentHash, nullifierHash, cid, tier).catch(() => null);

    res.status(201).json({ id, cid });
  } catch (err) {
    console.error("Create inscription error:", err);
    res.status(500).json({ error: "Failed to create inscription" });
  }
});

router.post("/:id/vouch", (req, res) => {
  try {
    const { id } = req.params;
    const { nullifierHash, tier } = req.body;
    if (!nullifierHash) {
      return res.status(400).json({ error: "nullifierHash required" });
    }
    const vouchTier = tier === "orb" ? "orb" : "device";
    db.prepare(`
      INSERT OR IGNORE INTO vouches (inscription_id, nullifier_hash, tier) VALUES (?, ?, ?)
    `).run(id, nullifierHash, vouchTier);

    const score = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN tier = 'orb' THEN 10 ELSE 1 END), 0) as score
      FROM vouches WHERE inscription_id = ?
    `).get(id) as { score: number };

    const insc = db.prepare("SELECT flag_count, content_hash FROM inscriptions WHERE id = ?").get(id) as { flag_count: number; content_hash: string } | undefined;
    const status = computeStatus(score.score, insc?.flag_count || 0);

    // Respond immediately, then anchor on World Chain in background and save TX hash
    res.json({ vouches: score.score, net_score: netScore(score.score, insc?.flag_count || 0), status });

    if (insc?.content_hash) {
      vouchOnChain(id, insc.content_hash, nullifierHash, vouchTier)
        .then(txHash => {
          if (txHash) {
            const vouchRow = db.prepare(
              "SELECT id FROM vouches WHERE inscription_id = ? AND nullifier_hash = ?"
            ).get(id, nullifierHash) as { id: number } | undefined;
            if (vouchRow?.id) {
              db.prepare("UPDATE vouches SET world_chain_tx = ? WHERE id = ?").run(txHash, vouchRow.id);
              console.log(`[WorldChain] Vouch TX saved: ${txHash}`);
            }
          }
        })
        .catch(() => null);
    }
  } catch (err) {
    console.error("Vouch error:", err);
    res.status(500).json({ error: "Failed to vouch" });
  }
});

router.post("/:id/flag", (req, res) => {
  try {
    const { id } = req.params;
    const { nullifierHash, reason } = req.body;
    if (!nullifierHash) {
      return res.status(400).json({ error: "nullifierHash required" });
    }

    const existing = db.prepare(
      "SELECT 1 FROM flags WHERE inscription_id = ? AND nullifier_hash = ?"
    ).get(id, nullifierHash);
    if (existing) {
      const row = db.prepare("SELECT flag_count FROM inscriptions WHERE id = ?").get(id) as { flag_count: number };
      return res.status(409).json({ error: "Already flagged this inscription", flags: row.flag_count });
    }

    db.prepare(
      "INSERT INTO flags (inscription_id, nullifier_hash, reason) VALUES (?, ?, ?)"
    ).run(id, nullifierHash, reason || null);
    db.prepare("UPDATE inscriptions SET flag_count = flag_count + 1 WHERE id = ?").run(id);

    const row = db.prepare("SELECT flag_count, content_hash FROM inscriptions WHERE id = ?").get(id) as { flag_count: number; content_hash: string };
    const score = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN tier = 'orb' THEN 10 ELSE 1 END), 0) as score
      FROM vouches WHERE inscription_id = ?
    `).get(id) as { score: number };
    const flags = row.flag_count;
    const status = computeStatus(score.score, flags);

    res.json({ flags, net_score: netScore(score.score, flags), status });

    // Fire-and-forget: anchor flag on World Chain, then save TX hash
    if (row?.content_hash) {
      flagOnChain(id, row.content_hash, nullifierHash)
        .then(txHash => {
          if (txHash) {
            const flagRow = db.prepare(
              "SELECT id FROM flags WHERE inscription_id = ? AND nullifier_hash = ?"
            ).get(id, nullifierHash) as { id: number } | undefined;
            if (flagRow?.id) {
              db.prepare("UPDATE flags SET world_chain_tx = ? WHERE id = ?").run(txHash, flagRow.id);
              console.log(`[WorldChain] Flag TX saved: ${txHash}`);
            }
          }
        })
        .catch(() => null);
    }
  } catch (err) {
    console.error("Flag error:", err);
    res.status(500).json({ error: "Failed to flag" });
  }
});

router.post("/:id/simulate-orb-vouch", (req, res) => {
  try {
    const { id } = req.params;
    // Generate a valid 32-byte hex nullifier (required for World Chain contract)
    const fakeOrb = "0x" + (randomUUID() + randomUUID()).replace(/-/g, "").slice(0, 64);
    db.prepare(`INSERT OR IGNORE INTO vouches (inscription_id, nullifier_hash, tier) VALUES (?, ?, 'orb')`)
      .run(id, fakeOrb);

    const score = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN tier = 'orb' THEN 10 ELSE 1 END), 0) as score
      FROM vouches WHERE inscription_id = ?
    `).get(id) as { score: number };

    const insc = db.prepare("SELECT flag_count, content_hash FROM inscriptions WHERE id = ?").get(id) as { flag_count: number; content_hash: string } | undefined;
    const status = computeStatus(score.score, insc?.flag_count || 0);

    res.json({ vouches: score.score, net_score: netScore(score.score, insc?.flag_count || 0), status, message: "Orb vouch simulated for demo" });

    // Anchor the simulated orb vouch on World Chain too
    if (insc?.content_hash) {
      vouchOnChain(id, insc.content_hash, fakeOrb, "orb")
        .then(txHash => {
          if (txHash) {
            const vouchRow = db.prepare(
              "SELECT id FROM vouches WHERE inscription_id = ? AND nullifier_hash = ?"
            ).get(id, fakeOrb) as { id: number } | undefined;
            if (vouchRow?.id) {
              db.prepare("UPDATE vouches SET world_chain_tx = ? WHERE id = ?").run(txHash, vouchRow.id);
              console.log(`[WorldChain] Simulated orb vouch TX saved: ${txHash}`);
            }
          }
        })
        .catch(() => null);
    }
  } catch (err) {
    console.error("Simulate orb vouch error:", err);
    res.status(500).json({ error: "Failed to simulate orb vouch" });
  }
});

router.post("/:id/simulate-flag", (req, res) => {
  try {
    const { id } = req.params;
    // Generate a valid 32-byte hex nullifier (required for World Chain contract)
    const fakeNullifier = "0x" + (randomUUID() + randomUUID()).replace(/-/g, "").slice(0, 64);
    const insc = db.prepare("SELECT flag_count, content_hash FROM inscriptions WHERE id = ?").get(id) as { flag_count: number; content_hash: string } | undefined;
    if (!insc) {
      return res.status(404).json({ error: "Inscription not found" });
    }

    db.prepare(`INSERT OR IGNORE INTO flags (inscription_id, nullifier_hash, reason) VALUES (?, ?, ?)`)
      .run(id, fakeNullifier, "Demo: simulated dispute flag");
    db.prepare("UPDATE inscriptions SET flag_count = flag_count + 1 WHERE id = ?").run(id);

    const updated = db.prepare("SELECT flag_count FROM inscriptions WHERE id = ?").get(id) as { flag_count: number };
    const score = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN tier = 'orb' THEN 10 ELSE 1 END), 0) as score
      FROM vouches WHERE inscription_id = ?
    `).get(id) as { score: number };
    const flags = updated.flag_count;
    const status = computeStatus(score.score, flags);

    res.json({ flags, vouches: score.score, net_score: netScore(score.score, flags), status });

    // Anchor the simulated flag on World Chain
    if (insc.content_hash) {
      flagOnChain(id, insc.content_hash, fakeNullifier)
        .then(txHash => {
          if (txHash) {
            const flagRow = db.prepare(
              "SELECT id FROM flags WHERE inscription_id = ? AND nullifier_hash = ?"
            ).get(id, fakeNullifier) as { id: number } | undefined;
            if (flagRow?.id) {
              db.prepare("UPDATE flags SET world_chain_tx = ? WHERE id = ?").run(txHash, flagRow.id);
              console.log(`[WorldChain] Simulated flag TX saved: ${txHash}`);
            }
          }
        })
        .catch(() => null);
    }
  } catch (err) {
    console.error("Simulate flag error:", err);
    res.status(500).json({ error: "Failed to simulate flags" });
  }
});

router.post("/:id/reset-demo", (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare("SELECT id FROM inscriptions WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ error: "Inscription not found" });
    }

    const resetTx = db.transaction(() => {
      db.prepare("DELETE FROM flags WHERE inscription_id = ? AND nullifier_hash LIKE 'demo-%'").run(id);
      db.prepare("DELETE FROM vouches WHERE inscription_id = ? AND nullifier_hash LIKE 'demo-%'").run(id);

      const remainingFlags = db.prepare(
        "SELECT COUNT(*) as cnt FROM flags WHERE inscription_id = ?"
      ).get(id) as { cnt: number };
      db.prepare("UPDATE inscriptions SET flag_count = ? WHERE id = ?").run(remainingFlags.cnt, id);

      const score = db.prepare(`
        SELECT COALESCE(SUM(CASE WHEN tier = 'orb' THEN 10 ELSE 1 END), 0) as score
        FROM vouches WHERE inscription_id = ?
      `).get(id) as { score: number };

      const status = computeStatus(score.score, remainingFlags.cnt);
      return { flagCount: remainingFlags.cnt, vouchScore: score.score, net_score: netScore(score.score, remainingFlags.cnt), status };
    });

    const result = resetTx();
    res.json(result);
  } catch (err) {
    console.error("Reset demo error:", err);
    res.status(500).json({ error: "Failed to reset demo state" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM vouches WHERE inscription_id = ?").run(id);
    db.prepare("DELETE FROM flags WHERE inscription_id = ?").run(id);
    db.prepare("DELETE FROM inscriptions WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete inscription" });
  }
});

export { router as inscriptionsRouter };
