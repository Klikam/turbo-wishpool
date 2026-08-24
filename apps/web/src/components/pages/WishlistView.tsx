'use client';

import { useUserContext } from '@/context/UserContext';
import { useGuestToken } from '@/hooks/useGuestToken';
import type { GiftItem } from '@/types/giftItem';
import { WishlistArraySchema, type Wishlist } from '@/types/wishlist';
import { storageHelper } from '@/utils/storageHelper';
import {
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GiftCard from './GiftCard';

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

  const [copied, setCopied] = useState(false);
  const [showAddGift, setShowAddGift] = useState(false);
  const [newGift, setNewGift] = useState({
    name: '',
    description: '',
    price: '',
    url: '',
    imageUrl: '',
  });

  const wishlist = wishlists.find(w => w.id === wishlistId);
  const isOwner = currentUser?.id === wishlist?.ownerId;

  function goBack() {
    router.push(currentUser ? '/dashboard' : '/');
  }

  function updateWishlists(updated: Wishlist[]) {
    setWishlists(updated);
    storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, updated);
  }

  function handleClaim(giftId: string) {
    const myHash = storageHelper.hashToken(guestToken);
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
    const myHash = storageHelper.hashToken(guestToken);
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

  function handleAddGift() {
    if (!newGift.name.trim()) return;
    const gift: GiftItem = {
      id: storageHelper.genId(),
      name: newGift.name.trim(),
      description: newGift.description.trim(),
      price: newGift.price.trim(),
      url: newGift.url.trim(),
      imageUrl: newGift.imageUrl.trim(),
      claimed: false,
      claimedByHash: null,
    };
    const updated = wishlists.map(w =>
      w.id === wishlistId ? { ...w, gifts: [...w.gifts, gift] } : w,
    );
    updateWishlists(updated);
    setNewGift({ name: '', description: '', price: '', url: '', imageUrl: '' });
    setShowAddGift(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/wishlist/${wishlistId}`,
    );
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void copyLink()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#C4797A]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied!' : 'Share link'}
            </button>
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
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-widest text-[#C4797A] uppercase mb-1">
                {wishlist.occasion}
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-2">
                {wishlist.title}
              </h1>
              {wishlist.description && (
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                  {wishlist.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {wishlist.date && (
                  <span>
                    📅{' '}
                    {new Date(wishlist.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
                <span>
                  🎁 {wishlist.gifts.length} gifts · {claimedCount} being gifted
                </span>
                {!isOwner && (
                  <span className="flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Selections are anonymous
                  </span>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-[#4A1942]/8 border border-[#4A1942]/20 rounded-lg text-xs text-primary">
              <Eye className="w-3.5 h-3.5" />
              You can see your gifts but{' '}
              <strong>not who is claiming them</strong> — the surprise is safe.
            </div>
          )}
        </div>

        {/* Gifts grid */}
        {wishlist.gifts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {isOwner
                ? 'No gifts yet — add your first one!'
                : 'No gifts on this list yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.gifts.map(gift => (
              <GiftCard
                key={gift.id}
                gift={gift}
                isOwner={isOwner}
                guestToken={guestToken}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Gift Modal */}
      {showAddGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading text-xl font-semibold">
                Add a gift
              </h2>
              <button
                onClick={() => {
                  setShowAddGift(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Gift name *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
                  placeholder="e.g. Wireless headphones"
                  value={newGift.name}
                  onChange={e => {
                    setNewGift({ ...newGift, name: e.target.value });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
                  placeholder="Color, size, model…"
                  value={newGift.description}
                  onChange={e => {
                    setNewGift({ ...newGift, description: e.target.value });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
                    placeholder="€ 49.90"
                    value={newGift.price}
                    onChange={e => {
                      setNewGift({ ...newGift, price: e.target.value });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link (URL)
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
                    placeholder="https://…"
                    value={newGift.url}
                    onChange={e => {
                      setNewGift({ ...newGift, url: e.target.value });
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Image URL
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
                  placeholder="https://… (optional)"
                  value={newGift.imageUrl}
                  onChange={e => {
                    setNewGift({ ...newGift, imageUrl: e.target.value });
                  }}
                />
              </div>
              <button
                onClick={handleAddGift}
                disabled={!newGift.name.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
              >
                Add to wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
