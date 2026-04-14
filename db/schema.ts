import { integer, pgTable, varchar, timestamp, text, serial, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ridePoolsTable = pgTable("ride_pools", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: integer("driver_id").references(() => usersTable.id).notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  pickupLat: text("pickup_lat").notNull(),
  pickupLng: text("pickup_lng").notNull(),
  dropLat: text("drop_lat").notNull(),
  dropLng: text("drop_lng").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  departureTime: varchar("departure_time", { length: 10 }).notNull(), // "HH:MM"
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  vehicleCapacity: integer("vehicle_capacity").default(4).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 50 }).notNull(),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }).notNull(),
  vehicleImageUrl: text("vehicle_image_url"),
  vehicleImageId: text("vehicle_image_id"),
  pricePerSeat: integer("price_per_seat").notNull(), // in INR
  smokingAllowed: integer("smoking_allowed").default(0).notNull(),
  musicAllowed: integer("music_allowed").default(1).notNull(),
  petsAllowed: integer("pets_allowed").default(0).notNull(),
  femaleOnly: integer("female_only").default(0).notNull(),
  luggageSize: varchar("luggage_size", { length: 20 }).default("medium").notNull(),
  additionalNotes: text("additional_notes"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  estimatedDuration: integer("estimated_duration"),  // minutes
  estimatedDistance: integer("estimated_distance"),  // km
  routePolyline: text("route_polyline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rideRequestsTable = pgTable("ride_requests", {
  id: serial("id").primaryKey(),
  riderId: integer("rider_id").references(() => usersTable.id).notNull(),
  ridePoolId: uuid("ride_pool_id").references(() => ridePoolsTable.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  requestedSeats: integer("requested_seats").notNull().default(1),
  message: text("message"),
  pickupNote: text("pickup_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
