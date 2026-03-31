import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getNetworkStats } from "@/lib/api";
import { Database, Link2, ShieldCheck, ArrowRight, ExternalLink, Key } from "lucide-react";

const IPFS_GATEWAY = "https://w3s.link/ipfs";

function shortCid(cid: string) {
  return `${cid.slice(0, 8)}…${cid.slice(-6)}`;
}

export default function StorageNetwork() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["network-stats"],
    queryFn: getNetworkStats,
    refetchInterval: 30_000,
  });

  if (isLoading || !stats) {
    return (
      <div className="stele-border rounded-sm p-6 bg-card/40 backdrop-blur-sm animate-pulse">
        <div className="h-4 bg-secondary rounded w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary rounded" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Stories Sealed",
      value: stats.total,
      icon: Database,
      color: "text-stele-gold",
      testId: "stat-total",
    },
    {
      label: "IPFS CIDs Anchored",
      value: stats.uniqueCids,
      icon: Link2,
      color: "text-stele-verified",
      testId: "stat-cids",
    },
    {
      label: "UCAN Delegations",
      value: stats.delegationsIssued,
      icon: Key,
      color: "text-blue-400",
      testId: "stat-delegations",
    },
    {
      label: "Verified Stories",
      value: stats.verified,
      icon: ShieldCheck,
      color: "text-emerald-400",
      testId: "stat-verified",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-stele-verified animate-pulse-gold" />
        <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
          Storacha Storage Network
        </span>
      </div>

      <div className="stele-border rounded-sm bg-card/40 backdrop-blur-sm overflow-hidden">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {statCards.map((s) => (
            <div
              key={s.label}
              data-testid={s.testId}
              className="p-5 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </span>
              </div>
              <span className="text-3xl font-display font-bold text-foreground">
                {s.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* UCAN delegation chain visual */}
        <div className="border-t border-border px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            UCAN Delegation Flow: each inscription issues one cryptographic delegation
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {[
              { label: "Storacha Space", sub: "Root Authority", color: "bg-stele-gold/10 text-stele-gold border-stele-gold/30" },
              { label: "STELE Server", sub: "Delegator", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
              { label: "Journalist Agent", sub: "DID (Browser)", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
              { label: "Story Upload", sub: "IPFS / Filecoin", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
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
            <span className="ml-auto text-muted-foreground text-[10px]">
              ×{stats.delegationsIssued} issued
            </span>
          </div>
        </div>

        {/* Recent CIDs */}
        {stats.recentCids.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Recently Anchored CIDs
            </p>
            <div className="flex flex-col gap-1.5">
              {stats.recentCids.map((cid) => (
                <a
                  key={cid}
                  href={`${IPFS_GATEWAY}/${cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`cid-link-${cid.slice(0, 8)}`}
                  className="flex items-center gap-2 group w-fit"
                >
                  <span className="text-xs font-mono text-muted-foreground group-hover:text-stele-gold transition-colors">
                    {shortCid(cid)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-stele-gold transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
