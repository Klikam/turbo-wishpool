import type { ReactNode } from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  action?: EmptyStateAction;
  bordered?: boolean;
}

export function EmptyState({
  icon,
  message,
  action,
  bordered = false,
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-20 text-muted-foreground ${
        bordered ? "border border-dashed border-border rounded-2xl py-24" : ""
      }`}
    >
      <div className="w-10 h-10 mx-auto mb-3 opacity-30 [&>svg]:w-10 [&>svg]:h-10">
        {icon}
      </div>
      <p className="text-sm mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-[#3a1232] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
