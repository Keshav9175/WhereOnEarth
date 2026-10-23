"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateUser } from "@/lib/auth-client";
import { USERNAME_HINT, USERNAME_RULES, usernameErrorMessage } from "@/lib/username";
import { ERROR_TEXT, HINT_TEXT, INPUT, LABEL, PRIMARY_BUTTON } from "@/components/formStyles";

type ChooseUsernameFormProps = {
  // Suggested starting value (e.g. the name from Google, cleaned up).
  suggestion: string;
  // Where to go once the username is saved (already checked by safeNextPath).
  next: string;
};

export function ChooseUsernameForm({ suggestion, next }: ChooseUsernameFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(suggestion);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = value.trim();
    setBusy(true);
    setError(null);

    try {
      // `username` is the unique one (the server lowercases it and refuses a taken name);
      // `name` is what the leaderboard, top bar and parties show, so it mirrors the username.
      const result = await updateUser({ username: chosen, displayUsername: chosen, name: chosen });
      if (result.error) {
        setError(usernameErrorMessage(result.error.code, result.error.message ?? "Could not save that username."));
        return;
      }
      router.push(next);
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
        Username
        <input
          className={INPUT}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          minLength={USERNAME_RULES.min}
          maxLength={USERNAME_RULES.max}
          pattern={USERNAME_RULES.pattern.source.slice(1, -1)}
          title={USERNAME_HINT}
          autoComplete="username"
          autoFocus
          aria-describedby="username-hint"
        />
        <span id="username-hint" className="text-xs text-white/55">
          {USERNAME_HINT} Shown on the leaderboard and in parties.
        </span>
      </label>

      {error && (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      )}

      <button className={PRIMARY_BUTTON} type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save username"}
      </button>
      <p className={HINT_TEXT}>Usernames are unique: nobody else can use yours.</p>
    </form>
  );
}
