"use client";

import {
  addGift,
  cancelReservation,
  deleteGift,
  getPublicWishlist,
  reserveGift,
} from "@/actions/wishlists";
import { useGuestToken } from "@/hooks/useGuestToken";
import { OCCASION_LABELS, type Wishlist } from "@/types/wishlist";
import type { ActionResult } from "@/utils/actionResult";
import { emptyToNull, formatPrice, parsePrice } from "@/utils/giftHelper";
import { storageHelper } from "@/utils/storageHelper";
import {
  AddGiftModal,
  BackButton,
  EmptyState,
  GiftCard,
  GuestNameModal,
  type NewGift,
  ShareLinkButton,
  WishlistHero,
} from "@repo/ui";
import { Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

interface WishlistViewProps {
  wishlistId: string;
  isSignedIn: boolean;
}

type LoadStatus = "loading" | "ready" | "notFound" | "error";

export default function Wishlist({ wishlistId, isSignedIn }: WishlistViewProps) {
  const router = useRouter();
  const guestToken = useGuestToken();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [showAddGift, setShowAddGift] = useState(false);
  // Gift a guest is about to reserve, while the name dialog is open.
  const [claimingGiftId, setClaimingGiftId] = useState<string | null>(null);

  const isOwner = wishlist?.isOwner ?? false;

  const load = useCallback(async () => {
    try {
      const loaded = await getPublicWishlist(wishlistId, guestToken);
      setWishlist(loaded);
      setStatus(loaded ? "ready" : "notFound");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, [wishlistId, guestToken]);

  useEffect(() => {
    // The guest token is only known after mount.
    if (guestToken) void load();
  }, [guestToken, load]);

  function goBack() {
    router.push(isSignedIn ? "/dashboard" : "/");
  }

  /** Runs a mutation, reports a failure, then re-syncs with the backend. */
  async function mutate(run: () => Promise<ActionResult<unknown>>) {
    const result = await run();
    if (!result.ok) toast.error(result.error);
    await load();
    return result.ok;
  }

  function handleClaim(giftId: string) {
    if (isSignedIn) {
      void mutate(() => reserveGift(wishlistId, giftId, guestToken));
    } else {
      setClaimingGiftId(giftId);
    }
  }

  function handleGuestClaim(name: string) {
    if (!claimingGiftId) return;
    const giftId = claimingGiftId;
    setClaimingGiftId(null);
    storageHelper.save(storageHelper.STORAGE_KEYS.guestName, name);
    void mutate(() => reserveGift(wishlistId, giftId, guestToken, name));
  }

  function handleUnclaim(giftId: string) {
    void mutate(() => cancelReservation(wishlistId, giftId, guestToken));
  }

  function handleDelete(giftId: string) {
    void mutate(() => deleteGift(wishlistId, giftId));
  }

  async function handleAddGift(newGift: NewGift) {
    const added = await mutate(() =>
      addGift(wishlistId, {
        name: newGift.name,
        description: emptyToNull(newGift.description),
        price: parsePrice(newGift.price),
        url: emptyToNull(newGift.url),
        imageUrl: emptyToNull(newGift.imageUrl),
      }),
    );
    if (added) setShowAddGift(false);
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {status === "loading" ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <>
              <p className="text-muted-foreground">
                {status === "error"
                  ? "Something went wrong loading this wishlist."
                  : "Wishlist not found."}
              </p>
              <button
                onClick={goBack}
                className="mt-4 text-primary underline text-sm"
              >
                Go back
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // The backend hides reservations from the owner, so there is no count to show.
  const claimedCount = isOwner
    ? undefined
    : wishlist.gifts.filter((g) => g.reserved).length;

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
          onAdd={(gift) => void handleAddGift(gift)}
          onClose={() => {
            setShowAddGift(false);
          }}
        />
      )}

      {/* Guest name dialog */}
      {claimingGiftId && (
        <GuestNameModal
          initialName={storageHelper.load(
            storageHelper.STORAGE_KEYS.guestName,
            "",
            z.string(),
          )}
          onConfirm={handleGuestClaim}
          onClose={() => {
            setClaimingGiftId(null);
          }}
        />
      )}
    </div>
  );
}
