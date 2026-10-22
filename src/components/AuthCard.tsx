import type { ReactNode } from "react";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GLASS_PANEL } from "./PageShell";

type AuthCardProps = {
  title: string;
  subtitle: string;
  // Sign-in / sign-up offer Google; the password-reset pages don't (Google accounts have no password).
  showGoogle?: boolean;
  // The email form shown under the Google button.
  children: ReactNode;
};

// The centred glass card shared by the account pages: heading, (Google button + divider), form.
export function AuthCard({ title, subtitle, showGoogle = true, children }: AuthCardProps) {
  return (
    <div className="grid flex-1 place-items-center pb-8">
      <section className={`flex w-full max-w-md flex-col gap-6 p-6 sm:p-8 ${GLASS_PANEL}`}>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-white/70">{subtitle}</p>
        </div>

        {showGoogle && (
          <>
            <GoogleSignInButton />

            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="h-px flex-1 bg-white/15" />
              or use email
              <span className="h-px flex-1 bg-white/15" />
            </div>
          </>
        )}

        {children}
      </section>
    </div>
  );
}
