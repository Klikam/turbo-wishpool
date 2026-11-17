CREATE INDEX "gifts_wishlistId_index" ON "gifts" ("wishlistId");--> statement-breakpoint
CREATE INDEX "gifts_reservedByGuestTokenHash_index" ON "gifts" ("reservedByGuestTokenHash") WHERE ("reservedByGuestTokenHash" is not null);--> statement-breakpoint
CREATE INDEX "wishlists_userId_index" ON "wishlists" ("userId");