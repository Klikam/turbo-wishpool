"use client";

import type { GiftItem } from "@/types/giftItem";
import {
  OCCASION_LABELS,
  type Wishlist,
  WishlistArraySchema,
} from "@/types/wishlist";
import { emptyToNull, formatPrice, parsePrice } from "@/utils/giftHelper";
import { storageHelper } from "@/utils/storageHelper";
import {
  AddGiftModal,
  BackButton,
  EmptyState,
  GiftCard,
  type NewGift,
  ShareLinkButton,
  WishlistHero,
} from "@repo/ui";
import { Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WishlistViewProps {
  wishlistId: string;
  currentUserId: string | null;
}

export default function Wishlist({ wishlistId, currentUserId }: WishlistViewProps) {
  const router = useRouter();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);

  useEffect(() => {
    setWishlists(
      storageHelper.load(
        storageHelper.STORAGE_KEYS.wishlists,
        [],
        WishlistArraySchema,
      ),
    );
  }, []);

  const [showAddGift, setShowAddGift] = useState(false);

  const wishlist = wishlists.find((w) => w.id === wishlistId);
  const isOwner = currentUserId !== null && currentUserId === wishlist?.ownerId;

  function goBack() {
    router.push(currentUserId ? "/dashboard" : "/");
  }

  function updateWishlists(updated: Wishlist[]) {
    setWishlists(updated);
    storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, updated);
  }

  function handleClaim(giftId: string) {
    const updated = wishlists.map((w) =>
      w.id === wishlistId
        ? {
            ...w,
            gifts: w.gifts.map((g) =>
              g.id === giftId
                ? {
                    ...g,
                    reserved: true,
                    reservedByName: "Guest", // TODO mock - the real flow asks visitors for a name
                    reservedByMe: true,
                  }
                : g,
            ),
          }
        : w,
    );
    updateWishlists(updated);
  }

  function handleUnclaim(giftId: string) {
    const updated = wishlists.map((w) =>
      w.id === wishlistId
        ? {
            ...w,
            gifts: w.gifts.map((g) =>
              g.id === giftId && g.reservedByMe
                ? {
                    ...g,
                    reserved: false,
                    reservedByName: null,
                    reservedByMe: false,
                  }
                : g,
            ),
          }
        : w,
    );
    updateWishlists(updated);
  }

  function handleDelete(giftId: string) {
    const updated = wishlists.map((w) =>
      w.id === wishlistId
        ? { ...w, gifts: w.gifts.filter((g) => g.id !== giftId) }
        : w,
    );
    updateWishlists(updated);
  }

  function handleAddGift(newGift: NewGift) {
    const gift: GiftItem = {
      id: storageHelper.genId(),
      name: newGift.name,
      description: emptyToNull(newGift.description),
      price: parsePrice(newGift.price),
      url: emptyToNull(newGift.url),
      imageUrl: emptyToNull(newGift.imageUrl),
      reserved: false,
      reservedByName: null,
      reservedByMe: false,
    };
    const updated = wishlists.map((w) =>
      w.id === wishlistId ? { ...w, gifts: [...w.gifts, gift] } : w,
    );
    updateWishlists(updated);
    setShowAddGift(false);
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Wishlist not found.</p>
          <button
            onClick={goBack}
            className="mt-4 text-primary underline text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const claimedCount = wishlist.gifts.filter((g) => g.reserved).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <BackButton onClick={goBack} />
          <div className="flex items-center gap-2">
            <ShareLinkButton
              url={`${typeof window === "undefined" ? "" : window.location.origin}/wishlist/${wishlistId}`}
            />
            {isOwner && (
              <button
                onClick={() => {
                  setShowAddGift(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-[#3a1232] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add gift
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <WishlistHero
          occasion={OCCASION_LABELS[wishlist.occasion ?? "other"]}
          title={wishlist.title}
          description={wishlist.note ?? undefined}
          date={wishlist.date ?? undefined}
          giftsCount={wishlist.gifts.length}
          claimedCount={claimedCount}
          isOwner={isOwner}
        />

        {/* Gifts grid */}
        {wishlist.gifts.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag />}
            message={
              isOwner
                ? "No gifts yet — add your first one!"
                : "No gifts on this list yet."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.gifts.map((gift) => (
              <GiftCard
                key={gift.id}
                name={gift.name}
                description={gift.description ?? undefined}
                price={gift.price === null ? undefined : formatPrice(gift.price)}
                url={gift.url ?? undefined}
                imageUrl={gift.imageUrl ?? undefined}
                claimed={gift.reserved}
                isOwner={isOwner}
                isMine={gift.reservedByMe}
                onClaim={() => {
                  handleClaim(gift.id);
                }}
                onUnclaim={() => {
                  handleUnclaim(gift.id);
                }}
                onDelete={() => {
                  handleDelete(gift.id);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Gift Modal */}
      {showAddGift && (
        <AddGiftModal
          onAdd={handleAddGift}
          onClose={() => {
            setShowAddGift(false);
          }}
        />
      )}
    </div>
  );
}
