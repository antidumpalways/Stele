import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getNetworkStats } from "@/lib/api";
import {
  Database, Link2, Key, ShieldCheck, ArrowRight,
  ExternalLink, Clock, Globe, Layers, Users,
  CheckCircle, Flag, Copy,
} from "lucide-react";
import { toast } from "sonner";

const IPFS_GATEWAY = "https://w3s.link/ipfs";
const EXPLORER = "https://worldchain-sepolia.explorer.alchemy.com";

function shortCid(cid: string) {
  return `${cid.slice(0, 12)}…${cid.slice(-8)}`;
}

function shortTx(tx: string) {
  return `${tx.slice(0, 14)}…${tx.slice(-6)}`;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied`);
  });
}

const UCAN_NODES = [
  {
    label: "Storacha Space",
    sub: "Root Authority",
    desc: "Persistent IPFS/Filecoin storage space owned by STELE. All content is content-addressed and censorship-resistant.",
    color: "border-stele-gold/40 bg-stele-gold/5 text-stele-gold",
    dot: "bg-stele-gold",
  },
  {
    label: "STELE Server",
    sub: "Delegator",
    desc: "Issues a scoped UCAN delegation to each journalist's ephemeral browser agent. The server never stores user files.",
    color: "border-blue-500/40 bg-blue-500/5 text-blue-400",
    dot: "bg-blue-400",
  },
  {
    label: "Journalist Agent",
    sub: "DID (Browser)",
    desc: "Ephemeral DID generated in the browser for each session. Receives upload capability via UCAN, no account needed.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    dot: "bg-purple-400",
  },
  {
    label: "Story Upload",
    sub: "IPFS / Filecoin",
    desc: "Evidence + World ID proof bundled and uploaded directly from the browser. CID returned and anchored immutably.",
    color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
    dot: "bg-emerald-400",
  },
];

const Network = () => {
  const { data: stats, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["network-stats"],
    queryFn: getNetworkStats,
    refetchInterval: 30_000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-stele-verified animate-pulse" />
              Powered by Storacha · IPFS · Filecoin · World Chain
            </span>
            {lastUpdated && (
              <span className="text-[10px] font-mono text-muted-foreground/50 ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                updated {lastUpdated}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            The <span className="text-gradient-gold">Network</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Live transparency dashboard. Every inscription is permanently anchored on the decentralized web.
            No single server controls the truth.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="stele-border rounded-sm p-5 bg-card/40 animate-pulse h-24" />
            ))
          ) : stats ? (
            [
              { label: "Stories Sealed", value: stats.total, icon: Database, color: "text-stele-gold", testId: "stat-total" },
              { label: "Verified", value: stats.verified, icon: ShieldCheck, color: "text-emerald-400", testId: "stat-verified" },
              { label: "Total Vouches", value: stats.totalVouches, icon: Users, color: "text-blue-400", testId: "stat-vouches" },
              { label: "On-Chain Anchors", value: stats.worldChain?.onChainAnchored ?? 0, icon: Layers, color: "text-violet-400", testId: "stat-onchain" },
            ].map((s) => (
              <div
                key={s.label}
                data-testid={s.testId}
                className="stele-border rounded-sm p-5 bg-card/40 backdrop-blur-sm"
              >
                <s.icon className={`w-4 h-4 ${s.color} mb-3`} />
                <div className="text-3xl font-display font-bold text-foreground mb-0.5">
                  {s.value.toLocaleString()}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))
          ) : null}
        </motion.div>

        {/* Status breakdown */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="stele-border rounded-sm bg-card/40 backdrop-blur-sm p-6 mb-10"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Inscription Status Breakdown
            </p>
            <div className="flex gap-6 flex-wrap">
              {[
                { label: "Verified", value: stats.verified, color: "text-emerald-400", bar: "bg-emerald-400" },
                { label: "Pending", value: stats.pending, color: "text-stele-gold", bar: "bg-stele-gold" },
                { label: "Disputed", value: stats.disputed, color: "text-red-400", bar: "bg-red-400" },
              ].map((s) => (
                <div key={s.label} className="flex-1 min-w-[80px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono uppercase ${s.color}`}>{s.label}</span>
                    <span className="text-sm font-display font-bold text-foreground">{s.value}</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                      style={{ width: stats.total > 0 ? `${(s.value / stats.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-6 text-xs font-mono text-muted-foreground">
              <span>Total Vouches: <span className="text-foreground font-bold">{stats.totalVouches}</span></span>
              <span>Total Flags: <span className="text-red-400 font-bold">{stats.totalFlags ?? 0}</span></span>
              <span>Orb Witnesses: <span className="text-violet-400 font-bold">{stats.orbWitnesses ?? 0}</span></span>
              <span>Net Consensus: <span className={`font-bold ${(stats.weightedConsensus ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{stats.weightedConsensus != null ? (stats.weightedConsensus >= 0 ? "+" : "") + stats.weightedConsensus : stats.totalVouches - (stats.totalFlags ?? 0)} pts</span></span>
            </div>
          </motion.div>
        )}

        {/* World Chain section */}
        {stats?.worldChain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="stele-border rounded-sm bg-card/40 backdrop-blur-sm p-6 mb-10"
          >
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-4 h-4 text-violet-400" />
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                World Chain: On-Chain Anchor
              </p>
              <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400">
                {stats.worldChain.network}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="md:col-span-2 bg-secondary/30 rounded-sm p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  InscriptionRegistry Contract
                </div>
                <div className="flex items-center gap-2 group">
                  <a
                    href={`${stats.worldChain.explorerBase}/address/${stats.worldChain.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="worldchain-contract-link"
                    className="text-sm font-mono text-violet-400 group-hover:text-violet-300 transition-colors break-all flex-1"
                  >
                    {stats.worldChain.contractAddress}
                  </a>
                  <button
                    onClick={() => copyToClipboard(stats.worldChain!.contractAddress, "Contract address")}
                    className="shrink-0 p-1 hover:text-violet-400 transition-colors text-muted-foreground"
                    title="Copy address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`${stats.worldChain.explorerBase}/address/${stats.worldChain.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-violet-400 transition-colors" />
                  </a>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-sm p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  On-Chain Inscriptions
                </div>
                <div className="text-3xl font-display font-bold text-violet-400" data-testid="worldchain-count">
                  {stats.worldChain.onChainCount.toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">
                  {stats.worldChain.onChainAnchored} anchored from STELE
                </div>
              </div>
            </div>

            {/* Immutable proof chain */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-4">
              {[
                { label: "World ID Proof", sub: "Humanness verified", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
                { label: "SHA-256 Hash", sub: "Content integrity", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
                { label: "IPFS CID", sub: "Immutable location", color: "bg-stele-gold/10 text-stele-gold border-stele-gold/30" },
                { label: "World Chain TX", sub: "On-chain anchor", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
              ].map((node, i, arr) => (
                <div key={node.label} className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-sm border ${node.color} flex flex-col`}>
                    <span className="font-semibold">{node.label}</span>
                    <span className="text-[9px] opacity-70">{node.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] font-mono text-muted-foreground">
              Chain ID {stats.worldChain.chainId} ·{" "}
              <a
                href={`${stats.worldChain.explorerBase}/address/${stats.worldChain.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                {stats.worldChain.network}
              </a>
              {" "}· Each story anchored immutably with SHA-256 + World ID nullifier + IPFS CID
            </p>
          </motion.div>
        )}

        {/* Recent On-Chain Activity */}
        {stats && ((stats.recentVouchTxs?.length ?? 0) > 0 || (stats.recentFlagTxs?.length ?? 0) > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="stele-border rounded-sm bg-card/40 backdrop-blur-sm p-6 mb-10"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-stele-verified animate-pulse" />
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Recent On-Chain Activity
              </p>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                World Chain Sepolia
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vouch TXs */}
              {(stats.recentVouchTxs?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400/70 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Vouches
                  </p>
                  <div className="space-y-1.5">
                    {stats.recentVouchTxs.map((v, i) => (
                      <div
                        key={v.world_chain_tx}
                        className="flex items-center gap-2 p-2.5 rounded-sm bg-violet-500/5 border border-violet-500/20"
                        data-testid={`vouch-tx-row-${i}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-mono uppercase text-violet-400/70">
                              {v.tier === "orb" ? "⬡ Orb +10" : "◎ Device +1"}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {v.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => copyToClipboard(v.world_chain_tx, "TX hash")}
                            className="p-1 hover:text-violet-400 transition-colors text-muted-foreground"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`${EXPLORER}/tx/${v.world_chain_tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:text-violet-400 transition-colors text-muted-foreground"
                            title={v.world_chain_tx}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flag TXs */}
              {(stats.recentFlagTxs?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/70 mb-2 flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    Disputes
                  </p>
                  <div className="space-y-1.5">
                    {stats.recentFlagTxs.map((f, i) => (
                      <div
                        key={f.world_chain_tx}
                        className="flex items-center gap-2 p-2.5 rounded-sm bg-red-500/5 border border-red-500/20"
                        data-testid={`flag-tx-row-${i}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-mono uppercase text-red-400/70">⚑ Flag</span>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {f.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => copyToClipboard(f.world_chain_tx, "TX hash")}
                            className="p-1 hover:text-red-400 transition-colors text-muted-foreground"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`${EXPLORER}/tx/${f.world_chain_tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:text-red-400 transition-colors text-muted-foreground"
                            title={f.world_chain_tx}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* UCAN Delegation chain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="stele-border rounded-sm bg-card/40 backdrop-blur-sm p-6 mb-10"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            UCAN Delegation Flow: Trustless Upload Authorization
          </p>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {UCAN_NODES.map((node, i) => (
              <div key={node.label} className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
                <div className={`border rounded-sm p-4 w-full md:w-auto flex-1 ${node.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${node.dot}`} />
                    <span className="font-mono font-bold text-sm">{node.label}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{node.sub}</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{node.desc}</p>
                </div>
                {i < UCAN_NODES.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 rotate-90 md:rotate-0" />
                )}
              </div>
            ))}
          </div>
          {stats && (
            <p className="text-xs text-muted-foreground mt-5 pt-4 border-t border-border font-mono">
              <span className="text-stele-gold font-bold">{stats.delegationsIssued}</span> UCAN delegations issued to date ·
              Each valid for 1 year · Scoped to <span className="text-foreground">blob/add + upload/add</span> only
            </p>
          )}
        </motion.div>

        {/* Recent CIDs */}
        {stats && stats.recentCids.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="stele-border rounded-sm bg-card/40 backdrop-blur-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Recently Anchored IPFS CIDs
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <Globe className="w-3 h-3" />
                via w3s.link gateway
              </div>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {stats.recentCids.map((cid, i) => (
                <div key={cid} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-stele-gold transition-colors shrink-0" />
                    <span className="text-sm font-mono text-foreground group-hover:text-stele-gold transition-colors truncate">
                      {shortCid(cid)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyToClipboard(cid, "CID")}
                      className="p-1 hover:text-stele-gold transition-colors text-muted-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`${IPFS_GATEWAY}/${cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`cid-link-${i}`}
                      className="p-1 hover:text-stele-gold transition-colors text-muted-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-4 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Auto-refreshes every 30 seconds
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Network;
