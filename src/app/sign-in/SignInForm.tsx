"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/auth-client";
import { INPUT, LABEL, PRIMARY_BUTTON } from "@/components/formStyles";

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
      const result = await signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(result.error.message ?? "Could not sign you in.");
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
        <p className="text-error" role="alert">
          {error}
        </p>
      )}

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/sign-up" className="text-primary underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
