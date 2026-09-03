interface OccasionPickerProps {
  occasions: readonly string[];
  value: string;
  onChange: (occasion: string) => void;
}

export function OccasionPicker({
  occasions,
  value,
  onChange,
}: OccasionPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">Occasion</label>
      <div className="grid grid-cols-4 gap-2">
        {occasions.map((occ) => (
          <button
            key={occ}
            onClick={() => {
              onChange(occ);
            }}
            className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors text-center ${
              value === occ
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-[#C4797A]/50"
            }`}
          >
            {occ}
          </button>
        ))}
      </div>
    </div>
  );
}
