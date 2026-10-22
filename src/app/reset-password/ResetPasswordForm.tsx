"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { resetPassword } from "@/lib/auth-client";
import {
  ERROR_TEXT,
  HINT_TEXT,
  INPUT,
  LABEL,
  PRIMARY_BUTTON,
  SUCCESS_TEXT,
  TEXT_LINK,
} from "@/components/formStyles";

type ResetPasswordFormProps = {
  // The one-time token from the email link (the page reads it from ?token=…).
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // True when the server rejected the link itself, so we offer a new one.
  const [linkExpired, setLinkExpired] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Checked here only to save a round trip; the server enforces the length rules itself.
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      const result = await resetPassword({ newPassword: password, token });

      if (result.error?.code === "INVALID_TOKEN") {
        setLinkExpired(true);
        setError("This link has expired or was already used.");
        return;
      }

      if (result.error) {
        setError(
          result.error.status >= 500
            ? "Our server had a problem. Please try again in a moment."
            : (result.error.message ?? "Could not change your password."),
        );
        return;
      }

      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex w-full flex-col gap-4" role="status">
        <p className={SUCCESS_TEXT}>
          Your password has been changed. For safety, you&apos;ve been signed out everywhere.
        </p>
        <Link href="/sign-in" className={`${PRIMARY_BUTTON} text-center`}>
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className={LABEL}>
        New password (at least 8 characters)
        <input
          className={INPUT}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <label className={LABEL}>
        Repeat new password
        <input
          className={INPUT}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>

      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}{" "}
          {linkExpired && (
            <Link href="/forgot-password" className={TEXT_LINK}>
              Get a new link
            </Link>
          )}
        </p>
      )}

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </button>

      <p className={HINT_TEXT}>
        <Link href="/sign-in" className={TEXT_LINK}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
