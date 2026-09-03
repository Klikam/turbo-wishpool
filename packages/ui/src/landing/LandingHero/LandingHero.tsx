import { EyeOff, Gift, Star, Users } from "lucide-react";
import { FeatureItem } from "../../landing/FeatureItem";

export function LandingHero() {
  return (
    <div className="lg:w-1/2 bg-primary relative overflow-hidden flex flex-col justify-between p-10 lg:p-16 min-h-[40vh] lg:min-h-screen">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-[#C4797A]" />
          <span className="text-[#C4797A] font-semibold tracking-widest text-xs uppercase">
            Wishpool
          </span>
        </div>
      </div>
      {/* Decorative rings */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
      <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/10" />
      <div className="absolute bottom-20 -left-24 w-80 h-80 rounded-full border border-white/10" />
      <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full border border-white/5" />

      <div className="relative z-10">
        <h1 className="font-heading text-4xl lg:text-5xl xl:text-6xl font-semibold text-white leading-[1.15] mb-6">
          The wishlist
          <br />
          <em className="text-[#E8B89A]">they&apos;ll actually</em>
          <br />
          love to receive.
        </h1>
        <p className="text-white/60 text-base lg:text-lg max-w-sm leading-relaxed">
          Create a wishlist for any occasion. Friends pick gifts anonymously —
          no duplicates, no awkward reveals.
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <FeatureItem icon={<Star />} label="No duplicate gifts — ever" />
        <FeatureItem
          icon={<EyeOff />}
          label="Surprise stays safe — owner can't see who picks what"
        />
        <FeatureItem icon={<Users />} label="Share with one link" />
      </div>
    </div>
  );
}
