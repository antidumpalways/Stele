import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { rp_id, idkitResponse } = req.body as {
      rp_id: string;
      idkitResponse: Record<string, unknown>;
    };
    const rpId = rp_id || process.env.WORLD_ID_RP_ID;
    if (!rpId) {
      return res.status(400).json({ error: "rp_id required" });
    }

    const response = await fetch(
      `https://developer.world.org/api/v4/verify/${rpId}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(idkitResponse),
      }
    );

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      console.error("World ID verify error:", response.status, payload);
      const detail =
        (payload.detail as string) ||
        (payload.error as string) ||
        (payload.code as string) ||
        JSON.stringify(payload) ||
        "Proof verification failed";
      return res.status(response.status).json({ error: detail });
    }
    res.status(response.status).json(payload);
  } catch (err) {
    console.error("Verify proof error:", err);
    res.status(500).json({ error: "Proof verification failed" });
  }
});

export { router as verifyProofRouter };
