import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/reverse-geocode?lat=...&lng=...
 *
 * Smart reverse geocoding — returns recognizable local place names.
 *
 * Strategy:
 *  1. Fire BOTH Nominatim + Mapbox POI queries in parallel
 *  2. Score each result by how recognizable/useful the name is
 *     (university > hospital > station > landmark > shop > road > village)
 *  3. Return the best result
 *
 * This gives "GLA University, Mathura, Uttar Pradesh"
 * instead of "Ajhai Kalan, Chhata, Uttar Pradesh"
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing lat or lng parameters" },
      { status: 400 }
    );
  }

  try {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);

    // Fire all reverse geocode sources in parallel
    const promises: Promise<ScoredResult | null>[] = [];

    // Nominatim — best for Indian local data (OSM community)
    promises.push(reverseNominatim(latF, lngF));

    // Mapbox POI query — finds named places
    if (token) {
      promises.push(reverseMapboxPOI(lngF, latF, token));
      promises.push(reverseMapboxPlace(lngF, latF, token));
    }

    const results = (await Promise.all(promises)).filter(
      Boolean
    ) as ScoredResult[];

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Could not reverse geocode this location" },
        { status: 404 }
      );
    }

    // Pick the best result by score (highest = most recognizable name)
    results.sort((a, b) => b.score - a.score);
    const best = results[0];

    return NextResponse.json({
      displayName: best.displayName.replace(/،/g, ","),
      lat: String(latF),
      lng: String(lngF),
    });
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return NextResponse.json(
      { error: "Reverse geocoding failed" },
      { status: 500 }
    );
  }
}

// ─── Types ──────────────────────────────────────────────────────────────

interface ScoredResult {
  displayName: string;
  score: number; // higher = more recognizable
}

// Score keywords — universities/hospitals/stations get top priority
const SCORE_MAP: [RegExp, number][] = [
  [/university|institute|college|iit|nit|aiims/i, 100],
  [/school|academy/i, 80],
  [/hospital|medical|clinic/i, 75],
  [/station|junction|airport|terminal/i, 70],
  [/temple|mosque|church|gurudwara|mandir|masjid/i, 65],
  [/mall|market|bazaar|emporium/i, 60],
  [/stadium|ground|park|garden/i, 55],
  [/fort|palace|museum|monument/i, 50],
  [/chowk|chauraha|crossing|circle|square/i, 45],
  [/gate|nagar|colony|sector|block|phase/i, 40],
  [/road|marg|highway|street/i, 20],
  [/village|gram|gaon|kalan|khurd|pur$/i, 5],
];

function scoreDisplayName(name: string): number {
  let maxScore = 10; // Base score (any name is worth 10)
  for (const [pattern, score] of SCORE_MAP) {
    if (pattern.test(name)) {
      maxScore = Math.max(maxScore, score);
    }
  }
  // Bonus for longer, more descriptive names (up to +10)
  const parts = name.split(",").length;
  maxScore += Math.min(parts * 2, 10);
  return maxScore;
}

// ─── Nominatim (primary for India) ──────────────────────────────────────

async function reverseNominatim(
  lat: number,
  lng: number
): Promise<ScoredResult | null> {
  // zoom=18 = building level detail, namedetails gives local names
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1&extratags=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CarvaanGo/1.0 (student-project)",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.display_name) return null;

    const addr = data.address || {};
    const nameDetails = data.namedetails || {};
    const extraTags = data.extratags || {};

    const parts: string[] = [];

    // Priority: amenity name → building → tourism → leisure → shop
    const primaryName =
      nameDetails.name ||
      addr.amenity ||
      addr.university ||
      addr.college ||
      addr.school ||
      addr.hospital ||
      addr.building ||
      addr.tourism ||
      addr.leisure ||
      addr.shop ||
      addr.office ||
      extraTags.name ||
      "";

    if (primaryName) parts.push(primaryName);

    // Area context: suburb/neighbourhood/road
    const area =
      addr.suburb ||
      addr.neighbourhood ||
      addr.hamlet ||
      addr.road ||
      "";
    // Only add area if it's different from the primary name & not a generic village
    if (area && area !== primaryName && !isGenericVillage(area)) {
      parts.push(area);
    }

    // City
    const city = addr.city || addr.town || addr.county || addr.state_district || "";
    if (city && !parts.includes(city)) parts.push(city);

    // State
    const state = addr.state || "";
    if (state && !parts.includes(state)) parts.push(state);

    // If we only got generic village names, try to use the full display_name
    // but still score it low
    let displayName: string;
    if (parts.length >= 2) {
      displayName = parts.join(", ");
    } else if (parts.length === 1 && city) {
      displayName = `${parts[0]}, ${city}`;
    } else {
      // Fallback: clean up the raw display_name
      displayName = cleanDisplayName(data.display_name);
    }

    return {
      displayName,
      score: scoreDisplayName(displayName),
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ─── Mapbox POI query ───────────────────────────────────────────────────

async function reverseMapboxPOI(
  lng: number,
  lat: number,
  token: string
): Promise<ScoredResult | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=en&limit=5&types=poi`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const features = data.features || [];

    if (features.length === 0) return null;

    // Score each POI and pick the best
    let bestFeature = features[0];
    let bestScore = -1;

    for (const f of features) {
      const name = f.text || f.place_name || "";
      const s = scoreDisplayName(name);
      if (s > bestScore) {
        bestScore = s;
        bestFeature = f;
      }
    }

    // Build display name: POI name + city context
    const poiName = bestFeature.text || "";
    const context = bestFeature.context || [];
    const contextParts: string[] = [];

    for (const c of context) {
      const id = c.id || "";
      if (
        id.startsWith("place") ||
        id.startsWith("district") ||
        id.startsWith("region")
      ) {
        if (!contextParts.includes(c.text)) contextParts.push(c.text);
      }
    }

    const displayName = [poiName, ...contextParts].filter(Boolean).join(", ");

    return {
      displayName: displayName || poiName,
      score: scoreDisplayName(displayName),
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ─── Mapbox Place/Address query ─────────────────────────────────────────

async function reverseMapboxPlace(
  lng: number,
  lat: number,
  token: string
): Promise<ScoredResult | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=en&limit=1&types=neighborhood,locality,place,district`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature) return null;

    const name = feature.text || "";
    const context = feature.context || [];
    const parts: string[] = [name];

    for (const c of context) {
      const id = c.id || "";
      if (id.startsWith("place") || id.startsWith("region")) {
        if (!parts.includes(c.text)) parts.push(c.text);
      }
    }

    const displayName = parts.filter(Boolean).join(", ");

    return {
      displayName,
      score: scoreDisplayName(displayName),
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Check if a name is a generic Indian village suffix (low-value name) */
function isGenericVillage(name: string): boolean {
  return /^(kalan|khurd|pur|nagar|gram|gaon|pura|garhi|nagla)$/i.test(
    name.trim()
  );
}

/** Clean up a raw Nominatim display_name — remove country, postcode noise */
function cleanDisplayName(raw: string): string {
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => {
      // Remove: country, postcodes, generic codes
      if (/^india$/i.test(p)) return false;
      if (/^\d{5,6}$/.test(p)) return false;
      if (/^[A-Z]{2}\s?\d+$/.test(p)) return false; // Highway codes like "NH44"
      return true;
    })
    .slice(0, 4) // Keep max 4 parts
    .join(", ");
}
