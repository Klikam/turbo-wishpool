CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wishlistId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"price" numeric(2),
	"url" varchar(255),
	"imageUrl" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_wishlistId_wishlists_id_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id");--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;