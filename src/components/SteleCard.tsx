import { Shield, MapPin, Clock, CheckCircle, Copy, Search, Loader2, AlertCircle, Flag, Zap, ImageOff, ExternalLink, RotateCcw } from "lucide-react";
import type { Inscription } from "@/lib/api";
import { vouch, getRpSignature, verifyProof } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { verifyContentHashMultiple } from "@/lib/contentHash";
import { IDKitRequestWidget, deviceLegacy, type RpContext, type IDKitResult } from "@worldcoin/idkit";
import { fetchFromIPFS, gatewayUrl, ALL_GATEWAYS } from "@/lib/ipfs-gateways";
import { isInWorldApp, miniKitVerify } from "@/lib/minikit";

const WORLD_ID_APP_ID = import.meta.env.VITE_WORLD_ID_APP_ID || "";
const WORLD_ID_RP_ID = import.meta.env.VITE_WORLD_ID_RP_ID || "";
const WORLD_ID_ACTION = import.meta.env.VITE_WORLD_ID_ACTION || "stele-inscribe";
const WORLD_ID_ENV: "production" | "staging" =
  (import.meta.env.VITE_WORLD_ID_ENV as "production" | "staging") ||
  (WORLD_ID_APP_ID.includes("staging") ? "staging" : "production");

const VERIFIED_THRESHOLD = 3;
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

function getEvidenceImageUrls(cid: string, evidencePaths: string | null): string[] {
  if (!cid || cid.startsWith("QmTest") || cid.length < 20) return [];
  try {
    const paths: string[] = evidencePaths ? JSON.parse(evidencePaths) : [];
    for (const p of paths) {
      const ext = p.split(".").pop()?.toLowerCase() || "";
      if (IMAGE_EXTS.includes(ext)) {
        return ALL_GATEWAYS.map(gw =>
          gatewayUrl(cid, `evidence/${encodeURIComponent(p)}`, gw)
        );
      }
    }
    return [];
  } catch {
    return [];
  }
}

const STATUS_CONFIG = {
  verified: {
    label: "VERIFIED",
    icon: "🟢",
    className: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30",
  },
  pending: {
    label: "PENDING",
    icon: "🟡",
    className: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30",
  },
  disputed: {
    label: "DISPUTED",
    icon: "🔴",
    className: "text-red-400 bg-red-500/10 border border-red-500/30",
  },
};

const TIER_CONFIG = {
  orb: { label: "ORB VERIFIED", className: "text-stele-gold", icon: "⬡" },
  device: { label: "DEVICE VERIFIED", className: "text-blue-400", icon: "◈" },
};

