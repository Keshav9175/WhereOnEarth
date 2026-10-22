"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn, VERIFIED_CALLBACK_URL } from "@/lib/auth-client";
import { ERROR_TEXT, HINT_TEXT, INPUT, LABEL, PRIMARY_BUTTON, TEXT_LINK } from "@/components/formStyles";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: VERIFIED_CALLBACK_URL,
      });

      // Right password, but the email isn't confirmed yet. The server has just emailed a new link.
      if (result.error?.code === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email first. We've just sent you a new link — check your inbox.");
        return;
      }

      if (result.error) {
        // 5xx = our server broke (e.g. database unreachable) — not the player's fault.
        setError(
          result.error.status >= 500
            ? "Our server had a problem. Please try again in a moment."
            : (result.error.message ?? "Could not sign you in."),
        );
        return;
      }

      router.push("/play");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
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

      <label className={LABEL}>
        Password
        <input
          className={INPUT}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      )}

      <Link href="/forgot-password" className={`${TEXT_LINK} -mt-2 self-end text-sm`}>
        Forgot password?
      </Link>

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className={HINT_TEXT}>
        New here?{" "}
        <Link href="/sign-up" className={TEXT_LINK}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
