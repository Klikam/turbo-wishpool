'use client';

import type { Mode } from '../types/credentials';

interface CredentialsButtonProps {
  label: string;
  mode: Mode;
  handleModeChange: () => void;
}

export default function CredentialsButton({
  label,
  mode,
  handleModeChange,
}: CredentialsButtonProps) {
  return (
    <button
      onClick={handleModeChange}
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === label.trim().replaceAll(' ', '').toLowerCase() ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {label}
    </button>
  );
}
