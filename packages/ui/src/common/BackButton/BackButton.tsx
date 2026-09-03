"use client";

import { ChevronRight } from "lucide-react";

interface BackButtonProps {
  label?: string;
  onClick: () => void;
}

export function BackButton({ label = "Back", onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronRight className="w-4 h-4 rotate-180" />
      {label}
    </button>
  );
}
