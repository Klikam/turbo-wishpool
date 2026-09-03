import { LandingHero } from "@repo/ui";

import AuthPage from "./AuthPage";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <LandingHero />
      <AuthPage />
    </div>
  );
}
