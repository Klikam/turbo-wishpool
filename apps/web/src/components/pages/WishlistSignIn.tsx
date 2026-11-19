import { SignInForm } from "@/components/sections/SignInForm";
import { OCCASION_LABELS, type WishlistPreview } from "@/types/wishlist";

interface WishlistSignInProps {
  wishlist: WishlistPreview;
}

/**
 * What a signed-out visitor sees on a shared wishlist link: who it is from,
 * and a sign-in that brings them back to the list. The gifts stay hidden
 * until they do.
 */
export default function WishlistSignIn({ wishlist }: WishlistSignInProps) {
  return (
    <div className="flex-1 bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold tracking-widest text-[#C4797A] uppercase mb-1">
          {OCCASION_LABELS[wishlist.occasion ?? "other"]}
        </p>
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          {wishlist.title}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Sign in to see {wishlist.ownerName}&apos;s wishlist and pick a gift.
          You&apos;ll come right back to it.
        </p>

        <SignInForm callbackURL={`/wishlist/${wishlist.id}`} />
      </div>
    </div>
  );
}
