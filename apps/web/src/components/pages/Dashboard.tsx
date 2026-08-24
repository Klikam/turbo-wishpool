'use client';

import { useUserContext } from '@/context/UserContext';
import { WishlistArraySchema, type Wishlist } from '@/types/wishlist';
import { storageHelper } from '@/utils/storageHelper';
import {
  ChevronRight,
  Gift,
  LogOut,
  PartyPopper,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';

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

  const occasionEmoji: Record<string, string> = {
    Birthday: '🎂',
    Wedding: '💍',
    'Baby shower': '🍼',
    Anniversary: '💐',
    Christmas: '🎄',
    Graduation: '🎓',
    Housewarming: '🏠',
    Other: '🎁',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#C4797A]" />
            <span className="font-heading font-semibold text-foreground">
              Wishpool
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={currentUser.name} size="sm" />
            <span className="text-sm text-foreground hidden sm:block">
              {currentUser.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

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
          <div className="text-center py-24 border border-dashed border-border rounded-2xl">
            <PartyPopper className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm mb-4">
              No wishlists yet — create your first one!
            </p>
            <button
              onClick={() => {
                router.push('/create');
              }}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-[#3a1232] transition-colors"
            >
              Create wishlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myLists.map((list) => {
              const claimed = list.gifts.filter((g) => g.claimed).length;
              return (
                <div
                  key={list.id}
                  className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    router.push(`/wishlist/${list.id}`);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">
                      {occasionEmoji[list.occasion] ?? '🎁'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {list.occasion}
                    </p>
                    <h2 className="font-heading font-semibold text-foreground leading-tight">
                      {list.title}
                    </h2>
                    {list.date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(list.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {list.gifts.length} gifts · {claimed} claimed
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#C4797A] font-medium">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
