import { SignInForm } from "@/components/sections/SignInForm";

interface AuthPageProps {
  /** Where to go once signed in. */
  callbackURL?: string;
}

export default function AuthPage({ callbackURL }: AuthPageProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">
            Sign in
          </h2>
          <p className="text-muted-foreground text-sm">
            Use a social account to get started instantly.
          </p>
        </div>

        <SignInForm callbackURL={callbackURL} />
      </div>
    </div>
  );
}
