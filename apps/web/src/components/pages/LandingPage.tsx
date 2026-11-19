import { LandingHero } from "@repo/ui";

import { Footer } from "@/components/sections/Footer";

import AuthPage from "./AuthPage";

interface LandingPageProps {
  /** Where to go once signed in. */
  callbackURL?: string;
}

export default function LandingPage({ callbackURL }: LandingPageProps) {
  return (
    <div className="flex-1 bg-background flex flex-col lg:flex-row">
      <LandingHero />
      <div className="lg:w-1/2 flex flex-col">
        <AuthPage callbackURL={callbackURL} />
        <Footer />
      </div>
    </div>
  );
}
