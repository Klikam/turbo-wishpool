"use client";

import {
  OCCASION_LABELS,
  type Occasion,
  type Wishlist,
  WishlistArraySchema,
} from "@/types/wishlist";
import { emptyToNull } from "@/utils/giftHelper";
import { storageHelper } from "@/utils/storageHelper";
import { BackButton, OccasionPicker, TextareaField, TextField } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/session";

const occasionLabels = Object.values(OCCASION_LABELS);

function occasionFromLabel(label: string): Occasion {
  const entry = Object.entries(OCCASION_LABELS).find(([, l]) => l === label);
  return (entry?.[0] as Occasion | undefined) ?? "other";
}

interface NewWishlist {
  title: string;
  occasion: Occasion;
  date: string;
  description: string;
}

interface CreateWishlistProps {
  user: Pick<SessionUser, "id" | "name">;
}

export default function CreateWishlist({ user: currentUser }: CreateWishlistProps) {
  const router = useRouter();

  const [form, setForm] = useState<NewWishlist>({
    title: "",
    occasion: "birthday",
    date: "",
    description: "",
  });

  function handleCreate() {
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
      date: emptyToNull(form.date),
      note: emptyToNull(form.description),
      gifts: [],
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
            occasions={occasionLabels}
            value={OCCASION_LABELS[form.occasion]}
            onChange={(label) => {
              setForm({ ...form, occasion: occasionFromLabel(label) });
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
