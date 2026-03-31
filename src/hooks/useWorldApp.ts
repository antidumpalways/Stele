import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export interface WorldAppEnv {
  isWorldApp: boolean;
  isInstalled: boolean;
  appId: string;
}

export function useWorldApp(): WorldAppEnv {
  const appId = import.meta.env.VITE_WORLD_ID_APP_ID || "";
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const check = () => setIsInstalled(MiniKit.isInstalled());
    check();
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, []);

  return {
    isWorldApp: isInstalled,
    isInstalled,
    appId,
  };
}

export function getWorldAppDeepLink(appId: string, path = "/") {
  if (!appId) return null;
  const encoded = encodeURIComponent(path);
  return `https://worldcoin.org/mini-app?app_id=${appId}&path=${encoded}`;
}
