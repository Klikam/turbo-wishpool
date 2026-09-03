interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  compact?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  compact = false,
}: TextFieldProps) {
  const id = label.trim().replaceAll(" ", "").toLowerCase();
  return (
    <div>
      <label
        htmlFor={id}
        className={`block text-sm font-medium ${compact ? "mb-1" : "mb-1.5"}`}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`w-full text-sm outline-none border border-border focus:border-[#C4797A] transition-colors ${
          compact
            ? "px-3 py-2.5 rounded-lg bg-input-background"
            : "px-4 py-3 rounded-xl bg-card"
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </div>
  );
}
