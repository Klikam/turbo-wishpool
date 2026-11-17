interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  const id = label.trim().replaceAll(" ", "").toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <select
        id={id}
        className="w-full text-sm outline-none border border-border focus:border-[#C4797A] transition-colors px-4 py-3 rounded-xl bg-card"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
