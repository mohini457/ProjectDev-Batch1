import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { ridePoolsTable, usersTable } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { getRoute } from "@/lib/osrm";

/**
 * GET /api/rides?from=<lat,lng>&to=<lat,lng>&date=<ISO>&seats=<n>
 *
 * Fetch rides matching search criteria.
 * Uses Haversine via SQL to find rides with pickup/drop within ~15 km.
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const fromParam = params.get("from"); // "lat,lng"
    const toParam = params.get("to");     // "lat,lng"
    const dateParam = params.get("date"); // ISO date string
    const seatsParam = params.get("seats"); // minimum available seats

    // Base query: join ride_pools with users to get driver name
    let conditions: any[] = [
      eq(ridePoolsTable.status, "active"),
    ];

    // Date filter: exact date match
    if (dateParam) {
      // Parse as local date (append T00:00:00 to avoid UTC midnight shift)
      const searchDate = new Date(dateParam + "T00:00:00");
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      conditions.push(gte(ridePoolsTable.departureDate, searchDate));
      conditions.push(sql`${ridePoolsTable.departureDate} < ${nextDay}`);
    }

    // Seats filter
    if (seatsParam) {
      const minSeats = parseInt(seatsParam, 10);
      if (!isNaN(minSeats) && minSeats > 0) {
        conditions.push(gte(ridePoolsTable.availableSeats, minSeats));
      }
    }

    const rides = await db
      .select({
        id: ridePoolsTable.id,
        pickupLocation: ridePoolsTable.pickupLocation,
        dropLocation: ridePoolsTable.dropLocation,
        pickupLat: ridePoolsTable.pickupLat,
        pickupLng: ridePoolsTable.pickupLng,
        dropLat: ridePoolsTable.dropLat,
        dropLng: ridePoolsTable.dropLng,
        departureDate: ridePoolsTable.departureDate,
        departureTime: ridePoolsTable.departureTime,
        totalSeats: ridePoolsTable.totalSeats,
        availableSeats: ridePoolsTable.availableSeats,
        vehicleCapacity: ridePoolsTable.vehicleCapacity,
        vehicleModel: ridePoolsTable.vehicleModel,
        vehicleImageUrl: ridePoolsTable.vehicleImageUrl,
        pricePerSeat: ridePoolsTable.pricePerSeat,
        smokingAllowed: ridePoolsTable.smokingAllowed,
        musicAllowed: ridePoolsTable.musicAllowed,
        petsAllowed: ridePoolsTable.petsAllowed,
        femaleOnly: ridePoolsTable.femaleOnly,
        luggageSize: ridePoolsTable.luggageSize,
        estimatedDuration: ridePoolsTable.estimatedDuration,
        estimatedDistance: ridePoolsTable.estimatedDistance,
        driverName: usersTable.name,
      })
      .from(ridePoolsTable)
      .innerJoin(usersTable, eq(ridePoolsTable.driverId, usersTable.id))
      .where(and(...conditions))
      .orderBy(ridePoolsTable.departureDate)
      .limit(50);

    // Client-side proximity filter if from/to provided
    let filteredRides = rides;

    if (fromParam) {
      const [fromLat, fromLng] = fromParam.split(",").map(Number);
      if (!isNaN(fromLat) && !isNaN(fromLng)) {
        filteredRides = filteredRides.filter((r) => {
          const dist = haversine(fromLat, fromLng, parseFloat(r.pickupLat), parseFloat(r.pickupLng));
          return dist <= 30; // within 30 km
        });
      }
    }

    if (toParam) {
      const [toLat, toLng] = toParam.split(",").map(Number);
      if (!isNaN(toLat) && !isNaN(toLng)) {
        filteredRides = filteredRides.filter((r) => {
          const dist = haversine(toLat, toLng, parseFloat(r.dropLat), parseFloat(r.dropLng));
          return dist <= 30;
        });
      }
    }

    return NextResponse.json({ rides: filteredRides });
  } catch (err) {
    console.error("GET /api/rides error:", err);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}

/**
 * POST /api/rides
 *
 * Create a new ride pool. Requires authentication.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get local user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not synced. Please sign in again." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      pickupLocation,
      dropLocation,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      departureDate,
      departureTime,
      seatsToOffer,
      vehicleModel,
      vehicleCapacity = 4,
      vehiclePlate,
      vehicleImageUrl = null,
      vehicleImageId = null,
      pricePerSeat,
      smokingAllowed = 0,
      musicAllowed = 1,
      petsAllowed = 0,
      femaleOnly = 0,
      luggageSize = "medium",
      additionalNotes = null,
    } = body;

    // Validate required fields
    if (
      !pickupLocation || !dropLocation ||
      !pickupLat || !pickupLng || !dropLat || !dropLng ||
      !departureDate || !departureTime ||
      !seatsToOffer || !vehicleModel || !vehiclePlate ||
      pricePerSeat === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get route info from OSRM
    let estimatedDuration: number | null = null;
    let estimatedDistance: number | null = null;
    let routePolyline: string | null = null;

    try {
      const route = await getRoute(
        [parseFloat(pickupLat), parseFloat(pickupLng)],
        [parseFloat(dropLat), parseFloat(dropLng)]
      );
      estimatedDuration = route.durationMin;
      estimatedDistance = route.distanceKm;
      routePolyline = route.polyline;
    } catch (routeErr) {
      console.warn("OSRM routing failed, continuing without route data:", routeErr);
    }

    const [newRide] = await db
      .insert(ridePoolsTable)
      .values({
        driverId: user.id,
        pickupLocation,
        dropLocation,
        pickupLat: String(pickupLat),
        pickupLng: String(pickupLng),
        dropLat: String(dropLat),
        dropLng: String(dropLng),
        departureDate: new Date(departureDate + "T00:00:00"),
        departureTime,
        totalSeats: Math.max(1, Number(vehicleCapacity) - 1),
        availableSeats: Number(seatsToOffer),
        vehicleCapacity: Number(vehicleCapacity),
        vehicleModel,
        vehiclePlate,
        vehicleImageUrl,
        vehicleImageId,
        pricePerSeat: Number(pricePerSeat),
        smokingAllowed: Number(smokingAllowed),
        musicAllowed: Number(musicAllowed),
        petsAllowed: Number(petsAllowed),
        femaleOnly: Number(femaleOnly),
        luggageSize,
        additionalNotes,
        estimatedDuration,
        estimatedDistance,
        routePolyline,
      })
      .returning();

    return NextResponse.json({ ride: newRide }, { status: 201 });
  } catch (err) {
    console.error("POST /api/rides error:", err);
    return NextResponse.json({ error: "Failed to create ride" }, { status: 500 });
  }
}

// Inline haversine for server-side filtering
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
