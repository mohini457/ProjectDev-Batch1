/**
 * OSRM (Open Source Routing Machine) — free routing service.
 * Returns driving distance, duration, and an encoded polyline
 * between two geographical coordinates.
 *
 * API: https://router.project-osrm.org
 * Rate limits: generous for demo/dev use.
 */

export interface RouteResult {
  /** Distance in kilometres */
  distanceKm: number;
  /** Duration in minutes */
  durationMin: number;
  /** Encoded polyline geometry (for Leaflet) */
  polyline: string;
}

/**
 * Fetch a driving route between two points via OSRM.
 *
 * @param from [latitude, longitude]
 * @param to   [latitude, longitude]
 */
export async function getRoute(
  from: [number, number],
  to: [number, number]
): Promise<RouteResult> {
  // OSRM expects coordinates as lng,lat (not lat,lng)
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=polyline`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM request failed: ${res.status}`);
  }

  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No route found between the given points.");
  }

  const route = data.routes[0];

  return {
    distanceKm: Math.round(route.distance / 1000),        // metres → km
    durationMin: Math.round(route.duration / 60),          // seconds → minutes
    polyline: route.geometry,                               // encoded polyline string
  };
}
