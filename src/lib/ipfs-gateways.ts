/**
 * IPFS Multi-Gateway Fallback
 * Tries multiple gateways in order until one responds successfully.
 */

const GATEWAYS = [
  "storacha.link",
  "w3s.link",
  "gateway.pinata.cloud",
  "dweb.link",
  "cloudflare-ipfs.com",
];

export function gatewayUrl(cid: string, path: string, gateway = GATEWAYS[0]) {
  if (gateway === "gateway.pinata.cloud") {
    return `https://gateway.pinata.cloud/ipfs/${cid}/${path}`;
  }
  return `https://${cid}.ipfs.${gateway}/${path}`;
}

/**
 * Fetch from IPFS trying multiple gateways with a timeout per gateway.
 * Returns the first successful response.
 */
export async function fetchFromIPFS(
  cid: string,
  path: string,
  timeoutMs = 12000
): Promise<Response> {
  let lastError: Error = new Error("All gateways failed");

  for (const gateway of GATEWAYS) {
    const url = gatewayUrl(cid, path, gateway);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      lastError = new Error(`Gateway ${gateway} returned ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError;
}

/**
 * Find the first working image URL across gateways.
 * Returns the URL of the first gateway that loads the image successfully.
 */
export async function findWorkingImageUrl(
  cid: string,
  path: string
): Promise<string | null> {
  for (const gateway of GATEWAYS) {
    const url = gatewayUrl(cid, path, gateway);
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      continue;
    }
  }
  return null;
}

export const ALL_GATEWAYS = GATEWAYS;
