/**
 * MiniKit utility — World App native verification
 * When running inside World App, use MiniKit instead of IDKit widget.
 * Falls back to IDKit (QR/deeplink) in regular browsers.
 */
import { MiniKit } from "@worldcoin/minikit-js";

export type WorldProof = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: "orb" | "device";
};

/**
 * Returns true if running inside World App (MiniKit available)
 */
export function isInWorldApp(): boolean {
  try {
    return MiniKit.isInstalled();
  } catch {
    return false;
  }
}

/**
 * Verify using MiniKit (World App native).
 * Only call this when isInWorldApp() === true.
 */
export async function miniKitVerify(
  action: string,
  signal: string
): Promise<WorldProof> {
  const { finalPayload } = await MiniKit.commandsAsync.verify({
    action,
    signal,
    verification_level: "device",
  });

  if (!finalPayload || (finalPayload as any).status === "error") {
    throw new Error("MiniKit verification failed or was cancelled");
  }

  const payload = finalPayload as any;
  return {
    proof: payload.proof,
    merkle_root: payload.merkle_root,
    nullifier_hash: payload.nullifier_hash,
    verification_level: payload.verification_level ?? "device",
  };
}
