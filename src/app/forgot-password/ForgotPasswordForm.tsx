"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { RESET_PASSWORD_URL, requestPasswordReset } from "@/lib/auth-client";
import {
  ERROR_TEXT,
  HINT_TEXT,
  INPUT,
  LABEL,
  PRIMARY_BUTTON,
  SUCCESS_TEXT,
  TEXT_LINK,
} from "@/components/formStyles";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await requestPasswordReset({ email: email.trim(), redirectTo: RESET_PASSWORD_URL });

      if (result.error) {
        setError(
          result.error.status >= 500
            ? "Our server had a problem. Please try again in a moment."
            : (result.error.message ?? "Could not send the reset email."),
        );
        return;
      }

      // Same message whether or not the account exists, so nobody can test which emails are registered.
      setSent(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex w-full flex-col gap-4" role="status">
        <p className={SUCCESS_TEXT}>
          If an account exists for <strong>{email.trim()}</strong>, we&apos;ve emailed it a link to
          choose a new password. The link works for 1 hour.
        </p>
        <p className={HINT_TEXT}>
          No email? Check your spam folder. Signed up with Google? Just use{" "}
          <Link href="/sign-in" className={TEXT_LINK}>
            Continue with Google
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className={LABEL}>
        Email
        <input
          className={INPUT}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      )}

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>

      <p className={HINT_TEXT}>
        Remembered it?{" "}
        <Link href="/sign-in" className={TEXT_LINK}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
