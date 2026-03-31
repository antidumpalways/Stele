import { Router } from "express";
import * as Client from "@storacha/client";
import { StoreMemory } from "@storacha/client/stores/memory";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";
import * as DID from "@ipld/dag-ucan/did";
import type { ServiceAbility } from "@storacha/capabilities/types";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { did } = req.body as { did: string };
    if (!did) {
      return res.status(400).json({ error: "did required" });
    }

    const key = process.env.STORACHA_KEY;
    const proofB64 = process.env.STORACHA_PROOF;
    if (!key || !proofB64) {
      return res.status(500).json({ error: "Storacha not configured" });
    }

    const principal = Signer.parse(key);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    const proof = await Proof.parse(proofB64);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const audience = DID.parse(did);
    const abilities: ServiceAbility[] = [
      "space/blob/add",
      "space/index/add",
      "filecoin/offer",
      "upload/add",
    ];
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year
    const delegation = await client.createDelegation(audience, abilities, {
      expiration,
    });

    const archive = await delegation.archive();
    if (!archive.ok) {
      throw new Error("Failed to archive delegation");
    }

    res.set("content-type", "application/octet-stream");
    res.send(Buffer.from(archive.ok));
  } catch (err) {
    console.error("Storacha delegation error:", err);
    res.status(500).json({ error: "Failed to create delegation" });
  }
});

export { router as storachaDelegationRouter };
