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
import {
  emptyToNull,
  formatPrice,
  normalizeUrl,
  parsePrice,
} from "@/utils/giftHelper";
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
import { useOptimistic, useState, useTransition } from "react";
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
  const [addGiftError, setAddGiftError] = useState<string>();
  // Gift a guest is about to reserve, while the name dialog is open.
  const [claimingGiftId, setClaimingGiftId] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  // Kept after the dialog closes so its text doesn't change while it fades out.
  const [giftToDelete, setGiftToDelete] = useState<GiftItem | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // True from a click until the refreshed list is on screen, so a second
  // click can't act on what the first one already changed.
  const [isPending, startTransition] = useTransition();
  // Gift whose action is running, to show progress on its card.
  const [busyGiftId, setBusyGiftId] = useState<string | null>(null);
  // A deleted gift disappears at once (the confirm dialog has already
  // closed) and comes back if the delete fails.
  const [gifts, removeGift] = useOptimistic(
    wishlist.gifts,
    (current, giftId: string) => current.filter((g) => g.id !== giftId),
  );

  const isOwner = wishlist.isOwner;

  function goBack() {
    router.push(isSignedIn ? "/dashboard" : "/");
  }

  /** Runs a mutation, reports a failure, then re-syncs with the backend. */
  function mutate(
    run: () => Promise<ActionResult<unknown>>,
    {
      giftId,
      removes = false,
      onSuccess,
      onError = toast.error,
    }: {
      giftId?: string;
      removes?: boolean;
      onSuccess?: () => void;
      onError?: (message: string) => void;
    } = {},
  ) {
    setBusyGiftId(giftId ?? null);
    startTransition(async () => {
      if (removes && giftId) removeGift(giftId);
      const result = await run();
      startTransition(() => {
        if (result.ok) onSuccess?.();
        else onError(result.error);
        router.refresh();
      });
    });
  }

  function handleClaim(giftId: string) {
    if (isSignedIn) {
      mutate(() => reserveGift(wishlistId, giftId), { giftId });
    } else {
      setClaimingGiftId(giftId);
    }
  }

  function handleGuestClaim(name: string) {
    if (!claimingGiftId) return;
    const giftId = claimingGiftId;
    setClaimingGiftId(null);
    storageHelper.save(storageHelper.STORAGE_KEYS.guestName, name);
    mutate(() => reserveGift(wishlistId, giftId, name), { giftId });
  }

  function handleUnclaim(giftId: string) {
    mutate(() => cancelReservation(wishlistId, giftId), { giftId });
  }

  function handleDelete(giftId: string) {
    mutate(() => deleteGift(wishlistId, giftId), { giftId, removes: true });
  }

  function handleAddGift(newGift: NewGift) {
    const url = normalizeUrl(newGift.url);
    const imageUrl = normalizeUrl(newGift.imageUrl);
    setAddGiftError(undefined);
    mutate(
      () =>
        addGift(wishlistId, {
          name: newGift.name,
          description: emptyToNull(newGift.description),
          price: parsePrice(newGift.price),
          url,
          imageUrl,
        }),
      {
        onSuccess: () => {
          setShowAddGift(false);
          // The backend takes the image from the link after saving the gift.
          if (url && !imageUrl) {
            setTimeout(() => {
              router.refresh();
            }, IMAGE_LOOKUP_DELAY_MS);
          }
        },
        onError: setAddGiftError,
      },
    );
  }

  // The backend hides reservations from the owner, so there is no count to show.
  const claimedCount = isOwner
    ? undefined
    : gifts.filter((g) => g.reserved).length;

  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <BackButton onClick={goBack} />
          <div className="flex items-center gap-2">
            <ShareLinkButton
              url={`${typeof window === "undefined" ? "" : window.location.origin}/wishlist/${wishlistId}`}
              title={wishlist.title}
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
          giftsCount={gifts.length}
          claimedCount={claimedCount}
          isOwner={isOwner}
        />

        {/* Gifts grid */}
        {gifts.length === 0 ? (
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
            {gifts.map((gift) => (
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
                busy={isPending && busyGiftId === gift.id}
                disabled={isPending}
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
          submitting={isPending}
          error={addGiftError}
          onAdd={handleAddGift}
          onClose={() => {
            setShowAddGift(false);
            setAddGiftError(undefined);
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
