import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/user/sync
 *
 * Syncs the currently authenticated Clerk user into the local
 * `users` table.  Called once after sign-in from the client.
 * Idempotent — safe to call multiple times.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ user: existing[0], synced: false });
    }

    // Insert new user
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
    const email =
      user.emailAddresses?.[0]?.emailAddress || `${userId}@unknown.com`;

    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId: userId,
        name,
        email,
      })
      .returning();

    return NextResponse.json({ user: newUser, synced: true });
  } catch (err) {
    console.error("User sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
