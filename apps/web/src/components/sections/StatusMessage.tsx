import { Gift } from "lucide-react";

interface StatusMessageProps {
  title: string;
  message: string;
  children?: React.ReactNode;
}

/** Full-page message for errors and missing pages, with the actions below it. */
export function StatusMessage({ title, message, children }: StatusMessageProps) {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
          <Gift className="w-6 h-6 text-[#C4797A]" />
        </div>
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      </div>
    </main>
  );
}

export const primaryActionClassName =
  "px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors";

export const secondaryActionClassName =
  "px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors";
