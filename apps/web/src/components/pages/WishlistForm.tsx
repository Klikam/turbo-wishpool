"use client";

import { createWishlist, updateWishlist } from "@/actions/wishlists";
import { OCCASION_LABELS, type Occasion, type Wishlist } from "@/types/wishlist";
import { CURRENCIES, currencyLabel } from "@/utils/currency";
import { emptyToNull } from "@/utils/giftHelper";
import {
  BackButton,
  OccasionPicker,
  SelectField,
  TextareaField,
  TextField,
} from "@repo/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const occasionLabels = Object.values(OCCASION_LABELS);

const currencyOptions = CURRENCIES.map((code) => ({
  value: code,
  label: currencyLabel(code),
}));

function occasionFromLabel(label: string): Occasion {
  const entry = Object.entries(OCCASION_LABELS).find(([, l]) => l === label);
  return (entry?.[0] as Occasion | undefined) ?? "other";
}

interface WishlistFormValues {
  title: string;
  occasion: Occasion;
  date: string;
  description: string;
  currency: string;
}

type WishlistFormProps =
  | {
      mode: "create";
      /** Pre-selected currency, guessed from the owner's language. */
      defaultCurrency: string;
    }
  | { mode: "edit"; wishlist: Wishlist };

/** Creates a wishlist, or edits an existing one. */
export default function WishlistForm(props: WishlistFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const editing = props.mode === "edit" ? props.wishlist : null;
  const backTo = editing ? `/wishlist/${editing.id}` : "/dashboard";

  const [form, setForm] = useState<WishlistFormValues>(
    props.mode === "edit"
      ? {
          title: props.wishlist.title,
          occasion: props.wishlist.occasion ?? "other",
          date: props.wishlist.date ?? "",
          description: props.wishlist.note ?? "",
          currency: props.wishlist.currency,
        }
      : {
          title: "",
          occasion: "birthday",
          date: "",
          description: "",
          currency: props.defaultCurrency,
        },
  );

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.title.trim() || submitting) return;

    setSubmitting(true);
    const input = {
      title: form.title.trim(),
      occasion: form.occasion,
      date: emptyToNull(form.date),
      note: emptyToNull(form.description),
      currency: form.currency,
    };
    const result = editing
      ? await updateWishlist(editing.id, input)
      : await createWishlist(input);

    if (!result.ok) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/wishlist/${result.data.id}`);
  }

  return (
    <div className="flex-1 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <BackButton
            onClick={() => {
              router.push(backTo);
            }}
          />
        </div>

        <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
          {editing ? "Edit wishlist" : "New wishlist"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {editing
            ? "Changes show up for everyone who has the link."
            : "Create your list and share the link with friends and family."}
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <TextField
            label="List title *"
            placeholder="Emma's 30th Birthday"
            maxLength={255}
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

          <div>
            <SelectField
              label="Currency of gift prices"
              value={form.currency}
              options={currencyOptions}
              onChange={(currency) => {
                setForm({ ...form, currency });
              }}
            />
            {editing && form.currency !== editing.currency && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Prices keep their amounts and aren&apos;t converted.
              </p>
            )}
          </div>

          <TextareaField
            label="A note for your guests"
            placeholder="Thanks for celebrating with me! Anything on this list would make me so happy…"
            maxLength={2000}
            value={form.description}
            onChange={(description) => {
              setForm({ ...form, description });
            }}
          />

          <button
            type="submit"
            disabled={!form.title.trim() || submitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editing ? "Save changes" : "Create wishlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
