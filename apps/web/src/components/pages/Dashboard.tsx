"use client";

import { OCCASION_LABELS, type WishlistSummary } from "@/types/wishlist";
import { EmptyState, WishlistCard } from "@repo/ui";
import { DashboardHeader } from "@/components/sections/DashboardHeader";
import { PartyPopper, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logout as onLogout } from "@/actions/auth";
import { deleteWishlist } from "@/actions/wishlists";
import type { SessionUser } from "@/lib/session";

interface DashboardProps {
  user: Pick<SessionUser, "id" | "name">;
  wishlists: WishlistSummary[];
}

export default function Dashboard({ user, wishlists: myLists }: DashboardProps) {
  const router = useRouter();

  async function deleteList(id: string) {
    const result = await deleteWishlist(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleLogout() {
    console.log(`Logged out user ${user.name}`);
    await onLogout();
    router.push("/");
    router.refresh();
  }


  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user.name}
        onLogout={() => void handleLogout()}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C4797A] uppercase mb-1">
              Your wishlists
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">
              Hello, {user.name.split(" ")[0]} 👋
            </h1>
          </div>
          <button
            onClick={() => {
              router.push("/create");
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New wishlist
          </button>
        </div>

        {myLists.length === 0 ? (
          <EmptyState
            icon={<PartyPopper />}
            message="No wishlists yet — create your first one!"
            action={{
              label: "Create wishlists",
              onClick: () => {
                router.push("/create");
              },
            }}
            bordered
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myLists.map((list) => (
              <WishlistCard
                key={list.id}
                occasion={OCCASION_LABELS[list.occasion ?? "other"]}
                title={list.title}
                date={list.date ?? undefined}
                giftsCount={list.giftsCount}
                onOpen={() => {
                  router.push(`/wishlist/${list.id}`);
                }}
                onDelete={() => {
                  void deleteList(list.id);
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
