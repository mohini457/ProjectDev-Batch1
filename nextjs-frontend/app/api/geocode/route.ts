import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?q=<query>
 *
 * Multi-source geocoding proxy — Mapbox primary, Nominatim fallback:
 *  1. Mapbox Geocoding API — best POI coverage (universities, stations, shops, etc.)
 *  2. Nominatim — OSM fallback (free, no key needed)
 *
 * Mapbox free tier: 100,000 requests/month.
 */

// Simple cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = q.toLowerCase().trim();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    let results: GeoResult[] = [];

    if (mapboxToken) {
      // Mapbox as primary — excellent POI + address coverage
      results = await fetchMapbox(q, mapboxToken);
    }

    // Fallback to Nominatim if Mapbox returns nothing or has no key
    if (results.length === 0) {
      results = await fetchNominatim(q);
    }

    const response = { results: results.slice(0, 8) };

    // Cache result
    cache.set(cacheKey, { data: response, ts: Date.now() });

    // Evict old entries
    if (cache.size > 200) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 50; i++) cache.delete(oldest[i][0]);
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("Geocode proxy error:", err);

    // Last resort fallback
    try {
      const fallback = await fetchNominatim(q).catch(() => []);
      return NextResponse.json({ results: fallback });
    } catch {
      return NextResponse.json({ results: [] }, { status: 500 });
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
/** Replace Arabic/Urdu comma (،) with standard comma */
function cleanAddress(s: string) {
  return s.replace(/،/g, ",");
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface GeoResult {
  displayName: string;
  lat: string;
  lng: string;
  city?: string;
  state?: string;
  type?: string;
}

// ─── Mapbox Geocoding v5 (primary) ─────────────────────────────────────────
async function fetchMapbox(q: string, token: string): Promise<GeoResult[]> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("country", "in");
  url.searchParams.set("limit", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set(
    "types",
    "country,region,place,district,locality,neighborhood,address,poi"
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  const res = await fetch(url.toString(), { signal: controller.signal });
  clearTimeout(timeout);

  if (!res.ok) {
    console.warn(`Mapbox responded with ${res.status}`);
    return [];
  }

  const data = await res.json();

  return (data.features || []).map((feature: any) => {
    // Extract city & state from context array
    let city = "";
    let state = "";
    const context = feature.context || [];
    for (const c of context) {
      if (c.id?.startsWith("place")) city = c.text;
      if (c.id?.startsWith("district") && !city) city = c.text;
      if (c.id?.startsWith("region")) state = c.text;
    }

    return {
      displayName: cleanAddress(feature.place_name || feature.text || "Unknown"),
      lat: String(feature.center[1]),
      lng: String(feature.center[0]),
      city,
      state,
      type: feature.place_type?.[0] || "",
    };
  });
}

// ─── Nominatim (fallback) ──────────────────────────────────────────────────
async function fetchNominatim(q: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=in&addressdetails=1&dedupe=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": "CarvaanGo/1.0 (student-project)",
      Accept: "application/json",
    },
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Nominatim responded with ${res.status}`);
  }

  const data = await res.json();

  return data.map((item: any) => {
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || "";
    const state = addr.state || "";

    return {
      displayName: cleanAddress(item.display_name || ""),
      lat: item.lat,
      lng: item.lon,
      city,
      state,
      type: item.type || "",
    };
  });
}
