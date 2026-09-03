'use client';

import { useUserContext } from '@/context/UserContext';
import { useGuestToken } from '@/hooks/useGuestToken';
import type { GiftItem } from '@/types/giftItem';
import { WishlistArraySchema, type Wishlist } from '@/types/wishlist';
import { storageHelper } from '@/utils/storageHelper';
import {
  AddGiftModal,
  BackButton,
  EmptyState,
  GiftCard,
  ShareLinkButton,
  WishlistHero,
  type NewGift,
} from '@repo/ui';
import { Plus, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface WishlistViewProps {
  wishlistId: string;
}

export default function WishlistView({ wishlistId }: WishlistViewProps) {
  const { currentUser } = useUserContext();
  const guestToken = useGuestToken();
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

  const wishlist = wishlists.find(w => w.id === wishlistId);
  const isOwner = currentUser?.id === wishlist?.ownerId;
  const myHash = storageHelper.hashToken(guestToken);

  function goBack() {
    router.push(currentUser ? '/dashboard' : '/');
  }

  function updateWishlists(updated: Wishlist[]) {
    setWishlists(updated);
    storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, updated);
  }

  function handleClaim(giftId: string) {
    const updated = wishlists.map(w =>
      w.id === wishlistId
        ? {
            ...w,
            gifts: w.gifts.map(g =>
              g.id === giftId
                ? { ...g, claimed: true, claimedByHash: myHash }
                : g,
            ),
          }
        : w,
    );
    updateWishlists(updated);
  }

  function handleUnclaim(giftId: string) {
    const updated = wishlists.map(w =>
      w.id === wishlistId
        ? {
            ...w,
            gifts: w.gifts.map(g =>
              g.id === giftId && g.claimedByHash === myHash
                ? { ...g, claimed: false, claimedByHash: null }
                : g,
            ),
          }
        : w,
    );
    updateWishlists(updated);
  }

  function handleDelete(giftId: string) {
    const updated = wishlists.map(w =>
      w.id === wishlistId
        ? { ...w, gifts: w.gifts.filter(g => g.id !== giftId) }
        : w,
    );
    updateWishlists(updated);
  }

  function handleAddGift(newGift: NewGift) {
    const gift: GiftItem = {
      id: storageHelper.genId(),
      ...newGift,
      claimed: false,
      claimedByHash: null,
    };
    const updated = wishlists.map(w =>
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

  const claimedCount = wishlist.gifts.filter(g => g.claimed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <BackButton onClick={goBack} />
          <div className="flex items-center gap-2">
            <ShareLinkButton
              url={`${typeof window === 'undefined' ? '' : window.location.origin}/wishlist/${wishlistId}`}
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
          occasion={wishlist.occasion}
          title={wishlist.title}
          description={wishlist.description}
          date={wishlist.date}
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
                ? 'No gifts yet — add your first one!'
                : 'No gifts on this list yet.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.gifts.map(gift => (
              <GiftCard
                key={gift.id}
                name={gift.name}
                description={gift.description}
                price={gift.price}
                url={gift.url}
                imageUrl={gift.imageUrl}
                claimed={gift.claimed}
                isOwner={isOwner}
                isMine={gift.claimedByHash === myHash}
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
