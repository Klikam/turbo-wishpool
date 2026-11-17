import { LandingHero } from "@repo/ui";

import { Footer } from "@/components/sections/Footer";

import AuthPage from "./AuthPage";

export default function LandingPage() {
  return (
    <div className="flex-1 bg-background flex flex-col lg:flex-row">
      <LandingHero />
      <div className="lg:w-1/2 flex flex-col">
        <AuthPage />
        <Footer />
      </div>
    </div>
  );
}
