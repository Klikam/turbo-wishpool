"use client";

import {
  addGift,
  cancelReservation,
  deleteGift,
  reserveGift,
} from "@/actions/wishlists";
import { ConfirmDeleteDialog } from "@/components/sections/ConfirmDeleteDialog";
import { SignInModal } from "@/components/sections/SignInModal";
import type { GiftItem } from "@/types/giftItem";
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
import { LogIn, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

interface WishlistViewProps {
  wishlist: Wishlist;
  isSignedIn: boolean;
}

// Just over the backend's 5 s limit for fetching a gift link's preview image.
const IMAGE_LOOKUP_DELAY_MS = 6000;

export default function Wishlist({ wishlist, isSignedIn }: WishlistViewProps) {
  const router = useRouter();
  const wishlistId = wishlist.id;

  const [showAddGift, setShowAddGift] = useState(false);
  // Gift a guest is about to reserve, while the name dialog is open.
  const [claimingGiftId, setClaimingGiftId] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  // Kept after the dialog closes so its text doesn't change while it fades out.
  const [giftToDelete, setGiftToDelete] = useState<GiftItem | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOwner = wishlist.isOwner;

  function goBack() {
    router.push(isSignedIn ? "/dashboard" : "/");
  }

  /** Runs a mutation, reports a failure, then re-syncs with the backend. */
  async function mutate(run: () => Promise<ActionResult<unknown>>) {
    const result = await run();
    if (!result.ok) toast.error(result.error);
    router.refresh();
    return result.ok;
  }

  function handleClaim(giftId: string) {
    if (isSignedIn) {
      void mutate(() => reserveGift(wishlistId, giftId));
    } else {
      setClaimingGiftId(giftId);
    }
  }

  function handleGuestClaim(name: string) {
    if (!claimingGiftId) return;
    const giftId = claimingGiftId;
    setClaimingGiftId(null);
    storageHelper.save(storageHelper.STORAGE_KEYS.guestName, name);
    void mutate(() => reserveGift(wishlistId, giftId, name));
  }

  function handleUnclaim(giftId: string) {
    void mutate(() => cancelReservation(wishlistId, giftId));
  }

  function handleDelete(giftId: string) {
    void mutate(() => deleteGift(wishlistId, giftId));
  }

  async function handleAddGift(newGift: NewGift) {
    const url = emptyToNull(newGift.url);
    const imageUrl = emptyToNull(newGift.imageUrl);
    const added = await mutate(() =>
      addGift(wishlistId, {
        name: newGift.name,
        description: emptyToNull(newGift.description),
        price: parsePrice(newGift.price),
        url,
        imageUrl,
      }),
    );
    if (!added) return;

    setShowAddGift(false);
    // The backend takes the image from the link after saving the gift.
    if (url && !imageUrl) {
      setTimeout(() => {
        router.refresh();
      }, IMAGE_LOOKUP_DELAY_MS);
    }
  }

  // The backend hides reservations from the owner, so there is no count to show.
  const claimedCount = isOwner
    ? undefined
    : wishlist.gifts.filter((g) => g.reserved).length;

  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <BackButton onClick={goBack} />
          <div className="flex items-center gap-2">
            <ShareLinkButton
              url={`${typeof window === "undefined" ? "" : window.location.origin}/wishlist/${wishlistId}`}
            />
            {!isSignedIn && (
              <button
                onClick={() => {
                  setShowSignIn(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-[#3a1232] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            )}
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
                price={
                  gift.price === null
                    ? undefined
                    : formatPrice(gift.price, wishlist.currency)
                }
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
                  setGiftToDelete(gift);
                  setConfirmingDelete(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Gift Modal */}
      {showAddGift && (
        <AddGiftModal
          currency={wishlist.currency}
          onAdd={(gift) => void handleAddGift(gift)}
          onClose={() => {
            setShowAddGift(false);
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={confirmingDelete}
        title={`Delete “${giftToDelete?.name ?? ""}”?`}
        description="The gift will be removed from your wishlist for good."
        onConfirm={() => {
          if (giftToDelete) handleDelete(giftToDelete.id);
        }}
        onClose={() => {
          setConfirmingDelete(false);
        }}
      />

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
          onSignIn={() => {
            setClaimingGiftId(null);
            setShowSignIn(true);
          }}
        />
      )}

      {showSignIn && (
        <SignInModal
          callbackURL={`/wishlist/${wishlistId}`}
          onClose={() => {
            setShowSignIn(false);
          }}
        />
      )}
    </div>
  );
}
