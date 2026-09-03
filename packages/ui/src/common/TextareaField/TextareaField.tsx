interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: TextareaFieldProps) {
  const id = label.trim().replaceAll(" ", "").toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm outline-none focus:border-[#C4797A] transition-colors resize-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </div>
  );
}
