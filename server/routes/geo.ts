import { Router, Request, Response } from "express";

export const geoRouter = Router();

interface GeoResult {
  region: string;
  source: "ip" | "unknown";
}

async function lookupIp(ip: string): Promise<GeoResult> {
  // Remove IPv6 prefix if present (::ffff:1.2.3.4 -> 1.2.3.4)
  const cleanIp = ip.replace(/^::ffff:/, "");

  // Skip loopback / private IPs — return empty so caller uses next strategy
  if (
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.")
  ) {
    throw new Error("Private IP");
  }

  // Strategy 1: ipapi.co (free, 1000 req/day)
  try {
    const res = await fetch(`https://ipapi.co/${cleanIp}/json/`, {
      headers: { "User-Agent": "STELE-WitnessProtocol/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.error) throw new Error(data.reason || "ipapi error");
      const city = data.city || "";
      const country = data.country_name || "";
      const region = [city, country].filter(Boolean).join(", ");
      if (region) return { region, source: "ip" };
    }
  } catch {
    // fall through to next strategy
  }

  // Strategy 2: ip-api.com (free, 1000 req/min, no key required)
  try {
    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,city,country`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const city = data.city || "";
        const country = data.country || "";
        const region = [city, country].filter(Boolean).join(", ");
        if (region) return { region, source: "ip" };
      }
    }
  } catch {
    // fall through to next strategy
  }

  // Strategy 3: ipinfo.io (free tier, no key for basic info)
  try {
    const res = await fetch(`https://ipinfo.io/${cleanIp}/json`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || "";
      const country = data.country || "";
      const region = [city, country].filter(Boolean).join(", ");
      if (region) return { region, source: "ip" };
    }
  } catch {
    // all strategies exhausted
  }

  throw new Error("All geo strategies failed");
}

geoRouter.get("/", async (req: Request, res: Response) => {
  try {
    // req.ip respects trust proxy: returns real client IP from X-Forwarded-For
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "";

    const result = await lookupIp(ip);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geolocation failed";
    res.status(200).json({ region: "", source: "unknown", error: message });
  }
});
