import { Footer } from "@/components/sections/Footer";

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
