"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ToastError } from "../../auth/ToastError";
import { Modal } from "../../common/Modal";
import { TextField } from "../../common/TextField";

/** The gift form's fields, as typed. */
export interface GiftFormValues {
  name: string;
  description: string;
  price: string;
  url: string;
  imageUrl: string;
}

interface GiftModalProps {
  /** ISO 4217 code of the wishlist's prices, e.g. "PLN". */
  currency: string;
  /** The gift being edited. Without it the dialog adds a new gift. */
  gift?: GiftFormValues;
  /** The gift is being saved: the button is blocked and shows progress. */
  submitting?: boolean;
  /** Why the last attempt failed. Shown here because toasts sit behind the modal. */
  error?: string;
  onSave: (gift: GiftFormValues) => void;
  onClose: () => void;
}

const emptyGift: GiftFormValues = {
  name: "",
  description: "",
  price: "",
  url: "",
  imageUrl: "",
};

/** Adds a gift, or edits one when `gift` is given. */
export function GiftModal({
  currency,
  gift,
  submitting = false,
  error,
  onSave,
  onClose,
}: GiftModalProps) {
  const [values, setValues] = useState<GiftFormValues>(gift ?? emptyGift);
  const isEditing = gift !== undefined;

  function handleSave() {
    if (!values.name.trim() || submitting) return;
    onSave({
      name: values.name.trim(),
      description: values.description.trim(),
      price: values.price.trim(),
      url: values.url.trim(),
      imageUrl: values.imageUrl.trim(),
    });
  }

  return (
    <Modal
      title={isEditing ? "Edit gift" : "Add a gift"}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="p-6 flex flex-col gap-4">
        <TextField
          label="Gift name *"
          placeholder="e.g. Wireless headphones"
          value={values.name}
          onChange={(name) => {
            setValues({ ...values, name });
          }}
          compact
        />
        <TextField
          label="Description"
          placeholder="Color, size, model…"
          value={values.description}
          onChange={(description) => {
            setValues({ ...values, description });
          }}
          compact
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={`Price (${currency})`}
            placeholder="49.90"
            value={values.price}
            onChange={(price) => {
              setValues({ ...values, price });
            }}
            compact
          />
          <TextField
            label="Link (URL)"
            placeholder="shop.com/item"
            type="url"
            value={values.url}
            onChange={(url) => {
              setValues({ ...values, url });
            }}
            compact
          />
        </div>
        <TextField
          label="Image URL"
          placeholder="Optional — taken from the link if empty"
          type="url"
          value={values.imageUrl}
          onChange={(imageUrl) => {
            setValues({ ...values, imageUrl });
          }}
          compact
        />
        {error && (
          <div role="alert">
            <ToastError message={error} />
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={!values.name.trim() || submitting}
          aria-busy={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting
            ? isEditing
              ? "Saving…"
              : "Adding…"
            : isEditing
              ? "Save changes"
              : "Add to wishlist"}
        </button>
      </div>
    </Modal>
  );
}
