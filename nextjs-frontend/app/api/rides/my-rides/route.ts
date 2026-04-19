import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { ridePoolsTable, rideRequestsTable, usersTable } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * GET /api/rides/my-rides
 * Returns all rides published by the authenticated user,
 * along with pending request counts.
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
      return NextResponse.json({ rides: [] });
    }

    // Get all rides by this user
    const rides = await db
      .select()
      .from(ridePoolsTable)
      .where(eq(ridePoolsTable.driverId, user.id))
      .orderBy(desc(ridePoolsTable.createdAt));

    // For each ride, get the requests
    const ridesWithRequests = await Promise.all(
      rides.map(async (ride) => {
        const requests = await db
          .select({
            id: rideRequestsTable.id,
            status: rideRequestsTable.status,
            requestedSeats: rideRequestsTable.requestedSeats,
            message: rideRequestsTable.message,
            pickupNote: rideRequestsTable.pickupNote,
            createdAt: rideRequestsTable.createdAt,
            riderName: usersTable.name,
            riderEmail: usersTable.email,
          })
          .from(rideRequestsTable)
          .innerJoin(usersTable, eq(rideRequestsTable.riderId, usersTable.id))
          .where(eq(rideRequestsTable.ridePoolId, ride.id))
          .orderBy(desc(rideRequestsTable.createdAt));

        const pendingCount = requests.filter((r) => r.status === "pending").length;

        return { ...ride, requests, pendingCount };
      })
    );

    return NextResponse.json({ rides: ridesWithRequests });
  } catch (err) {
    console.error("GET /api/rides/my-rides error:", err);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}
