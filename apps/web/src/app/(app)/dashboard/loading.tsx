import { Loader2 } from "lucide-react";

// Shown at once while the dashboard loads its lists on the server. Wishlist
// pages have their own skeleton (see wishlist/[id]/loading.tsx).
export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center" role="status">
      <Loader2 className="w-6 h-6 text-[#C4797A] animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
