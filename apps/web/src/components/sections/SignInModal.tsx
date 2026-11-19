"use client";

import { Modal } from "@repo/ui";
import { SignInForm } from "@/components/sections/SignInForm";

interface SignInModalProps {
  /** Where to return once signed in, usually the page that opened the dialog. */
  callbackURL: string;
  onClose: () => void;
}

export function SignInModal({ callbackURL, onClose }: SignInModalProps) {
  return (
    <Modal
      title="Sign in"
      subtitle="You'll come right back to this wishlist."
      onClose={onClose}
    >
      <div className="p-6">
        <SignInForm callbackURL={callbackURL} />
      </div>
    </Modal>
  );
}
