import { useWorldApp } from "@/hooks/useWorldApp";
import { Shield, Wifi, Zap } from "lucide-react";

export function WorldAppBanner() {
  const { isWorldApp } = useWorldApp();

  if (!isWorldApp) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-r from-violet-900/95 via-violet-800/95 to-indigo-900/95 border-b border-violet-500/40 backdrop-blur-sm"
      data-testid="banner-world-app"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              World App
            </span>
          </div>
          <span className="font-mono text-[10px] text-violet-300 truncate">
            Verified human session · MiniKit active
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono text-violet-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Orb
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            World Chain
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            IPFS
          </span>
        </div>
      </div>
    </div>
  );
}

export function WorldAppSpacer() {
  const { isWorldApp } = useWorldApp();
  if (!isWorldApp) return null;
  return <div className="h-10" />;
}
