"use client";

import { X } from "lucide-react";
import { SignInForm } from "@/components/sections/SignInForm";

interface SignInModalProps {
  /** Where to return once signed in, usually the page that opened the dialog. */
  callbackURL: string;
  onClose: () => void;
}

export function SignInModal({ callbackURL, onClose }: SignInModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-heading text-xl font-semibold">Sign in</h2>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;ll come right back to this wishlist.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <SignInForm callbackURL={callbackURL} />
        </div>
      </div>
    </div>
  );
}
