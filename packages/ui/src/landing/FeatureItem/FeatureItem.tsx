import type { ReactNode } from "react";

interface FeatureItemProps {
  icon: ReactNode;
  label: string;
}

export function FeatureItem({ icon, label }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#C4797A]/20 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-[#C4797A]">
        {icon}
      </div>
      <span className="text-white/70 text-sm">{label}</span>
    </div>
  );
}
