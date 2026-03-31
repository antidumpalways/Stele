import { Shield, Upload, Loader2, ExternalLink, Plus, Sparkles, PenLine, MapPin, Activity, Smartphone, CheckCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { IDKitRequestWidget, deviceLegacy, type RpContext, type IDKitResult } from "@worldcoin/idkit";
import { generateFileHash } from "@/lib/crypto";
import { getRpSignature, verifyProof, createInscription, aiDescribe } from "@/lib/api";
import { inscribeToIPFS } from "@/lib/storacha";
import { runElaAnalysis, type ElaResult } from "@/lib/ela";
import { captureRegion } from "@/lib/geolocation";
import { isInWorldApp, miniKitVerify } from "@/lib/minikit";

const WORLD_ID_APP_ID = import.meta.env.VITE_WORLD_ID_APP_ID || "";
const WORLD_ID_RP_ID = import.meta.env.VITE_WORLD_ID_RP_ID || "";
const WORLD_ID_ACTION = import.meta.env.VITE_WORLD_ID_ACTION || "stele-inscribe";
const WORLD_ID_ENV: "production" | "staging" =
  (import.meta.env.VITE_WORLD_ID_ENV as "production" | "staging") ||
  (WORLD_ID_APP_ID.includes("staging") ? "staging" : "production");
const IPFS_GATEWAY = "storacha.link";

function getNullifierFromProof(proof: unknown): string {
  const r = proof as {
    responses?: { nullifier?: string; nullifier_hash?: string; session_nullifier?: string }[];
    nullifier_hash?: string;
  };
  const first = r.responses?.[0];
  return first?.nullifier ?? first?.nullifier_hash ?? first?.session_nullifier ?? r.nullifier_hash ?? "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ElaLevelColor: Record<string, string> = {
  clean: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  suspect: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  tampered: "text-red-400 bg-red-500/10 border-red-500/30",
};

const ElaLevelIcon: Record<string, string> = {
  clean: "✓",
  suspect: "⚠",
  tampered: "✗",
};

function RegisterToFeedForm({
  cid, contentHash, proof, filename, file, elaScore,
  onSuccess, onCancel, isSubmitting, setIsSubmitting, onError,
}: {
  cid: string; contentHash: string; proof: unknown;
  filename: string; file: File | null; elaScore: number | null;
  onSuccess: () => void; onCancel: () => void;
  isSubmitting: boolean; setIsSubmitting: (v: boolean) => void;
  onError: (s: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [mode, setMode] = useState<"choose" | "form">("choose");

  const handleAiFill = async () => {
    if (!file) return;
    setIsAiLoading(true);
    onError(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await aiDescribe(base64, file.type, file.name);
      setTitle(result.title);
      setExcerpt(result.excerpt);
      setLocation(result.location);
      setCategory(result.category);
      setMode("form");
    } catch (err) {
      onError(err instanceof Error ? err.message : "AI analysis failed");
      setMode("form");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGeoFill = async () => {
    setIsGeoLoading(true);
    try {
      const geo = await captureRegion();
      setLocation(geo.region);
      if (geo.source === "ip") {
        onError("GPS denied. Using approximate IP location instead. You can edit it manually.");
      } else {
        onError(null);
      }
    } catch {
      onError("Geolocation unavailable. Fill location manually.");
    } finally {
      setIsGeoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || !location.trim()) {
      onError("Please fill in all fields: title, excerpt, and location.");
      return;
    }
    const nullifierHash = getNullifierFromProof(proof);
    if (!nullifierHash) {
      onError("Proof does not contain a nullifier. Ensure World ID verification succeeded.");
      return;
    }
    const authorHash = `${nullifierHash.slice(0, 6)}...${nullifierHash.slice(-4)}`;
    setIsSubmitting(true);
    onError(null);
    try {
      await createInscription({
        cid, title: title.trim(), excerpt: excerpt.trim(), location: location.trim(),
        category, contentHash, nullifierHash, authorHash,
        evidencePaths: [filename], verificationTier: "device", elaScore,
      });
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to register inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "choose") {
    return (
      <div className="mt-6 pt-6 border-t border-border space-y-3">
        <p className="text-xs text-muted-foreground mb-2">Add metadata to publish your inscription in the public Record</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAiFill}
            disabled={isAiLoading}
            data-testid="button-ai-autofill"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-mono rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAiLoading ? "Analyzing..." : "Auto-fill with AI"}
          </button>
          <button
            type="button"
            onClick={() => setMode("form")}
            data-testid="button-manual-fill"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 stele-border text-sm font-mono rounded-sm hover:bg-secondary transition-all"
          >
            <PenLine className="w-4 h-4" />
            Manual
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border space-y-4">
      <p className="text-xs text-muted-foreground mb-2">Add metadata to publish your inscription in the public Record</p>
      <input
        placeholder="Headline / Title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        data-testid="input-title"
        className="w-full px-3 py-2 bg-secondary rounded-sm text-sm font-mono"
      />
      <textarea
        placeholder="Brief summary of what happened"
        required
        rows={2}
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        data-testid="input-excerpt"
        className="w-full px-3 py-2 bg-secondary rounded-sm text-sm font-mono resize-none"
      />
      <div className="relative">
        <input
          placeholder="Lokasi (City, Country)"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          data-testid="input-location"
          className="w-full pl-3 pr-10 py-2 bg-secondary rounded-sm text-sm font-mono"
        />
        <button
          type="button"
          onClick={handleGeoFill}
          disabled={isGeoLoading}
          data-testid="button-geolocate"
          title="Auto-detect region"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-primary transition-colors disabled:opacity-50"
        >
          {isGeoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-muted-foreground hover:text-primary" />}
        </button>
      </div>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        data-testid="select-category"
        className="w-full px-3 py-2 bg-secondary rounded-sm text-sm font-mono"
      >
        <option value="All">All</option>
        <option value="Environment">Environment</option>
        <option value="Governance">Governance</option>
        <option value="Conflict">Conflict</option>
        <option value="Misinformation">Misinformation</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="button-submit-inscription"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-mono rounded-sm disabled:opacity-50"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("choose"); setTitle(""); setExcerpt(""); setLocation(""); setCategory("All"); }}
          data-testid="button-back-choose"
          className="px-4 py-2 stele-border text-sm font-mono rounded-sm hover:bg-secondary"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={onCancel}
          data-testid="button-cancel-inscription"
          className="px-4 py-2 stele-border text-sm font-mono rounded-sm hover:bg-secondary"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

const Publish = () => {
  const [file, setFile] = useState<File | null>(null);
  const [contentHash, setContentHash] = useState<string | null>(null);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [idkitOpen, setIdkitOpen] = useState(false);
  const [isCarving, setIsCarving] = useState(false);
  const [rootCid, setRootCid] = useState<string | null>(null);
  const [lastProof, setLastProof] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [elaResult, setElaResult] = useState<ElaResult | null>(null);
  const [isElaRunning, setIsElaRunning] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const hash = await generateFileHash(f);
      setFile(f);
      setContentHash(hash);
      setRootCid(null);
      setError(null);
      setElaResult(null);
      setRegistered(false);

      if (f.type.startsWith("image/")) {
        setIsElaRunning(true);
        runElaAnalysis(f)
          .then((result) => setElaResult(result))
          .catch(() => setElaResult(null))
          .finally(() => setIsElaRunning(false));
      }
    } catch (err) {
      console.error("Hash failed:", err);
      setFile(null);
      setContentHash(null);
    }
  }, []);

  const handleSuccess = useCallback(
    async (result: IDKitResult) => {
      if (!file || !contentHash) return;
      setIsCarving(true);
      setError(null);
      try {
        const cid = await inscribeToIPFS(file, result, contentHash);
        setRootCid(cid);
        setLastProof(result);
        setShowRegister(true);
      } catch (err) {
        console.error("Inscription failed:", err);
        setError(err instanceof Error ? err.message : "IPFS upload failed");
      } finally {
        setIsCarving(false);
      }
    },
    [file, contentHash]
  );

  const requestVerification = useCallback(async () => {
    if (!contentHash) return;
    setError(null);

    // Path A: Running inside World App — use MiniKit native verification
    if (isInWorldApp()) {
      setIsCarving(true);
      try {
        const worldProof = await miniKitVerify(WORLD_ID_ACTION, contentHash);
        const result = {
          proof: worldProof.proof,
          merkle_root: worldProof.merkle_root,
          nullifier_hash: worldProof.nullifier_hash,
          verification_level: worldProof.verification_level,
        } as IDKitResult;
        await verifyProof(WORLD_ID_RP_ID, result);
        await handleSuccess(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "MiniKit verification failed";
        setError(msg);
      } finally {
        setIsCarving(false);
      }
      return;
    }

    // Path B: Regular browser — open IDKit widget with QR
    try {
      const sig = await getRpSignature(WORLD_ID_ACTION);
      const ctx: RpContext = {
        rp_id: WORLD_ID_RP_ID,
        nonce: sig.nonce,
        created_at: sig.created_at,
        expires_at: sig.expires_at,
        signature: sig.sig,
      };
      setRpContext(ctx);
      setIdkitOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isConnection = /ECONNREFUSED|Failed to fetch|NetworkError/i.test(msg);
      setError(
        isConnection
          ? "Server API not running. Run: npm run dev:all"
          : "Failed to prepare verification: " + msg
      );
    }
  }, [contentHash, handleSuccess]);

  const handleVerify = useCallback(async (result: IDKitResult) => {
    try {
      await verifyProof(WORLD_ID_RP_ID, result);
      setIdkitOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Proof verification failed";
      setError(msg);
      throw err;
    }
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="mb-12">
          <h1 className="font-mono text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            STELE INSCRIPTION
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            Atomic Binding: SHA-256 hash + World ID proof + IPFS CID anchored on World Chain.
          </p>
        </div>

        {rootCid && (
          <div className="mb-8 p-6 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-sm font-mono" data-testid="status-inscription-success">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-lg font-bold text-emerald-400 uppercase tracking-widest">
                ⛓ Inscription Sealed: Permanent Record Created
              </span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">IPFS Root CID</p>
            <p className="text-sm text-emerald-400 break-all select-all mb-1" data-testid="text-root-cid">
              {rootCid}
            </p>
            <p className="text-[10px] text-muted-foreground mb-4">
              Stored on Storacha (IPFS/Filecoin) · Content-addressed · Cannot be deleted or altered
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              <a
                href={`https://${rootCid}.ipfs.${IPFS_GATEWAY}/`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-open-ipfs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase rounded-sm hover:brightness-110 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View on IPFS
              </a>
              {showRegister && !registered && (
                <button
                  onClick={() => setShowRegister(false)}
                  data-testid="button-add-to-feed"
                  className="inline-flex items-center gap-2 px-4 py-2 stele-border font-mono text-sm rounded-sm hover:bg-secondary"
                >
                  <Plus className="w-4 h-4" />
                  Add to Feed
                </button>
              )}
            </div>

            {!showRegister && !registered && lastProof && (
              <RegisterToFeedForm
                cid={rootCid}
                contentHash={contentHash!}
                proof={lastProof}
                filename={file?.name || "evidence"}
                file={file}
                elaScore={elaResult?.score ?? null}
                onSuccess={() => setRegistered(true)}
                onCancel={() => setShowRegister(true)}
                isSubmitting={isRegistering}
                setIsSubmitting={setIsRegistering}
                onError={setError}
              />
            )}
            {registered && (
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400" data-testid="status-registered">
                <CheckCircle className="w-4 h-4" />
                Added to the Record, visible in the Feed and anchoring on World Chain
              </div>
            )}
          </div>
        )}

        {isCarving && (
          <div className="mb-8 p-6 bg-secondary/50 border border-primary/30 rounded-sm font-mono flex items-center gap-3" data-testid="status-carving">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm font-bold uppercase tracking-wider">Carving into Stele...</span>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/50 rounded-sm font-mono" data-testid="status-error">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <label className="font-mono text-xs text-muted-foreground block mb-3">
            [1] SELECT EVIDENCE
          </label>
          <input
            type="file"
            accept="image/*,video/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            data-testid="input-file"
            disabled={isCarving}
          />
          <label
            htmlFor="file-input"
            data-testid="label-file-drop"
            className={`flex flex-col items-center justify-center border-2 border-dashed border-border rounded-sm p-12 cursor-pointer hover:border-primary/50 transition-colors font-mono ${isCarving ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-3" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "DROP FILE HERE"}
            </span>
          </label>
        </div>

        {(isElaRunning || elaResult) && (
          <div className="mb-8" data-testid="section-ela">
            <label className="font-mono text-xs text-muted-foreground block mb-3">
              [2] FORENSIC AUDIT (ELA)
            </label>
            {isElaRunning ? (
              <div className="p-4 bg-secondary/50 border border-border rounded-sm font-mono flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs uppercase tracking-wider">Running Error Level Analysis...</span>
              </div>
            ) : elaResult && (
              <div className={`p-4 rounded-sm border font-mono ${ElaLevelColor[elaResult.level]}`} data-testid="status-ela-result">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {ElaLevelIcon[elaResult.level]} ELA: {elaResult.label} ({elaResult.score}/100)
                  </span>
                </div>
                <p className="text-[11px] opacity-80">{elaResult.details}</p>
              </div>
            )}
          </div>
        )}

        {contentHash && (
          <div className="mb-8 p-4 bg-secondary/50 border border-primary/30 rounded-sm font-mono" data-testid="status-crypto-locked">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">CRYPTO-LOCKED</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">SHA-256 (Signal)</p>
            <p className="text-xs text-foreground break-all select-all" data-testid="text-content-hash">
              {contentHash}
            </p>
          </div>
        )}

        <div className="mb-8">
          <label className="font-mono text-xs text-muted-foreground block mb-3">
            {elaResult ? "[3]" : "[2]"} VERIFY HUMAN
          </label>
          <button
            onClick={requestVerification}
            disabled={!contentHash || !WORLD_ID_APP_ID || !WORLD_ID_RP_ID || isCarving}
            data-testid="button-verify-worldid"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-wider rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4" />
            Verify with World ID
          </button>
          {(!WORLD_ID_APP_ID || !WORLD_ID_RP_ID) && (
            <p className="font-mono text-xs text-destructive mt-2" data-testid="text-missing-config">
              {!WORLD_ID_APP_ID ? "Set VITE_WORLD_ID_APP_ID" : "Set VITE_WORLD_ID_RP_ID"} in environment
            </p>
          )}
        </div>

        {rpContext && (
          <IDKitRequestWidget
            open={idkitOpen}
            onOpenChange={(open) => !open && setIdkitOpen(false)}
            app_id={WORLD_ID_APP_ID as `app_${string}`}
            action={WORLD_ID_ACTION}
            rp_context={rpContext}
            allow_legacy_proofs={true}
            environment={WORLD_ID_ENV}
            preset={deviceLegacy({ signal: contentHash || "" })}
            handleVerify={handleVerify}
            onSuccess={handleSuccess}
            onError={(code) => {
              setIdkitOpen(false);
              if (String(code) === "failed_by_host_app") return;
              const messages: Record<string, string> = {
                generic_error: "World ID error. Please check credentials.",
                connection_failed: "World App connection failed. Please try again.",
                timeout: "Verification timeout. Please try again.",
                cancelled: "Verification cancelled.",
                user_rejected: "Verification cancelled.",
                verification_rejected: "Verification rejected.",
              };
              const key = String(code).toLowerCase().replace(/\./g, "_");
              setError(messages[key] ?? `World ID error: ${code}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Publish;
