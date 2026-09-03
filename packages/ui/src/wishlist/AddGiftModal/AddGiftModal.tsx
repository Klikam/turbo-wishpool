"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TextField } from "../../common/TextField";

export interface NewGift {
  name: string;
  description: string;
  price: string;
  url: string;
  imageUrl: string;
}

interface AddGiftModalProps {
  onAdd: (gift: NewGift) => void;
  onClose: () => void;
}

const emptyGift: NewGift = {
  name: "",
  description: "",
  price: "",
  url: "",
  imageUrl: "",
};

export function AddGiftModal({ onAdd, onClose }: AddGiftModalProps) {
  const [newGift, setNewGift] = useState<NewGift>(emptyGift);

  function handleAdd() {
    if (!newGift.name.trim()) return;
    onAdd({
      name: newGift.name.trim(),
      description: newGift.description.trim(),
      price: newGift.price.trim(),
      url: newGift.url.trim(),
      imageUrl: newGift.imageUrl.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading text-xl font-semibold">Add a gift</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <TextField
            label="Gift name *"
            placeholder="e.g. Wireless headphones"
            value={newGift.name}
            onChange={(name) => {
              setNewGift({ ...newGift, name });
            }}
            compact
          />
          <TextField
            label="Description"
            placeholder="Color, size, model…"
            value={newGift.description}
            onChange={(description) => {
              setNewGift({ ...newGift, description });
            }}
            compact
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Price"
              placeholder="€ 49.90"
              value={newGift.price}
              onChange={(price) => {
                setNewGift({ ...newGift, price });
              }}
              compact
            />
            <TextField
              label="Link (URL)"
              placeholder="https://…"
              value={newGift.url}
              onChange={(url) => {
                setNewGift({ ...newGift, url });
              }}
              compact
            />
          </div>
          <TextField
            label="Image URL"
            placeholder="https://… (optional)"
            value={newGift.imageUrl}
            onChange={(imageUrl) => {
              setNewGift({ ...newGift, imageUrl });
            }}
            compact
          />
          <button
            onClick={handleAdd}
            disabled={!newGift.name.trim()}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            Add to wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
