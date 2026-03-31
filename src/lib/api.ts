const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

export async function getRpSignature(action: string) {
  return fetchApi<{ sig: string; nonce: string; created_at: number; expires_at: number }>(
    "/rp-signature",
    { method: "POST", body: JSON.stringify({ action }) }
  );
}

export async function verifyProof(rpId: string, idkitResponse: unknown) {
  return fetchApi<{ success?: boolean; nullifier_hash?: string; verification_level?: "device" | "orb" }>(
    "/verify-proof",
    { method: "POST", body: JSON.stringify({ rp_id: rpId, idkitResponse }) }
  );
}

export async function getStorachaDelegation(did: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/storacha-delegation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to get delegation");
  }
  return res.arrayBuffer();
}

export interface Inscription {
  id: string;
  cid: string;
  title: string;
  excerpt: string;
  location: string;
  category: string;
  content_hash: string;
  nullifier_hash: string;
  author_hash: string;
  evidence_paths: string | null;
  verification_tier: "device" | "orb";
  ela_score: number | null;
  flag_count: number;
  consensus_score: number;
  net_score: number;
  status: "pending" | "verified" | "disputed";
  created_at: string;
  vouches: number;
  world_chain_tx: string | null;
}

export async function listInscriptions(category?: string): Promise<Inscription[]> {
  const q = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
  return fetchApi<Inscription[]>(`/inscriptions${q}`);
}

export async function createInscription(data: {
  cid: string;
  title: string;
  excerpt: string;
  location: string;
  category?: string;
  contentHash: string;
  nullifierHash: string;
  authorHash: string;
  evidencePaths?: string[];
  verificationTier?: "device" | "orb";
  elaScore?: number | null;
}) {
  return fetchApi<{ id: string; cid: string }>("/inscriptions", {
    method: "POST",
    body: JSON.stringify({
      cid: data.cid,
      title: data.title,
      excerpt: data.excerpt,
      location: data.location,
      category: data.category || "All",
      contentHash: data.contentHash,
      nullifierHash: data.nullifierHash,
      authorHash: data.authorHash,
      evidencePaths: data.evidencePaths,
      verificationTier: data.verificationTier || "device",
      elaScore: data.elaScore ?? null,
    }),
  });
}

export async function aiDescribe(imageBase64: string, mimeType: string, filename: string) {
  return fetchApi<{ title: string; excerpt: string; location: string; category: string }>(
    "/ai-describe",
    { method: "POST", body: JSON.stringify({ imageBase64, mimeType, filename }) }
  );
}

export async function vouch(inscriptionId: string, nullifierHash: string, tier: "device" | "orb" = "device") {
  return fetchApi<{ vouches: number; net_score: number; status: string }>(`/inscriptions/${inscriptionId}/vouch`, {
    method: "POST",
    body: JSON.stringify({ nullifierHash, tier }),
  });
}

export async function flagInscription(inscriptionId: string, nullifierHash: string, reason?: string) {
  return fetchApi<{ flags: number; net_score?: number }>(`/inscriptions/${inscriptionId}/flag`, {
    method: "POST",
    body: JSON.stringify({ nullifierHash, reason }),
  });
}

export interface NetworkStats {
  total: number;
  verified: number;
  disputed: number;
  pending: number;
  uniqueCids: number;
  delegationsIssued: number;
  orbAuthors: number;
  orbWitnesses?: number;
  totalVouches: number;
  totalFlags: number;
  weightedConsensus?: number;
  recentCids: string[];
  recentVouchTxs: { world_chain_tx: string; tier: string; title: string; inscription_id: string }[];
  recentFlagTxs: { world_chain_tx: string; title: string; inscription_id: string }[];
  worldChain?: {
    contractAddress: string;
    chainId: number;
    network: string;
    explorerBase: string;
    onChainCount: number;
    onChainAnchored: number;
  };
}

export async function getNetworkStats(): Promise<NetworkStats> {
  return fetchApi<NetworkStats>("/inscriptions/stats");
}
