"use client";

import { type Wishlist, WishlistArraySchema } from "@/types/wishlist";
import { storageHelper } from "@/utils/storageHelper";
import { BackButton, OccasionPicker, TextareaField, TextField } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const occasions = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Anniversary",
  "Christmas",
  "Graduation",
  "Housewarming",
  "Other",
] as const;

type Occasion = (typeof occasions)[number];

interface NewWishlist {
  title: string;
  occasion: Occasion;
  date: string;
  description: string;
}

export default function CreateWishlist() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState<NewWishlist>({
    title: "",
    occasion: occasions[0],
    date: "",
    description: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const currentUser = session?.user;

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

  if (status === "loading") return null;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <BackButton
            onClick={() => {
              router.push("/dashboard");
            }}
          />
        </div>

        <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
          New wishlist
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Create your list and share the link with friends and family.
        </p>

        <div className="flex flex-col gap-4">
          <TextField
            label="List title *"
            placeholder="Emma's 30th Birthday"
            value={form.title}
            onChange={(title) => {
              setForm({ ...form, title });
            }}
          />

          <OccasionPicker
            occasions={occasions}
            value={form.occasion}
            onChange={(occasion) => {
              setForm({ ...form, occasion: occasion as Occasion });
            }}
          />

          <TextField
            label="Date of occasion"
            type="date"
            value={form.date}
            onChange={(date) => {
              setForm({ ...form, date });
            }}
          />

          <TextareaField
            label="A note for your guests"
            placeholder="Thanks for celebrating with me! Anything on this list would make me so happy…"
            value={form.description}
            onChange={(description) => {
              setForm({ ...form, description });
            }}
          />

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
