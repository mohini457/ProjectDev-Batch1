import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ridePoolsTable, usersTable, rideRequestsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/rides/[id]
 * Fetch a single ride with driver info and request count.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rideId = id;
    if (!rideId || rideId.length < 1) {
      return NextResponse.json({ error: "Invalid ride ID" }, { status: 400 });
    }

    const [ride] = await db
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
        vehiclePlate: ridePoolsTable.vehiclePlate,
        vehicleImageUrl: ridePoolsTable.vehicleImageUrl,
        pricePerSeat: ridePoolsTable.pricePerSeat,
        smokingAllowed: ridePoolsTable.smokingAllowed,
        musicAllowed: ridePoolsTable.musicAllowed,
        petsAllowed: ridePoolsTable.petsAllowed,
        femaleOnly: ridePoolsTable.femaleOnly,
        luggageSize: ridePoolsTable.luggageSize,
        additionalNotes: ridePoolsTable.additionalNotes,
        status: ridePoolsTable.status,
        estimatedDuration: ridePoolsTable.estimatedDuration,
        estimatedDistance: ridePoolsTable.estimatedDistance,
        routePolyline: ridePoolsTable.routePolyline,
        createdAt: ridePoolsTable.createdAt,
        driverName: usersTable.name,
        driverClerkId: usersTable.clerkId,
      })
      .from(ridePoolsTable)
      .innerJoin(usersTable, eq(ridePoolsTable.driverId, usersTable.id))
      .where(eq(ridePoolsTable.id, rideId))
      .limit(1);

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    return NextResponse.json({ ride });
  } catch (err) {
    console.error("GET /api/rides/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch ride" }, { status: 500 });
  }
}
