import type { UseFormRegister } from 'react-hook-form';
import type { Credentials } from '../types/credentials';

interface CredentialsFieldProps {
  label: string;
  field: keyof Credentials;
  placeholder: string;
  type: React.HTMLInputTypeAttribute;
  register: UseFormRegister<Credentials>;
}

export default function CredentialsField({
  label,
  field,
  placeholder,
  type,
  register,
}: CredentialsFieldProps) {
  const id = label.trim().replaceAll(' ', '').toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-sm outline-none focus:border-[#C4797A] transition-colors"
        placeholder={placeholder}
        {...register(field)}
      />
    </div>
  );
}
