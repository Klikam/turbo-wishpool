import { ChevronRight, Trash2 } from "lucide-react";

const occasionEmoji: Record<string, string> = {
  Birthday: "🎂",
  Wedding: "💍",
  "Baby shower": "🍼",
  Anniversary: "💐",
  Christmas: "🎄",
  Graduation: "🎓",
  Housewarming: "🏠",
  Other: "🎁",
};

interface WishlistCardProps {
  occasion: string;
  title: string;
  date?: string;
  giftsCount: number;
  claimedCount: number;
  onOpen: () => void;
  onDelete: () => void;
}

export function WishlistCard({
  occasion,
  title,
  date,
  giftsCount,
  claimedCount,
  onOpen,
  onDelete,
}: WishlistCardProps) {
  return (
    <div
      className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{occasionEmoji[occasion] ?? "🎁"}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{occasion}</p>
        <h2 className="font-heading font-semibold text-foreground leading-tight">
          {title}
        </h2>
        {date && (
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {giftsCount} gifts · {claimedCount} claimed
        </span>
        <div className="flex items-center gap-1 text-xs text-[#C4797A] font-medium">
          View <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
