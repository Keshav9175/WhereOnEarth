"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signUp, VERIFIED_CALLBACK_URL } from "@/lib/auth-client";
import { USERNAME_HINT, USERNAME_RULES, usernameErrorMessage } from "@/lib/username";
import {
  ERROR_TEXT,
  HINT_TEXT,
  INPUT,
  LABEL,
  PRIMARY_BUTTON,
  SUCCESS_TEXT,
  TEXT_LINK,
} from "@/components/formStyles";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The address we just emailed; once set, the form is replaced by "check your inbox".
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // The username must be unique (the server checks); `name` (shown everywhere) mirrors it.
      const result = await signUp.email({
        name: name.trim(),
        username: name.trim(),
        displayUsername: name.trim(),
        email: email.trim(),
        password,
        callbackURL: VERIFIED_CALLBACK_URL,
      });

      if (result.error?.code?.startsWith("USERNAME") || result.error?.code === "INVALID_USERNAME") {
        setError(usernameErrorMessage(result.error.code, result.error.message ?? "That username can't be used."));
        return;
      }

      if (result.error) {
        // 5xx = our server broke (e.g. database unreachable) — not the player's fault.
        setError(
          result.error.status >= 500
            ? "Our server had a problem. Please try again in a moment."
            : (result.error.message ?? "Could not create your account."),
        );
        return;
      }

      // No session yet: the account only works after the email link is clicked.
      setSentTo(email.trim());
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex w-full flex-col gap-4" role="status">
        <p className={SUCCESS_TEXT}>
          Check your inbox! We sent a verification link to <strong>{sentTo}</strong>. Click it
          within 1 hour to activate your account.
        </p>
        <p className={HINT_TEXT}>
          No email? Check your spam folder, or{" "}
          <Link href="/sign-in" className={TEXT_LINK}>
            sign in
          </Link>{" "}
          with your email and password to get a new link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className={LABEL}>
        Username (shown on the leaderboard and in parties)
        <input
          className={INPUT}
          type="text"
          autoComplete="username"
          required
          minLength={USERNAME_RULES.min}
          maxLength={USERNAME_RULES.max}
          pattern={USERNAME_RULES.pattern.source.slice(1, -1)}
          title={USERNAME_HINT}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

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

      <label className={LABEL}>
        Password (at least 8 characters)
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

      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      )}

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className={HINT_TEXT}>
        Already have an account?{" "}
        <Link href="/sign-in" className={TEXT_LINK}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
