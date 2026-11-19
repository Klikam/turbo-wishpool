CREATE TYPE "gift_request_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "gift_request_type" AS ENUM('release', 'share');--> statement-breakpoint
CREATE TABLE "gift_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"giftId" uuid NOT NULL,
	"requesterId" integer NOT NULL,
	"type" "gift_request_type" NOT NULL,
	"status" "gift_request_status" DEFAULT 'pending'::"gift_request_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"respondedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "gift_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gift_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"giftId" uuid NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_reservations_giftId_userId_unique" UNIQUE("giftId","userId")
);
--> statement-breakpoint
ALTER TABLE "gift_reservations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "gift_reservations" ("giftId", "userId", "createdAt")
SELECT "id", "reservedByUserId", COALESCE("reservedAt", now()) FROM "gifts"
WHERE "reservedByUserId" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "gifts" DROP CONSTRAINT "gifts_reservedByUserId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "gifts" DROP COLUMN "reservedByUserId";--> statement-breakpoint
ALTER TABLE "gifts" DROP COLUMN "reservedAt";--> statement-breakpoint
CREATE INDEX "gift_requests_giftId_index" ON "gift_requests" ("giftId");--> statement-breakpoint
CREATE INDEX "gift_requests_requesterId_index" ON "gift_requests" ("requesterId");--> statement-breakpoint
CREATE UNIQUE INDEX "gift_requests_giftId_requesterId_index" ON "gift_requests" ("giftId","requesterId") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "gift_reservations_userId_index" ON "gift_reservations" ("userId");--> statement-breakpoint
ALTER TABLE "gift_requests" ADD CONSTRAINT "gift_requests_giftId_gifts_id_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gift_requests" ADD CONSTRAINT "gift_requests_requesterId_users_id_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gift_reservations" ADD CONSTRAINT "gift_reservations_giftId_gifts_id_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gift_reservations" ADD CONSTRAINT "gift_reservations_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;