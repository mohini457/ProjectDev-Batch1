import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { rideRequestsTable, ridePoolsTable, usersTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/rides/my-requests
 * Returns all join requests made by the authenticated user,
 * with ride and driver details.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await db
      .select({
        id: rideRequestsTable.id,
        status: rideRequestsTable.status,
        requestedSeats: rideRequestsTable.requestedSeats,
        message: rideRequestsTable.message,
        createdAt: rideRequestsTable.createdAt,
        rideId: ridePoolsTable.id,
        pickupLocation: ridePoolsTable.pickupLocation,
        dropLocation: ridePoolsTable.dropLocation,
        departureDate: ridePoolsTable.departureDate,
        departureTime: ridePoolsTable.departureTime,
        pricePerSeat: ridePoolsTable.pricePerSeat,
        vehicleModel: ridePoolsTable.vehicleModel,
        driverName: usersTable.name,
      })
      .from(rideRequestsTable)
      .innerJoin(ridePoolsTable, eq(rideRequestsTable.ridePoolId, ridePoolsTable.id))
      .innerJoin(usersTable, eq(ridePoolsTable.driverId, usersTable.id))
      .where(eq(rideRequestsTable.riderId, user.id))
      .orderBy(desc(rideRequestsTable.createdAt));

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("GET /api/rides/my-requests error:", err);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
