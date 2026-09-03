'use client';

import { useUserContext } from '@/context/UserContext';
import { WishlistArraySchema, type Wishlist } from '@/types/wishlist';
import { storageHelper } from '@/utils/storageHelper';
import { DashboardHeader, EmptyState, WishlistCard } from '@repo/ui';
import { PartyPopper, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { currentUser } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) router.replace('/');
  }, [currentUser, router]);

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);

  useEffect(() => {
    setWishlists(
      storageHelper.load<Wishlist[]>(
        storageHelper.STORAGE_KEYS.wishlists,
        [],
        WishlistArraySchema,
      ),
    );
  }, []);

  if (!currentUser) return null;

  const myLists = wishlists.filter((w) => w.ownerId === currentUser.id);

  function deleteList(id: string) {
    const updated = wishlists.filter((w) => w.id !== id);
    storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, updated);
    window.location.reload();
  }

  function handleLogout() {
    console.log('Not implemented');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={currentUser.name} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Greeting */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C4797A] uppercase mb-1">
              Your wishlists
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">
              Hello, {currentUser.name.split(' ')[0]} 👋
            </h1>
          </div>
          <button
            onClick={() => {
              router.push('/create');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New wishlist
          </button>
        </div>

        {myLists.length === 0 ? (
          <EmptyState
            icon={<PartyPopper />}
            message="No wishlists yet — create your first one!"
            action={{
              label: 'Create wishlist',
              onClick: () => {
                router.push('/create');
              },
            }}
            bordered
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myLists.map((list) => {
              const claimed = list.gifts.filter((g) => g.claimed).length;
              return (
                <WishlistCard
                  key={list.id}
                  occasion={list.occasion}
                  title={list.title}
                  date={list.date}
                  giftsCount={list.gifts.length}
                  claimedCount={claimed}
                  onOpen={() => {
                    router.push(`/wishlist/${list.id}`);
                  }}
                  onDelete={() => {
                    deleteList(list.id);
                  }}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
