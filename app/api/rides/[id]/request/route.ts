import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { rideRequestsTable, ridePoolsTable, usersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/rides/[id]/request
 * Rider sends a join request for a ride.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ridePoolId = id;
    if (!ridePoolId) {
      return NextResponse.json({ error: "Invalid ride ID" }, { status: 400 });
    }

    // Get local user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not synced" }, { status: 400 });
    }

    // Check ride exists and has seats
    const [ride] = await db
      .select()
      .from(ridePoolsTable)
      .where(eq(ridePoolsTable.id, ridePoolId))
      .limit(1);

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // Can't request your own ride
    if (ride.driverId === user.id) {
      return NextResponse.json({ error: "Cannot request your own ride" }, { status: 400 });
    }

    const body = await req.json();
    const { requestedSeats = 1, message = null, pickupNote = null } = body;

    if (ride.availableSeats < requestedSeats) {
      return NextResponse.json({ error: "Not enough seats available" }, { status: 400 });
    }

    // Check for existing pending request
    const existing = await db
      .select()
      .from(rideRequestsTable)
      .where(
        and(
          eq(rideRequestsTable.riderId, user.id),
          eq(rideRequestsTable.ridePoolId, ridePoolId),
          eq(rideRequestsTable.status, "pending")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "You already have a pending request for this ride" }, { status: 409 });
    }

    const [request] = await db
      .insert(rideRequestsTable)
      .values({
        riderId: user.id,
        ridePoolId,
        requestedSeats: Number(requestedSeats),
        message,
        pickupNote,
      })
      .returning();

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error("POST /api/rides/[id]/request error:", err);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}

/**
 * PATCH /api/rides/[id]/request
 * Driver approves or rejects a join request.
 * Body: { requestId, action: "approve" | "reject" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ridePoolId = id;

    // Current user must be the driver
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not synced" }, { status: 400 });
    }

    const [ride] = await db
      .select()
      .from(ridePoolsTable)
      .where(eq(ridePoolsTable.id, ridePoolId))
      .limit(1);

    if (!ride || ride.driverId !== user.id) {
      return NextResponse.json({ error: "You are not the driver of this ride" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const [request] = await db
      .select()
      .from(rideRequestsTable)
      .where(
        and(
          eq(rideRequestsTable.id, requestId),
          eq(rideRequestsTable.ridePoolId, ridePoolId),
          eq(rideRequestsTable.status, "pending")
        )
      )
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }

    if (action === "approve") {
      if (ride.availableSeats < request.requestedSeats) {
        return NextResponse.json({ error: "Not enough seats left" }, { status: 400 });
      }

      // Approve request + decrement seats
      await db
        .update(rideRequestsTable)
        .set({ status: "approved" })
        .where(eq(rideRequestsTable.id, requestId));

      await db
        .update(ridePoolsTable)
        .set({ availableSeats: ride.availableSeats - request.requestedSeats })
        .where(eq(ridePoolsTable.id, ridePoolId));
    } else {
      // Reject
      await db
        .update(rideRequestsTable)
        .set({ status: "rejected" })
        .where(eq(rideRequestsTable.id, requestId));
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error("PATCH /api/rides/[id]/request error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
