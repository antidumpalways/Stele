const PINATA_API = "https://api.pinata.cloud/pinning/pinByHash";
const CID_PATTERN = /^(bafy[a-z2-7]{50,}|bafk[a-z2-7]{50,}|bafyb[a-z2-7]{50,}|Qm[a-zA-Z0-9]{44,46})$/;

export async function pinToPinata(cid: string): Promise<void> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    console.warn("PINATA_JWT not set — skipping pin for", cid);
    return;
  }

  if (!cid || !CID_PATTERN.test(cid)) {
    console.warn("Invalid CID format — skipping Pinata pin:", cid?.slice(0, 20));
    return;
  }

  try {
    const res = await fetch(PINATA_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ hashToPin: cid }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Pinata pin failed (${res.status}):`, err);
      return;
    }

    const data = await res.json();
    console.log(`Pinata pinned CID ${cid}:`, data.status || "ok");
  } catch (err) {
    console.error("Pinata pin error:", err);
  }
}
