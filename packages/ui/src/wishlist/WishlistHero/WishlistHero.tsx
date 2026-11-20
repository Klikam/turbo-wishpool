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
  /** The list has ended: shown as a "Past" badge next to the occasion. */
  isPast?: boolean;
}

export function WishlistHero({
  occasion,
  title,
  description,
  date,
  giftsCount,
  claimedCount,
  isOwner,
  isPast = false,
}: WishlistHeroProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#C4797A] uppercase mb-1">
            {occasion}
            {isPast && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground tracking-normal normal-case">
                Past
              </span>
            )}
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
                <EyeOff className="w-3 h-3" /> {"The owner can't see what's claimed"}
              </span>
            )}
          </div>
        </div>
      </div>
      {isOwner && (
        <div className="mt-4 inline-flex items-start gap-2 px-3 py-2 bg-[#4A1942]/8 border border-[#4A1942]/20 rounded-lg text-xs text-primary">
          <Eye className="w-3.5 h-3.5 shrink-0 mt-px" />
          {/* Only signed-in users see the gifts, and the backend never
              tells the owner which are taken. */}
          <span>
            <strong>You can&apos;t see what&apos;s been claimed</strong>, or by
            whom — so the gifts stay a surprise. If you change or delete a gift
            someone already claimed, they&apos;ll be emailed.
          </span>
        </div>
      )}
    </div>
  );
}
