"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface ShareLinkButtonProps {
  url: string;
  /** Shown in the share sheet, e.g. the wishlist's title. */
  title?: string;
}

/** Phones (touch screens) get the system share sheet; elsewhere it copies. */
function canUseShareSheet() {
  return (
    typeof navigator.share === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function ShareLinkButton({ url, title }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  async function share() {
    if (!canUseShareSheet()) return copyLink();
    try {
      await navigator.share({ title, url });
    } catch (error) {
      // Closing the sheet is not a failure; anything else falls back to copying.
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyLink();
    }
  }

  return (
    <button
      onClick={() => void share()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#C4797A]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied!" : "Share link"}
    </button>
  );
}
