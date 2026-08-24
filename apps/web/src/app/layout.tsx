import type { Metadata } from "next";
import { Figtree, Playfair_Display } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wishpool",
  description:
    "Create and manage personalized gift wishlists while preventing duplicates, allowing friends to anonymously claim gifts for special occasions.",
  robots: "noindex, nofollow",
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
