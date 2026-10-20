"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signUp } from "@/lib/auth-client";
import { INPUT, LABEL, PRIMARY_BUTTON } from "@/components/formStyles";



export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Could not create your account.");
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
        Display name (shown on the leaderboard)
        <input
          className={INPUT}
          type="text"
          autoComplete="nickname"
          required
          maxLength={40}
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
        <p className="text-error" role="alert">
          {error}
        </p>
      )}

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
