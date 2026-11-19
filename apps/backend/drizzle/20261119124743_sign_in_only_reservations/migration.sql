-- Reservations by anonymous guests can't be traced to anyone once the guest
-- token is gone, so those gifts become free again.
UPDATE "gifts" SET "reservedAt" = NULL WHERE "reservedByUserId" IS NULL AND "reservedAt" IS NOT NULL;--> statement-breakpoint
DROP INDEX "gifts_reservedByGuestTokenHash_index";--> statement-breakpoint
ALTER TABLE "gifts" DROP COLUMN "reservedByGuestTokenHash";
