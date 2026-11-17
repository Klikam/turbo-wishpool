import { SignInForm } from "@/components/sections/SignInForm";

export default function AuthPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h2 className="font-['Playfair_Display'] text-3xl font-semibold text-foreground mb-2">
            Sign in
          </h2>
          <p className="text-muted-foreground text-sm">
            Use a social account to get started instantly.
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}
