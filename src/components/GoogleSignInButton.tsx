"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { ERROR_TEXT } from "./formStyles";

type GoogleSignInButtonProps = {
  // Where to send the player after Google signs them in.
  callbackURL?: string;
};

export function GoogleSignInButton({ callbackURL = "/play" }: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const result = await signIn.social({ provider: "google", callbackURL });
      if (result.error) {
        setError(result.error.message ?? "Could not start Google sign-in.");
        setBusy(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-black/20 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
        </svg>
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
