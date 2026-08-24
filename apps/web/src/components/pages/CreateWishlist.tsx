'use client';

import { useUserContext } from '@/context/UserContext';
import { WishlistArraySchema, type Wishlist } from '@/types/wishlist';
import { storageHelper } from '@/utils/storageHelper';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreateWishlist() {
  const { currentUser } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) router.replace('/');
  }, [currentUser, router]);

  const occasions = [
    'Birthday',
    'Wedding',
    'Baby shower',
    'Anniversary',
    'Christmas',
    'Graduation',
    'Housewarming',
    'Other',
  ] as const;

  type Ocasion = (typeof occasions)[number];

  interface NewWishlist {
    title: string;
    occasion: Ocasion;
    date: string;
    description: string;
  }

  const [form, setForm] = useState<NewWishlist>({
    title: '',
    occasion: occasions[0],
    date: '',
    description: '',
  });

  if (!currentUser) return null;

  function handleCreate() {
    if (!currentUser) return;
    if (!form.title.trim()) return;
    const wishlists = storageHelper.load<Wishlist[]>(
      storageHelper.STORAGE_KEYS.wishlists,
      [],
      WishlistArraySchema,
    );
    const newList: Wishlist = {
      id: storageHelper.genId(),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      title: form.title.trim(),
      occasion: form.occasion,
      date: form.date,
      description: form.description.trim(),
      gifts: [],
      createdAt: new Date().toISOString(),
    };
    storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, [
      ...wishlists,
      newList,
    ]);
    router.push(`/wishlist/${newList.id}`);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={() => {
            router.push('/dashboard');
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </button>

        <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
          New wishlist
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Create your list and share the link with friends and family.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              List title *
            </label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
              placeholder="Emma's 30th Birthday"
              value={form.title}
              onChange={e => {
                setForm({ ...form, title: e.target.value });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Occasion</label>
            <div className="grid grid-cols-4 gap-2">
              {occasions.map(occ => (
                <button
                  key={occ}
                  onClick={() => {
                    setForm({ ...form, occasion: occ });
                  }}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors text-center ${
                    form.occasion === occ
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-[#C4797A]/50'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Date of occasion
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
              value={form.date}
              onChange={e => {
                setForm({ ...form, date: e.target.value });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              A note for your guests
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm outline-none focus:border-[#C4797A] transition-colors resize-none"
              placeholder="Thanks for celebrating with me! Anything on this list would make me so happy…"
              value={form.description}
              onChange={e => {
                setForm({ ...form, description: e.target.value });
              }}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.title.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
