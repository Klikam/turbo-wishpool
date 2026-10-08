ALTER TABLE "gifts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gifts" ALTER COLUMN "price" SET DATA TYPE numeric(10,2) USING "price"::numeric(10,2);--> statement-breakpoint
ALTER TABLE "gifts" DROP CONSTRAINT "gifts_wishlistId_wishlists_id_fkey", ADD CONSTRAINT "gifts_wishlistId_wishlists_id_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE;