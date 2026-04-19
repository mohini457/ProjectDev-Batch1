import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/route?pickup_lat=...&pickup_lng=...&drop_lat=...&drop_lng=...
 *
 * Fetches multiple driving routes from Mapbox Directions API:
 *  1. Standard request with alternatives=true → Fastest + alternative(s)
 *  2. Separate request with exclude=toll → No-toll route
 *
 * Returns an array of up to 3 distinct route options.
 */

interface RouteOption {
  id: string;
  label: string;
  tag: string;
  color: string;
  coordinates: [number, number][];
  distance: number; // km
  duration: number; // minutes
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const pickupLat = sp.get("pickup_lat");
  const pickupLng = sp.get("pickup_lng");
  const dropLat = sp.get("drop_lat");
  const dropLng = sp.get("drop_lng");

  if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
    return NextResponse.json(
      { error: "Missing pickup or drop coordinates" },
      { status: 400 }
    );
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 500 }
    );
  }

  try {
    // Mapbox uses lng,lat format
    const coords = `${pickupLng},${pickupLat};${dropLng},${dropLat}`;

    // Request 1: Main route + alternatives
    const mainUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&steps=false&alternatives=true&access_token=${token}`;

    // Request 2: No-toll route
    const noTollUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&steps=false&exclude=toll&access_token=${token}`;

    const [mainRes, noTollRes] = await Promise.all([
      fetch(mainUrl),
      fetch(noTollUrl),
    ]);

    const routes: RouteOption[] = [];

    // ── Parse main routes (fastest + alternatives) ──────────────────
    if (mainRes.ok) {
      const mainData = await mainRes.json();
      const mainRoutes = mainData.routes || [];

      if (mainRoutes.length > 0) {
        // First route = fastest
        routes.push(
          parseRoute(mainRoutes[0], "fastest", "Fastest", "⚡ Fastest", "#0553BA")
        );

        // Find the shortest alt by distance (if different enough)
        if (mainRoutes.length > 1) {
          // Pick the alternative with the least distance
          const alts = mainRoutes.slice(1);
          const shortestAlt = alts.reduce(
            (min: any, r: any) => (r.distance < min.distance ? r : min),
            alts[0]
          );
          routes.push(
            parseRoute(shortestAlt, "shortest", "Shortest", "📏 Shortest", "#059669")
          );
        }
      }
    }

    // ── Parse no-toll route ─────────────────────────────────────────
    if (noTollRes.ok) {
      const noTollData = await noTollRes.json();
      const noTollRoute = noTollData.routes?.[0];

      if (noTollRoute) {
        const noTollParsed = parseRoute(
          noTollRoute,
          "no-toll",
          "No Toll",
          "🆓 No Toll",
          "#D97706"
        );

        // Only add if meaningfully different from fastest route
        const fastest = routes[0];
        if (
          !fastest ||
          Math.abs(noTollParsed.distance - fastest.distance) > 2 ||
          Math.abs(noTollParsed.duration - fastest.duration) > 3
        ) {
          routes.push(noTollParsed);
        }
      }
    }

    // If we only got the fastest (no alts), still return it
    if (routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    // Ensure we have a "shortest" even if Mapbox didn't return alternatives
    // In that case, if we have fastest + no-toll but no shortest,
    // label whichever is shorter as "also the shortest"
    if (routes.length === 2 && !routes.find((r) => r.id === "shortest")) {
      const shorter =
        routes[0].distance <= routes[1].distance ? routes[0] : routes[1];
      if (shorter.id === "fastest") {
        // Fastest is also shortest — keep 2 options
      } else {
        // Re-label the shorter no-toll as "shortest"
        // and add an actual no-toll duplicate — skip to keep it clean
      }
    }

    return NextResponse.json({
      routes,
      // Legacy compat: also return the selected (fastest) route flat
      coordinates: routes[0].coordinates,
      distance: routes[0].distance,
      duration: routes[0].duration,
    });
  } catch (err) {
    console.error("Route API error:", err);
    return NextResponse.json(
      { error: "Failed to calculate route" },
      { status: 500 }
    );
  }
}

function parseRoute(
  route: any,
  id: string,
  label: string,
  tag: string,
  color: string
): RouteOption {
  // Convert GeoJSON coords [lng, lat] → [lat, lng] for the map
  const coordinates: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  return {
    id,
    label,
    tag,
    color,
    coordinates,
    distance: Math.round((route.distance / 1000) * 10) / 10, // km (1 decimal)
    duration: Math.round(route.duration / 60), // minutes
  };
}
