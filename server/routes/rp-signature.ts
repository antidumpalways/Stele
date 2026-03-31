import { Router } from "express";
import { signRequest } from "@worldcoin/idkit/signing";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { action } = req.body as { action?: string };
    const signingKey = process.env.RP_SIGNING_KEY;
    if (!signingKey) {
      return res.status(500).json({ error: "RP_SIGNING_KEY not configured" });
    }
    const act = action || process.env.WORLD_ID_ACTION || "inscribe-news";
    const { sig, nonce, createdAt, expiresAt } = signRequest(act, signingKey);
    res.json({ sig, nonce, created_at: createdAt, expires_at: expiresAt });
  } catch (err) {
    console.error("RP signature error:", err);
    res.status(500).json({ error: "Failed to generate RP signature" });
  }
});

export { router as rpSignatureRouter };