async function simulateOrbVouch(id: string): Promise<{ vouches: number; status: string }> {
  const res = await fetch(`/api/inscriptions/${id}/simulate-orb-vouch`, { method: "POST" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function simulateDisputeFlags(id: string): Promise<{ flags: number; vouches: number; status: string }> {
  const res = await fetch(`/api/inscriptions/${id}/simulate-flag`, { method: "POST" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function resetDemo(id: string): Promise<{ flagCount: number; vouchScore: number; status: string }> {
  const res = await fetch(`/api/inscriptions/${id}/reset-demo`, { method: "POST" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

type VouchRow = { nullifier_hash: string; tier: string; world_chain_tx: string | null; created_at: string };

function VouchTxList({ inscriptionId, open }: { inscriptionId: string; open: boolean }) {
  const { data: vouches = [], isLoading } = useQuery<VouchRow[]>({
    queryKey: ["/api/inscriptions", inscriptionId, "vouches"],
    queryFn: () => fetch(`/api/inscriptions/${inscriptionId}/vouches`).then(r => r.json()),
    enabled: open,
    staleTime: 30_000,
  });

  const withTx = vouches.filter(v => v.world_chain_tx);
  if (!open || (isLoading && vouches.length === 0)) return null;
  if (withTx.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400">
        Vouch Transactions on World Chain ({withTx.length})
      </p>
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {withTx.map((v, i) => (
          <a
            key={v.world_chain_tx}
            href={`https://worldchain-sepolia.explorer.alchemy.com/tx/${v.world_chain_tx}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-vouch-tx-${inscriptionId}-${i}`}
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-violet-500/5 border border-violet-500/20 hover:bg-violet-500/10 group transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase text-violet-400/70 mr-2">
                {v.tier === "orb" ? "⬡ Orb" : "◎ Device"}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-violet-300 transition-colors">
                {v.world_chain_tx!.slice(0, 14)}…{v.world_chain_tx!.slice(-6)}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-violet-400/60 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

type FlagRow = { nullifier_hash: string; reason: string | null; world_chain_tx: string | null; created_at: string };

function FlagTxList({ inscriptionId, open }: { inscriptionId: string; open: boolean }) {
  const { data: flags = [], isLoading } = useQuery<FlagRow[]>({
    queryKey: ["/api/inscriptions", inscriptionId, "flags"],
    queryFn: () => fetch(`/api/inscriptions/${inscriptionId}/flags`).then(r => r.json()),
    enabled: open,
    staleTime: 30_000,
  });

  const withTx = flags.filter(f => f.world_chain_tx);
  if (!open || (isLoading && flags.length === 0)) return null;
  if (withTx.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-widest text-red-400">
        Flag Transactions on World Chain ({withTx.length})
      </p>
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {withTx.map((f, i) => (
          <a
            key={f.world_chain_tx}
            href={`https://worldchain-sepolia.explorer.alchemy.com/tx/${f.world_chain_tx}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-flag-tx-${inscriptionId}-${i}`}
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 group transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase text-red-400/70 mr-2">⚑ Flag</span>
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-red-300 transition-colors">
                {f.world_chain_tx!.slice(0, 14)}…{f.world_chain_tx!.slice(-6)}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-red-400/60 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

const SteleCard = ({ post }: { post: Inscription }) => {
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectStatus, setInspectStatus] = useState<"idle" | "loading" | "verified" | "failed" | "gateway-error">("idle");
  const [inspectError, setInspectError] = useState("");
  // net_score = vouch_score − flag_count; drives displayed pts and status
  const [vouchScore, setVouchScore] = useState(post.net_score ?? (post.consensus_score ?? 0) - (post.flag_count ?? 0));
  const [rawVouchScore, setRawVouchScore] = useState(post.consensus_score ?? 0);
  const [status, setStatus] = useState(post.status ?? "pending");
  const [isVouchLoading, setIsVouchLoading] = useState(false);
  const [hasVouched, setHasVouched] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [hasFlag, setHasFlag] = useState(false);
  const [flagCount, setFlagCount] = useState(post.flag_count ?? 0);
  const [idkitOpen, setIdkitOpen] = useState(false);
  const [idkitRpContext, setIdkitRpContext] = useState<RpContext | null>(null);
  const [idkitMode, setIdkitMode] = useState<"vouch" | "flag" | null>(null);
  const [imgGatewayIdx, setImgGatewayIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimulatingDispute, setIsSimulatingDispute] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isFakeCid = !post.cid || post.cid.startsWith("QmTest") || post.cid.length < 20;
  const shortCid = isFakeCid ? "QmTest...fake" : `${post.cid.slice(0, 12)}...${post.cid.slice(-6)}`;
  const timeAgo = getTimeAgo(post.created_at);
  const imageUrls = getEvidenceImageUrls(post.cid, post.evidence_paths);
  const imageUrl = imageUrls[imgGatewayIdx] ?? null;

  // Auto-fail IPFS image if it doesn't load within 12 seconds — prevents infinite spinner
  useEffect(() => {
    if (!imageUrls.length || imgLoaded || imgError) return;
    const t = setTimeout(() => setImgError(true), 12_000);
    return () => clearTimeout(t);
  }, [imgGatewayIdx, imgLoaded, imgError, imageUrls.length]);

  const handleImgError = () => {
    if (imgGatewayIdx < imageUrls.length - 1) {
      setImgGatewayIdx(idx => idx + 1);
      setImgLoaded(false);
    } else {
      setImgError(true);
    }
  };
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const tierCfg = TIER_CONFIG[post.verification_tier as keyof typeof TIER_CONFIG ?? "device"] ?? TIER_CONFIG.device;
  const progressPct = Math.min(100, Math.max(0, Math.round((vouchScore / VERIFIED_THRESHOLD) * 100)));

  const copyCid = () => {
    navigator.clipboard.writeText(post.cid);
    toast.success("CID copied to clipboard");
  };

  useEffect(() => {
    if (idkitRpContext && !idkitOpen) {
      setIdkitOpen(true);
    }
  }, [idkitRpContext]);

  const handleWorldIdResult = async (result: IDKitResult, mode: "vouch" | "flag") => {
    const verification = await verifyProof(WORLD_ID_RP_ID, result);
    const nullifierHash = verification.nullifier_hash || getNullifierFromResult(result);

    if (mode === "vouch") {
      const tier: "device" | "orb" = verification.verification_level === "orb" ? "orb" : "device";
      try {
        const vouchResult = await vouch(post.id, nullifierHash, tier);
        const newRaw = vouchResult.vouches;
        setRawVouchScore(newRaw);
        setVouchScore(vouchResult.net_score ?? newRaw - flagCount);
        setStatus(vouchResult.status as "pending" | "verified" | "disputed");
        setHasVouched(true);
        const tierLabel = tier === "orb" ? "Orb (+10 pts)" : "Device (+1 pt)";
        toast.success(`Vouch recorded as ${tierLabel}, anchoring on World Chain...`, {
          action: {
            label: "View Contract ↗",
            onClick: () => window.open(
              "https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6?tab=logs",
              "_blank"
            ),
          },
          duration: 8000,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Vouch failed";
        if (msg.includes("already vouched") || msg.includes("UNIQUE constraint")) {
          setHasVouched(true);
          toast.info("Already vouched for this inscription");
        } else {
          toast.error(msg);
          throw err;
        }
      }
    } else {
      if (!nullifierHash || nullifierHash.startsWith("vouch_")) {
        toast.error("World ID verification did not return a valid identity. Please try again.");
        return;
      }
      const flagRes = await fetch(`/api/inscriptions/${post.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nullifierHash, reason: "Reported as disputed" }),
      });
      const data = await flagRes.json();
      if (flagRes.status === 409) {
        setHasFlag(true);
        setFlagCount(data.flags);
        toast.info("Already flagged this inscription");
        return;
      }
      if (!flagRes.ok) throw new Error(data.error || "Flag failed");
      setHasFlag(true);
      const newFlagCount = data.flags;
      setFlagCount(newFlagCount);
      setVouchScore(data.net_score ?? rawVouchScore - newFlagCount);
      if (data.status) setStatus(data.status as "pending" | "verified" | "disputed");
      toast.success("Flagged with World ID. 1 flag per person. Anchoring on World Chain...", {
        action: {
          label: "View Contract ↗",
          onClick: () => window.open(
            "https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6?tab=logs",
            "_blank"
          ),
        },
        duration: 8000,
      });
    }
  };

  const openVerification = async (mode: "vouch" | "flag") => {
    // Path A: Inside World App — use MiniKit native verification
    if (isInWorldApp()) {
      const signal = mode === "vouch" ? `vouch-${post.id}` : `flag-${post.id}`;
      try {
        const worldProof = await miniKitVerify(WORLD_ID_ACTION, signal);
        const result = {
          proof: worldProof.proof,
          merkle_root: worldProof.merkle_root,
          nullifier_hash: worldProof.nullifier_hash,
          verification_level: worldProof.verification_level,
        } as IDKitResult;
        await handleWorldIdResult(result, mode);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "MiniKit verification failed");
      }
      return;
    }

    // Path B: Regular browser — open IDKit widget
    try {
      const sig = await getRpSignature(WORLD_ID_ACTION);
      const ctx: RpContext = {
        rp_id: WORLD_ID_RP_ID,
        nonce: sig.nonce,
        created_at: sig.created_at,
        expires_at: sig.expires_at,
        signature: sig.sig,
      };
      setIdkitMode(mode);
      setIdkitRpContext(ctx);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start World ID verification");
    }
  };

  const handleVouchClick = async () => {
    if (isVouchLoading || hasVouched) return;
    setIsVouchLoading(true);
    try {
      await openVerification("vouch");
    } finally {
      setIsVouchLoading(false);
    }
  };

  const handleIdkitVerify = async (result: IDKitResult) => {
    if (!idkitMode) return;
    await handleWorldIdResult(result, idkitMode);
    setIdkitOpen(false);
  };

  const handleSimulateOrb = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    try {
      const result = await simulateOrbVouch(post.id);
      const newRaw = result.vouches;
      setRawVouchScore(newRaw);
      const ns = result.net_score ?? newRaw - flagCount;
      setVouchScore(ns);
      setStatus(result.status as "pending" | "verified" | "disputed");
      toast.success(`Orb vouch simulated, ${ns} pts net score, anchoring on World Chain...`, {
        action: {
          label: "View on World Chain ↗",
          onClick: () => window.open(
            "https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6?tab=logs",
            "_blank"
          ),
        },
        duration: 6000,
      });
    } catch {
      toast.error("Failed to simulate orb vouch");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateDispute = async () => {
    if (isSimulatingDispute) return;
    setIsSimulatingDispute(true);
    try {
      const result = await simulateDisputeFlags(post.id);
      const newFlagCount = result.flags;
      setFlagCount(newFlagCount);
      const ns = result.net_score ?? result.vouches - newFlagCount;
      setVouchScore(ns);
      setStatus(result.status as "pending" | "verified" | "disputed");
      toast.success(`Flag anchored on World Chain. Net score: ${ns} pts`, {
        action: {
          label: "View Contract ↗",
          onClick: () => window.open(
            "https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6?tab=logs",
            "_blank"
          ),
        },
        duration: 6000,
      });
    } catch {
      toast.error("Failed to simulate flag");
    } finally {
      setIsSimulatingDispute(false);
    }
  };

  const handleResetDemo = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      const result = await resetDemo(post.id);
      setFlagCount(result.flagCount);
      setRawVouchScore(result.vouchScore);
      setVouchScore(result.net_score ?? result.vouchScore - result.flagCount);
      setStatus(result.status as "pending" | "verified" | "disputed");
      setHasVouched(false);
      setHasFlag(false);
      toast.success("Demo state reset. Start fresh.");
    } catch {
      toast.error("Failed to reset demo");
    } finally {
      setIsResetting(false);
    }
  };

  const handleFlagClick = async () => {
    if (isFlagging || hasFlag) return;
    setIsFlagging(true);
    try {
      await openVerification("flag");
    } finally {
      setIsFlagging(false);
    }
  };

  const runInspect = async () => {
    if (isFakeCid) {
      setInspectError("This inscription uses a test/demo CID that doesn't exist on IPFS. Upload real content to verify.");
      setInspectStatus("gateway-error");
      return;
    }
    setInspectStatus("loading");
    setInspectError("");
    try {
      let contentHash = post.content_hash;
      let evidencePaths: string[] | null = null;

      try {
        const metaRes = await fetchFromIPFS(post.cid, "metadata.json", 12000);
        const meta = await metaRes.json();
        contentHash = meta.contentHash || meta.content_hash || post.content_hash;
        evidencePaths = meta.evidencePaths || (meta.evidence_paths ? JSON.parse(meta.evidence_paths) : null) || null;
      } catch {
        // IPFS metadata unavailable — use DB values (content_hash + evidence_paths)
        try {
          evidencePaths = post.evidence_paths ? JSON.parse(post.evidence_paths) : null;
        } catch {
          evidencePaths = null;
        }
      }

      if (!evidencePaths) {
        evidencePaths = ["evidence"];
      }

      const paths = Array.isArray(evidencePaths) ? evidencePaths : [evidencePaths];
      const blobs: { name: string; data: ArrayBuffer }[] = [];

      for (const p of paths) {
        const path = p.startsWith("evidence/") ? p : `evidence/${p}`;
        try {
          const res = await fetchFromIPFS(post.cid, path, 12000);
          blobs.push({ name: p, data: await res.arrayBuffer() });
        } catch {
          try {
            const res = await fetchFromIPFS(post.cid, p, 12000);
            blobs.push({ name: p, data: await res.arrayBuffer() });
          } catch {
            throw new Error(`Evidence not found on any IPFS gateway: ${p}`);
          }
        }
      }

      if (blobs.length === 0) throw new Error("No evidence found in IPFS content");

      const valid = await verifyContentHashMultiple(blobs, contentHash);
      setInspectStatus(valid ? "verified" : "failed");
    } catch (err) {
      console.error("Inspect error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("gateway") || msg.includes("All IPFS")) {
        setInspectError(msg);
        setInspectStatus("gateway-error");
      } else {
        setInspectError(msg);
        setInspectStatus("failed");
      }
    }
  };

  const isVerified = status === "verified";

  return (
    <>
      {idkitRpContext && (
        <IDKitRequestWidget
          app_id={WORLD_ID_APP_ID as `app_${string}`}
          action={WORLD_ID_ACTION}
          rp_context={idkitRpContext}
          allow_legacy_proofs={true}
          environment={WORLD_ID_ENV}
          preset={deviceLegacy({ signal: String(post.id) })}
          open={idkitOpen}
          onOpenChange={(open) => {
            setIdkitOpen(open);
            if (!open) {
              setIdkitRpContext(null);
              setIdkitMode(null);
            }
          }}
          onSuccess={() => {}}
          handleVerify={handleIdkitVerify}
          onError={(code) => {
            console.error("[IDKit error]", code);
            setIdkitOpen(false);
            setIdkitRpContext(null);
            setIdkitMode(null);
            const messages: Record<string, string> = {
              generic_error: "World ID error. Please check credentials.",
              connection_failed: "World App connection failed. Please try again.",
              timeout: "Verification timeout. Please try again.",
              cancelled: "Verification cancelled.",
              user_rejected: "Verification cancelled.",
              verification_rejected: "Verification rejected.",
            };
            const key = String(code).toLowerCase().replace(/\./g, "_");
            toast.error(messages[key] ?? `World ID error: ${code}`, { duration: 5000 });
          }}
        />
      )}

      <article
        className={`group bg-card border border-white/8 rounded-xl transition-all duration-300 overflow-hidden ${
          isVerified ? "hover:border-emerald-500/30 hover:shadow-[0_0_28px_rgba(16,185,129,0.15)]" : "hover:border-stele-gold/30 hover:shadow-[0_0_28px_rgba(205,147,60,0.12)]"
        }`}
        data-testid={`card-inscription-${post.id}`}
      >
        {imageUrl && !imgError ? (
          <div className="relative w-full h-48 bg-secondary overflow-hidden">
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">Loading from IPFS...</span>
              </div>
            )}
            <img
              src={imageUrl}
              alt={post.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={handleImgError}
              data-testid={`img-evidence-${post.id}`}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
            {imgLoaded && <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />}
            {imgLoaded && isVerified && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-500/90 text-white text-[10px] font-mono rounded-sm font-bold tracking-wider">
                <CheckCircle className="w-3 h-3" />
                VERIFIED
              </div>
            )}
          </div>
        ) : imageUrl && imgError ? (
          <div className="w-full h-32 bg-secondary flex flex-col items-center justify-center gap-2 border-b border-border">
            <ImageOff className="w-6 h-6 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">IPFS image not accessible</span>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-stele-gold hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Try open directly
            </a>
          </div>
        ) : null}

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <span
              className="px-2 py-1 text-[10px] font-mono tracking-widest uppercase text-stele-gold bg-secondary rounded-sm"
              data-testid={`text-category-${post.id}`}
            >
              {post.category}
            </span>
            <div className="flex flex-col items-end gap-1">
              <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase rounded-sm ${statusCfg.className}`} data-testid={`status-badge-${post.id}`}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-mono ${tierCfg.className}`}>
                <span>{tierCfg.icon}</span>
                {tierCfg.label}
              </span>
              {post.world_chain_tx && (
                <a
                  href={`https://worldchain-sepolia.explorer.alchemy.com/tx/${post.world_chain_tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`badge-worldchain-${post.id}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase rounded-sm bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors"
                >
                  ⛓ World Chain
                </a>
              )}
            </div>
          </div>

          {isVerified && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase font-bold">
                Digital Seal of Truth: Consensus Achieved
              </span>
            </div>
          )}

          <h3
            className="font-display text-xl font-semibold mb-3 text-foreground leading-tight group-hover:text-stele-inscription transition-colors"
            data-testid={`text-title-${post.id}`}
          >
            {post.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4" data-testid={`text-excerpt-${post.id}`}>
            {post.excerpt}
          </p>

          {!isVerified && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-muted-foreground">CONSENSUS PROGRESS</span>
                <span className="text-[10px] font-mono text-muted-foreground">{vouchScore}/{VERIFIED_THRESHOLD} pts</span>
              </div>
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-stele-gold transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {post.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Shield className="w-3 h-3 text-stele-gold-dim" />
              {post.author_hash}
            </span>
            {post.ela_score !== null && post.ela_score !== undefined && (
              <span className={`flex items-center gap-1 text-[10px] font-mono ${
                post.ela_score < 25 ? "text-emerald-400" : post.ela_score < 55 ? "text-yellow-400" : "text-red-400"
              }`}>
                ELA: {post.ela_score < 25 ? "✓" : post.ela_score < 55 ? "⚠" : "✗"} {
                  post.ela_score < 25 ? "Authentic" : post.ela_score < 55 ? "Suspect" : "Tampered"
                }
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyCid}
                data-testid={`button-copy-cid-${post.id}`}
                className="flex items-center gap-1.5 text-[10px] font-mono text-stele-gold-dim hover:text-stele-gold transition-colors"
              >
                <Copy className="w-3 h-3" />
                {shortCid}
              </button>
              <button
                onClick={() => { setInspectOpen(true); setInspectStatus("idle"); setInspectError(""); }}
                data-testid={`button-inspect-${post.id}`}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono stele-border rounded-sm hover:bg-secondary transition-colors"
              >
                <Search className="w-3 h-3" />
                Inspect
              </button>
              <button
                onClick={handleFlagClick}
                disabled={isFlagging || hasFlag}
                data-testid={`button-flag-${post.id}`}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono stele-border rounded-sm transition-colors ${
                  hasFlag ? "text-red-400 cursor-default" : "text-muted-foreground hover:text-red-400 hover:bg-secondary"
                }`}
                title="Report with World ID (1 flag per person)"
              >
                {isFlagging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                {hasFlag ? "Reported" : "Flag"}
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-red-400/60" data-testid={`text-flag-count-${post.id}`}>
                ⚑ {flagCount}
              </span>
              <button
                onClick={handleSimulateDispute}
                disabled={isSimulatingDispute}
                data-testid={`button-simulate-dispute-${post.id}`}
                title="Demo: add 1 flag (+1 per click, 5 flags needed for disputed)"
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-red-500/30 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-colors"
              >
                {isSimulatingDispute ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                +1 Flag
              </button>
              <button
                onClick={handleSimulateOrb}
                disabled={isSimulating}
                data-testid={`button-simulate-orb-${post.id}`}
                title="Demo: simulate Orb-level vouch (+10 pts)"
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-stele-gold/30 text-stele-gold/60 hover:text-stele-gold hover:bg-stele-gold/10 rounded-sm transition-colors"
              >
                {isSimulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>⬡</span>}
                +10 Orb
              </button>
              <button
                onClick={handleResetDemo}
                disabled={isResetting}
                data-testid={`button-reset-demo-${post.id}`}
                title="Reset all demo flags and vouches to start fresh"
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-muted-foreground/30 text-muted-foreground/60 hover:text-foreground hover:bg-secondary rounded-sm transition-colors"
              >
                {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Reset
              </button>
              <button
                onClick={handleVouchClick}
                disabled={isVouchLoading || hasVouched}
                data-testid={`button-vouch-${post.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 stele-border rounded-sm text-xs font-body font-medium transition-all ${
                  hasVouched
                    ? "text-stele-verified bg-stele-verified/10 cursor-default"
                    : "text-stele-inscription hover:bg-secondary hover:text-foreground"
                } disabled:opacity-70`}
              >
                {isVouchLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : hasVouched ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                {hasVouched ? "Vouched" : "Vouch"} · {vouchScore} pts
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60">
              <Shield className="w-2.5 h-2.5" />
              <span>Vouch & Flag require World ID · Device = 1pt · Orb = 10pts · Disputed if flags &gt; vouches</span>
            </div>
            {rawVouchScore > 0 && (
              <a
                href={`https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6?tab=logs`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                data-testid={`badge-vouches-onchain-${post.id}`}
                className="flex items-center gap-1 text-[10px] font-mono text-violet-400/70 hover:text-violet-400 transition-colors"
                title="Vouch pts anchored on World Chain. Click to verify."
              >
                ⛓ {rawVouchScore} vouch pts on-chain ↗
              </a>
            )}
            {flagCount > 0 && (
              <a
                href={`https://worldchain-sepolia.explorer.alchemy.com/address/0xFc766E735eD539b5889da4b576CBD7818F5A3Ba6?tab=logs`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                data-testid={`badge-flags-onchain-${post.id}`}
                className="flex items-center gap-1 text-[10px] font-mono text-red-400/70 hover:text-red-400 transition-colors"
                title="Flag transactions anchored on World Chain"
              >
                ⚑ {flagCount} flag{flagCount !== 1 ? "s" : ""} on-chain ↗
              </a>
            )}
          </div>
        </div>
      </article>

      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-4 h-4 text-stele-gold" />
              Immutable Proof Inspector
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {inspectStatus === "idle" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Cryptographic proof that this story is authentic, human-authored, and unmodified since inscription.
                </p>

                {/* Proof fields */}
                <div className="space-y-2">
                  {[
                    { label: "IPFS CID", value: post.cid, color: "text-stele-gold" },
                    { label: "SHA-256 Hash", value: post.content_hash || "N/A", color: "text-blue-400" },
                    { label: "Author Hash", value: post.author_hash || "N/A", color: "text-emerald-400" },
                  ].map((row) => (
                    <div key={row.label} className="p-2.5 bg-secondary/50 rounded-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{row.label}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(row.value); toast.success(`${row.label} copied`); }}
                          className="p-0.5 hover:text-stele-gold transition-colors text-muted-foreground"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className={`text-[10px] font-mono break-all leading-relaxed ${row.color}`}>{row.value}</p>
                    </div>
                  ))}
                </div>

                {/* World Chain anchor */}
                {post.world_chain_tx && (
                  <div className="p-3 rounded-sm bg-violet-500/10 border border-violet-500/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-violet-400">⛓ World Chain Inscription TX</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { navigator.clipboard.writeText(post.world_chain_tx!); toast.success("TX hash copied"); }}
                          className="p-0.5 hover:text-violet-400 transition-colors text-muted-foreground"
                          data-testid={`button-copy-tx-${post.id}`}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <a
                          href={`https://worldchain-sepolia.explorer.alchemy.com/tx/${post.world_chain_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-worldchain-tx-${post.id}`}
                          className="p-0.5 hover:text-violet-400 transition-colors text-muted-foreground"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-violet-300 break-all">{post.world_chain_tx}</p>
                  </div>
                )}

                <VouchTxList inscriptionId={post.id} open={inspectOpen} />
                <FlagTxList inscriptionId={post.id} open={inspectOpen} />

                {/* ELA score in inspect */}
                {post.ela_score !== null && post.ela_score !== undefined && (
                  <div className={`p-3 rounded-sm border ${
                    post.ela_score < 25
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : post.ela_score < 55
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Forensic ELA Analysis</p>
                    <p className={`text-sm font-mono font-bold ${
                      post.ela_score < 25 ? "text-emerald-400" : post.ela_score < 55 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {post.ela_score < 25 ? "✓ AUTHENTIC" : post.ela_score < 55 ? "⚠ SUSPECT" : "✗ TAMPERED"} (Score: {post.ela_score.toFixed(1)})
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {post.ela_score < 25
                        ? "No pixel manipulation detected at time of inscription."
                        : post.ela_score < 55
                        ? "Minor inconsistencies detected. Review with caution."
                        : "High probability of digital manipulation."}
                    </p>
                  </div>
                )}

                {isFakeCid && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-400">
                      Demo CID. Real inscriptions uploaded via Storacha will have a verifiable IPFS CID.
                    </p>
                  </div>
                )}
              </div>
            )}
            {inspectStatus === "loading" && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching from IPFS gateway...
              </div>
            )}
            {inspectStatus === "verified" && (
              <div className="flex items-center gap-2 p-4 rounded-sm bg-stele-verified/20 border border-stele-verified/50" data-testid="status-true-human-witness">
                <CheckCircle className="w-5 h-5 text-stele-verified" />
                <div>
                  <p className="font-semibold text-stele-verified">TRUE HUMAN WITNESS</p>
                  <p className="text-xs text-muted-foreground">SHA-256 hash matches IPFS content</p>
                </div>
              </div>
            )}
            {inspectStatus === "failed" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-4 rounded-sm bg-destructive/20 border border-destructive/50" data-testid="status-verification-failed">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">Hash mismatch</p>
                    <p className="text-xs text-muted-foreground">Content may have been tampered with</p>
                  </div>
                </div>
                {inspectError && <p className="text-xs text-muted-foreground font-mono">{inspectError}</p>}
              </div>
            )}
            {inspectStatus === "gateway-error" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-4 rounded-sm bg-yellow-500/10 border border-yellow-500/30">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-400">IPFS Gateway Unreachable</p>
                    <p className="text-xs text-muted-foreground mt-1">{inspectError || "Content not accessible via gateway."}</p>
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded-sm text-[10px] font-mono space-y-1 text-muted-foreground">
                  <p className="text-foreground font-semibold mb-1">Gateways tried:</p>
                  {ALL_GATEWAYS.map(gw => (
                    <p key={gw}>• {gw}</p>
                  ))}
                  <p className="mt-2 text-foreground font-semibold">Possible causes:</p>
                  <p>• IPFS propagation delay (wait 1–5 min after upload)</p>
                  <p>• Storacha node temporarily unavailable</p>
                  <p>• Content not yet replicated to Filecoin</p>
                </div>
                {!isFakeCid && (
                  <div className="flex flex-wrap gap-2">
                    {ALL_GATEWAYS.slice(0, 2).map(gw => (
                      <a
                        key={gw}
                        href={`https://${post.cid}.ipfs.${gw}/metadata.json`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-stele-gold hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {gw}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            {inspectStatus !== "loading" && (
              <button
                onClick={inspectStatus === "idle" ? runInspect : () => setInspectOpen(false)}
                data-testid="button-run-integrity-check"
                className="w-full py-2 bg-primary text-primary-foreground rounded-sm font-medium text-sm"
              >
                {inspectStatus === "idle" ? "Run Integrity Check" : "Close"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function getNullifierFromResult(result: IDKitResult): string {
  const r = result as {
    responses?: { nullifier?: string; nullifier_hash?: string; session_nullifier?: string }[];
    nullifier_hash?: string;
  };
  const first = r.responses?.[0];
  return first?.nullifier ?? first?.nullifier_hash ?? first?.session_nullifier ?? r.nullifier_hash ?? `vouch_${crypto.randomUUID()}`;
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default SteleCard;
