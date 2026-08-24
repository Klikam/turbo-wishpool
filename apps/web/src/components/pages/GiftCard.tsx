'use client';

import type { GiftItem } from '@/types/giftItem';
import { storageHelper } from '@/utils/storageHelper';
import { Check, ExternalLink, Trash2 } from 'lucide-react';

interface GiftCardProps {
  gift: GiftItem;
  isOwner: boolean;
  guestToken: string;
  onClaim: (id: string) => void;
  onUnclaim: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function GiftCard({
  gift,
  isOwner,
  guestToken,
  onClaim,
  onUnclaim,
  onDelete,
}: GiftCardProps) {
  const myHash = storageHelper.hashToken(guestToken);
  const iMine = gift.claimedByHash === myHash;

  const fallbackImages: Record<number, string> = {
    0: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&h=200&fit=crop&auto=format',
    1: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop&auto=format',
    2: 'https://images.unsplash.com/photo-1513201099705-a9746072788e?w=300&h=200&fit=crop&auto=format',
    3: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop&auto=format',
  };
  const imgSrc = gift.imageUrl || fallbackImages[gift.name.charCodeAt(0) % 4];

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden transition-all duration-200 ${
        gift.claimed
          ? 'border-border opacity-75'
          : 'border-border hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="relative">
        <div className="h-40 bg-secondary overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={gift.name}
            className="w-full h-full object-cover"
          />
        </div>
        {gift.claimed && (
          <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white/95 rounded-full px-4 py-2 shadow">
              <Check className="w-4 h-4 text-[#C4797A]" />
              <span className="text-xs font-semibold text-foreground">
                {isOwner
                  ? 'Someone is gifting this'
                  : iMine
                    ? "You're gifting this"
                    : 'Already claimed'}
              </span>
            </div>
          </div>
        )}
        {isOwner && (
          <button
            onClick={() => onDelete?.(gift.id)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shadow"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading font-semibold text-foreground leading-tight">
            {gift.name}
          </h3>
          {gift.price && (
            <span className="text-xs font-semibold text-[#C4797A] bg-[#C4797A]/10 px-2 py-0.5 rounded-full shrink-0">
              {gift.price}
            </span>
          )}
        </div>
        {gift.description && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
            {gift.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          {gift.url && (
            <a
              href={gift.url}
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
              {!gift.claimed ? (
                <button
                  onClick={() => {
                    onClaim(gift.id);
                  }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-[#3a1232] transition-colors font-medium"
                >
                  I&apos;ll gift this
                </button>
              ) : iMine ? (
                <button
                  onClick={() => {
                    onUnclaim(gift.id);
                  }}
                  className="px-3 py-1.5 bg-[#C4797A]/15 text-[#C4797A] text-xs rounded-lg hover:bg-[#C4797A]/25 transition-colors font-medium"
                >
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
