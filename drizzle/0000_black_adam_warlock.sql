CREATE TABLE "ride_pools" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"pickup_location" text NOT NULL,
	"drop_location" text NOT NULL,
	"departure_date" timestamp NOT NULL,
	"total_seats" integer NOT NULL,
	"available_seats" integer NOT NULL,
	"vehicle_model" varchar(50) NOT NULL,
	"vehicle_plate" varchar(20) NOT NULL,
	"preferences" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ride_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"rider_id" integer NOT NULL,
	"ride_pool_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_seats" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ride_pools" ADD CONSTRAINT "ride_pools_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_ride_pool_id_ride_pools_id_fk" FOREIGN KEY ("ride_pool_id") REFERENCES "public"."ride_pools"("id") ON DELETE no action ON UPDATE no action;