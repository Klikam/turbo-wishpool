CREATE TYPE "occasion" AS ENUM('birthday', 'wedding', 'baby_shower', 'anniversary', 'christmas', 'graduation', 'housewarming', 'other');--> statement-breakpoint
ALTER TABLE "wishlists" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlists" ADD COLUMN "occasion" "occasion";--> statement-breakpoint
ALTER TABLE "wishlists" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "wishlists" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "gifts" ALTER COLUMN "description" SET DATA TYPE text USING "description"::text;--> statement-breakpoint
ALTER TABLE "gifts" ALTER COLUMN "url" SET DATA TYPE varchar(2048) USING "url"::varchar(2048);--> statement-breakpoint
ALTER TABLE "gifts" ALTER COLUMN "imageUrl" SET DATA TYPE varchar(2048) USING "imageUrl"::varchar(2048);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;