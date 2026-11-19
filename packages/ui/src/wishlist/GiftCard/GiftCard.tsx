"use client";

import {
  Check,
  ExternalLink,
  Gift,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface GiftCardProps {
  name: string;
  description?: string;
  price?: string;
  url?: string;
  imageUrl?: string;
  claimed: boolean;
  isOwner: boolean;
  isMine: boolean;
  /** This gift's reservation is being saved: shows a spinner. */
  busy?: boolean;
  /** Blocks the card's buttons, e.g. while another change is saving. */
  disabled?: boolean;
  onClaim: () => void;
  onUnclaim: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GiftCard({
  name,
  description,
  price,
  url,
  imageUrl,
  claimed,
  isOwner,
  isMine,
  busy = false,
  disabled = false,
  onClaim,
  onUnclaim,
  onEdit,
  onDelete,
}: GiftCardProps) {
  // Shop images can disappear or block hotlinking, so a broken one falls back
  // to the placeholder too.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = imageUrl && !imageFailed;

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all duration-200 ${
        claimed
          ? "border-border opacity-75"
          : "border-border hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="relative">
        <div className="h-40 bg-secondary overflow-hidden">
          {showImage ? (
            <img
              src={imageUrl}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              // In server-rendered pages the image can fail before React
              // attaches onError, so also check once it's in the page.
              ref={(img) => {
                if (img?.complete && img.naturalWidth === 0) {
                  setImageFailed(true);
                }
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-[#E8B89A]/30">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border border-primary/10" />
              <div className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full border border-primary/10" />
              <div className="relative w-14 h-14 rounded-full bg-card/80 flex items-center justify-center shadow-sm">
                <Gift className="w-6 h-6 text-[#C4797A]" />
              </div>
            </div>
          )}
        </div>
        {claimed && (
          <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white/95 rounded-full px-4 py-2 shadow">
              <Check className="w-4 h-4 text-[#C4797A]" />
              <span className="text-xs font-semibold text-foreground">
                {isOwner
                  ? "Someone is gifting this"
                  : isMine
                    ? "You're gifting this"
                    : "Already claimed"}
              </span>
            </div>
          </div>
        )}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              onClick={onEdit}
              disabled={disabled}
              aria-label={`Edit ${name}`}
              title="Edit gift"
              className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow disabled:opacity-50 disabled:pointer-events-none"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={disabled}
              aria-label={`Delete ${name}`}
              title="Delete gift"
              className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shadow disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading font-semibold text-foreground leading-tight">
            {name}
          </h3>
          {price && (
            <span className="text-xs font-semibold text-[#C4797A] bg-[#C4797A]/10 px-2 py-0.5 rounded-full shrink-0">
              {price}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View item
            </a>
          )}

          {!isOwner && (
            <div className="ml-auto">
              {!claimed ? (
                <button
                  onClick={onClaim}
                  disabled={disabled}
                  aria-busy={busy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-[#3a1232] transition-colors font-medium disabled:opacity-60 disabled:pointer-events-none"
                >
                  {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                  I&apos;ll gift this
                </button>
              ) : isMine ? (
                <button
                  onClick={onUnclaim}
                  disabled={disabled}
                  aria-busy={busy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C4797A]/15 text-[#C4797A] text-xs rounded-lg hover:bg-[#C4797A]/25 transition-colors font-medium disabled:opacity-60 disabled:pointer-events-none"
                >
                  {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                  Undo
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
