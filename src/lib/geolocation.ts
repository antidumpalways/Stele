/**
 * Witness Map — Privacy-preserving geolocation.
 * Captures region (city/country) without exposing exact coordinates.
 * 
 * GPS first (browser Geolocation API + OpenStreetMap reverse geocode).
 * Falls back to server-side IP lookup: server reads the real client IP
 * from X-Forwarded-For headers, then queries ipapi.co / ip-api.com / ipinfo.io
 * with triple fallback. This avoids the Replit proxy masking the browser IP.
 */
export interface GeoResult {
  region: string;
  lat?: number;
  lon?: number;
  source?: "gps" | "ip";
}

async function getGpsLocation(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            { headers: { "User-Agent": "STELE-WitnessMap/1.0" } }
          );
          if (!resp.ok) throw new Error("Geocoding failed");
          const data = await resp.json();
          const addr = data.address || {};
          const city =
            addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
          const country = addr.country || "";
          const region =
            [city, country].filter(Boolean).join(", ") ||
            `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
          resolve({ region, lat, lon, source: "gps" });
        } catch {
          resolve({
            region: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
            lat,
            lon,
            source: "gps",
          });
        }
      },
      (err) => {
        reject(new Error(err.message));
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

async function getServerIpLocation(): Promise<GeoResult> {
  // Call the backend, which reads the real client IP from X-Forwarded-For
  // and queries geolocation services server-side (avoids Replit proxy masking)
  const resp = await fetch("/api/geo", {
    headers: { "Accept": "application/json" },
  });
  if (!resp.ok) throw new Error("Server geo lookup failed");
  const data = await resp.json();
  if (data.error && !data.region) throw new Error(data.error);
  const region = data.region || "";
  if (!region) throw new Error("No region returned");
  return { region, source: "ip" };
}

export async function captureRegion(): Promise<GeoResult> {
  // Try GPS first
  try {
    return await getGpsLocation();
  } catch {
    // GPS denied or unavailable, fall through to IP lookup
  }

  // Fall back to server-side IP geolocation
  try {
    return await getServerIpLocation();
  } catch {
    // All strategies exhausted
    throw new Error("Geolocation unavailable");
  }
}
