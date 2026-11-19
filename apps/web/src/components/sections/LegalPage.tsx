import Link from "next/link";
import { ChevronLeft, Gift } from "lucide-react";
import { Footer } from "@/components/sections/Footer";

interface LegalPageProps {
  title: string;
  /** E.g. "19 November 2026". */
  updated: string;
  children: React.ReactNode;
}

/** Layout for the terms and privacy pages. */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border bg-card/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Wishpool
          </Link>
          <Gift className="w-4 h-4 text-[#C4797A]" />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated {updated}
        </p>
        <div className="flex flex-col gap-8 text-sm leading-relaxed text-foreground/90 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/** Marks text the site owner still has to write or review. */
export function DraftNotice() {
  return (
    <p className="rounded-lg border border-[#C4797A]/40 bg-[#C4797A]/10 px-4 py-3 text-sm">
      <strong>Draft.</strong> This page is a placeholder and isn&apos;t legal
      advice. Replace it with your own reviewed text before launch.
    </p>
  );
}
