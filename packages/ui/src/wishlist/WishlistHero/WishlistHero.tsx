import { Eye, EyeOff } from "lucide-react";

interface WishlistHeroProps {
  occasion: string;
  title: string;
  description?: string;
  date?: string;
  giftsCount: number;
  /** Omit when unknown, e.g. owners can't see reservations on their lists. */
  claimedCount?: number;
  isOwner: boolean;
}

export function WishlistHero({
  occasion,
  title,
  description,
  date,
  giftsCount,
  claimedCount,
  isOwner,
}: WishlistHeroProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-widest text-[#C4797A] uppercase mb-1">
            {occasion}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              {description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {date && (
              <span>
                📅{" "}
                {/* A date-only string parses as UTC midnight; formatting it
                    in the viewer's zone would show the day before west of UTC. */}
                {new Date(date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            )}
            <span>
              🎁 {giftsCount} {giftsCount === 1 ? "gift" : "gifts"}
              {claimedCount !== undefined &&
                ` · ${claimedCount.toString()} being gifted`}
            </span>
            {!isOwner && (
              <span className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Selections are anonymous
              </span>
            )}
          </div>
        </div>
      </div>
      {isOwner && (
        <div className="mt-4 inline-flex items-start gap-2 px-3 py-2 bg-[#4A1942]/8 border border-[#4A1942]/20 rounded-lg text-xs text-primary">
          <Eye className="w-3.5 h-3.5 shrink-0 mt-px" />
          {/* Anyone with the link sees which gifts are taken (that's what
              prevents duplicates), the owner too when signed out. */}
          <span>
            <strong>Taken gifts are hidden from you</strong>, and nobody can
            see who took them. Opening your link signed out would show
            what&apos;s taken — so don&apos;t peek.
          </span>
        </div>
      )}
    </div>
  );
}
