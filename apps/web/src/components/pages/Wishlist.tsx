"use client";

import {
  addGift,
  cancelGiftRequest,
  cancelReservation,
  deleteGift,
  requestGift,
  reserveGift,
  respondToGiftRequest,
  setWishlistClosed,
  updateGift,
} from "@/actions/wishlists";
import { ConfirmDeleteDialog } from "@/components/sections/ConfirmDeleteDialog";
import type { GiftItem, GiftRequestType } from "@/types/giftItem";
import { OCCASION_LABELS, type Wishlist } from "@/types/wishlist";
import type { ActionResult } from "@/utils/actionResult";
import {
  emptyToNull,
  formatPrice,
  normalizeUrl,
  parsePrice,
} from "@/utils/giftHelper";
import {
  BackButton,
  EmptyState,
  GiftCard,
  type GiftFormValues,
  GiftModal,
  ShareLinkButton,
  WishlistHero,
} from "@repo/ui";
import { CalendarCheck, Pencil, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

interface WishlistViewProps {
  wishlist: Wishlist;
}

// Just over the backend's 5 s limit for fetching a gift link's preview image.
const IMAGE_LOOKUP_DELAY_MS = 6000;

/** A saved gift as the gift dialog's fields. */
function toFormValues(gift: GiftItem): GiftFormValues {
  return {
    name: gift.name,
    description: gift.description ?? "",
    price: gift.price === null ? "" : String(gift.price),
    url: gift.url ?? "",
    imageUrl: gift.imageUrl ?? "",
  };
}

export default function Wishlist({ wishlist }: WishlistViewProps) {
  const router = useRouter();
  const wishlistId = wishlist.id;

  // Open gift dialog: `gift` is the one being edited, absent when adding.
  const [giftDialog, setGiftDialog] = useState<{ gift?: GiftItem } | null>(
    null,
  );
  const [giftDialogError, setGiftDialogError] = useState<string>();
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

  /** An equal share of a gift's price, or undefined without a price. */
  function perPerson(price: number | null, people: number) {
    if (price === null || people < 2) return undefined;
    return formatPrice(price / people, wishlist.currency);
  }

  function goBack() {
    router.push("/dashboard");
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
    mutate(() => reserveGift(wishlistId, giftId), { giftId });
  }

  function handleUnclaim(giftId: string) {
    mutate(() => cancelReservation(wishlistId, giftId), { giftId });
  }

  function handleRequest(giftId: string, type: GiftRequestType) {
    mutate(() => requestGift(wishlistId, giftId, type), {
      giftId,
      onSuccess: () =>
        toast.success(
          "Request sent. They've been emailed and you'll hear back by email.",
        ),
    });
  }

  function handleCancelRequest(giftId: string, requestId: string) {
    mutate(() => cancelGiftRequest(wishlistId, giftId, requestId), { giftId });
  }

  function handleRespond(giftId: string, requestId: string, accept: boolean) {
    mutate(() => respondToGiftRequest(wishlistId, giftId, requestId, accept), {
      giftId,
      onSuccess: () =>
        toast.success(accept ? "Accepted. We've told them." : "Declined."),
    });
  }

  function handleSetClosed(closed: boolean) {
    mutate(() => setWishlistClosed(wishlistId, closed), {
      onSuccess: () =>
        toast.success(
          closed
            ? "Marked as past. Visitors can no longer claim gifts."
            : "Reopened. Visitors can claim gifts again.",
        ),
    });
  }

  function handleDelete(giftId: string) {
    mutate(() => deleteGift(wishlistId, giftId), { giftId, removes: true });
  }

  function closeGiftDialog() {
    setGiftDialog(null);
    setGiftDialogError(undefined);
  }

  function handleSaveGift(values: GiftFormValues) {
    const editedGiftId = giftDialog?.gift?.id;
    const url = normalizeUrl(values.url);
    const imageUrl = normalizeUrl(values.imageUrl);
    const input = {
      name: values.name,
      description: emptyToNull(values.description),
      price: parsePrice(values.price),
      url,
      imageUrl,
    };
    setGiftDialogError(undefined);
    mutate(
      () =>
        editedGiftId
          ? updateGift(wishlistId, editedGiftId, input)
          : addGift(wishlistId, input),
      {
        onSuccess: () => {
          closeGiftDialog();
          // The backend takes the image from the link after saving the gift.
          if (url && !imageUrl) {
            setTimeout(() => {
              router.refresh();
            }, IMAGE_LOOKUP_DELAY_MS);
          }
        },
        onError: setGiftDialogError,
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
            {isOwner && (
              <Link
                href={`/wishlist/${wishlistId}/edit`}
                aria-label="Edit list"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {/* Icon only on phones, to keep the header on one line. */}
                <span className="hidden sm:inline">Edit list</span>
              </Link>
            )}
            {isOwner && !wishlist.isPast && (
              <button
                onClick={() => {
                  handleSetClosed(true);
                }}
                disabled={isPending}
                aria-label="Mark as past"
                title="Mark as past: visitors can no longer claim gifts"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark as past</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => {
                  setGiftDialog({});
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
          isPast={wishlist.isPast}
        />

        {wishlist.isPast && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground"
          >
            <p>
              {!isOwner
                ? "This wishlist is in the past, so gifts can no longer be claimed or changed."
                : wishlist.closed
                  ? "You marked this list as past, so visitors can no longer claim gifts."
                  : "The date of this list has passed, so visitors can no longer claim gifts. To open it again, move the date."}
            </p>
            {isOwner && wishlist.closed && (
              <button
                onClick={() => {
                  handleSetClosed(false);
                }}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-background transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Reopen
              </button>
            )}
            {isOwner && !wishlist.closed && (
              <Link
                href={`/wishlist/${wishlistId}/edit`}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-background transition-colors"
              >
                Change date
              </Link>
            )}
          </div>
        )}

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
                reservers={gift.reservers}
                pricePerPerson={perPerson(gift.price, gift.reservers.length)}
                pricePerPersonIfJoined={perPerson(
                  gift.price,
                  gift.reservers.length + 1,
                )}
                myRequest={gift.myRequest}
                incomingRequests={gift.incomingRequests}
                onRequest={(type) => {
                  handleRequest(gift.id, type);
                }}
                onCancelRequest={() => {
                  if (gift.myRequest) handleCancelRequest(gift.id, gift.myRequest.id);
                }}
                onRespond={(requestId, accept) => {
                  handleRespond(gift.id, requestId, accept);
                }}
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
                locked={wishlist.isPast}
                onClaim={() => {
                  handleClaim(gift.id);
                }}
                onUnclaim={() => {
                  handleUnclaim(gift.id);
                }}
                onEdit={() => {
                  setGiftDialog({ gift });
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

      {/* Add or edit gift dialog */}
      {giftDialog && (
        <GiftModal
          currency={wishlist.currency}
          gift={giftDialog.gift && toFormValues(giftDialog.gift)}
          submitting={isPending}
          error={giftDialogError}
          onSave={handleSaveGift}
          onClose={closeGiftDialog}
        />
      )}

      <ConfirmDeleteDialog
        open={confirmingDelete}
        title={`Delete “${giftToDelete?.name ?? ""}”?`}
        description="The gift will be removed from your wishlist for good. If someone has already claimed it, they'll be emailed that it's gone."
        onConfirm={() => {
          if (giftToDelete) handleDelete(giftToDelete.id);
        }}
        onClose={() => {
          setConfirmingDelete(false);
        }}
      />
    </div>
  );
}
