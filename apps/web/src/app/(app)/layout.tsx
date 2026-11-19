import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";

// Private pages and shared wishlists stay out of search results. Robots.txt
// doesn't block them: link-preview crawlers (WhatsApp, Messenger) obey it
// and would then show no preview.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// The landing page lives outside this group because it places the footer
// inside its own sign-in column.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  );
}
