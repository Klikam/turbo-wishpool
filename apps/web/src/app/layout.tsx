import type { Metadata } from "next";
import { Figtree, Playfair_Display } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/config";
import { siteOpenGraph } from "@/lib/ogImage";

import "./globals.css";

const description =
  "Create a wishlist for any occasion and share it with one link. Friends pick gifts anonymously — no duplicates, no awkward reveals.";

// Search engines may index the landing page; the (app) layout opts the
// signed-in pages and shared wishlists out.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Wishpool", template: "%s · Wishpool" },
  description,
  openGraph: { ...siteOpenGraph, description },
  twitter: { card: "summary_large_image" },
};

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair-display",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen flex flex-col bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
