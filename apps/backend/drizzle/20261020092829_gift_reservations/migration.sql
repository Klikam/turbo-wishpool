ALTER TABLE "gifts" ADD COLUMN "reservedByUserId" integer;--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "reservedByName" varchar(255);--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "reservedByGuestTokenHash" varchar(64);--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "reservedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_reservedByUserId_users_id_fkey" FOREIGN KEY ("reservedByUserId") REFERENCES "users"("id") ON DELETE SET NULL;