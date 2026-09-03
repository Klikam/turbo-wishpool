"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface ShareLinkButtonProps {
  url: string;
}

export function ShareLinkButton({ url }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <button
      onClick={() => void copyLink()}
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
