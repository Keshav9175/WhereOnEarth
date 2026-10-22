"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { ERROR_TEXT, INPUT, LABEL } from "@/components/formStyles";
import { GLASS_PANEL } from "@/components/PageShell";
import { useSession } from "@/lib/auth-client";
import type { ClientMessage } from "@/lib/party/protocol";
import { PRIMARY_BUTTON } from "../play/gameStyles";

const NAME_KEY = "woe-party-name"; // remembered on this device for next time

type PartyEntryProps = {
  startWith: "create" | "join";
  inviteCode: string | null;
  send: (message: ClientMessage) => void;
  error: string | null;
  notice: string | null; // e.g. "The host removed you from the party."
};

// Before you're in a party: choose Create or Join, pick a name (guests) and type the code (join).
export function PartyEntry({ startWith, inviteCode, send, error, notice }: PartyEntryProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState(startWith);
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [code, setCode] = useState(inviteCode ?? "");
  const [sent, setSent] = useState(false);

  // Signed-in players play under their account name (the server uses it); guests type one.
  const playerName = session?.user.name ?? name.trim();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!playerName) return;
    try {
      if (!session) localStorage.setItem(NAME_KEY, playerName);
    } catch {
      // Private mode: fine, we just won't remember the name.
    }
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
    // Signed-in players fetch a signed pass from our website, which proves their account to the party
    // server (it's on another site, so it can't read our login cookie). Guests skip this.
    let ticket: string | undefined;
    if (session) {
      try {
        const response = await fetch("/api/party/ticket", { cache: "no-store" });
        if (response.ok) ticket = ((await response.json()) as { ticket: string }).ticket;
      } catch {
        // No pass: join as a guest under the account name instead of failing.
      }
    }
    send(tab === "create" ? { type: "create", name: playerName, ticket } : { type: "join", code, name: playerName, ticket });
  }

  const tabClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition ${
      active ? "bg-gradient-to-b from-sky-500 to-blue-700 text-white shadow-lg" : "text-white/75 hover:bg-white/10"
    }`;

  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <section className={`flex w-full max-w-md flex-col gap-5 p-6 sm:p-8 ${GLASS_PANEL}`}>
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-white">
          <ArrowLeft aria-hidden="true" className="size-4" /> Home
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Play with friends</h1>
          <p className="mt-1 text-white/70">Same places, same time — who knows the world best?</p>
        </div>

        <div role="tablist" className="flex gap-1 rounded-2xl bg-slate-950/40 p-1.5 ring-1 ring-white/10">
          <button type="button" role="tab" aria-selected={tab === "create"} onClick={() => setTab("create")} className={tabClass(tab === "create")}>
            <UserPlus aria-hidden="true" className="size-4" /> Create party
          </button>
          <button type="button" role="tab" aria-selected={tab === "join"} onClick={() => setTab("join")} className={tabClass(tab === "join")}>
            <LogIn aria-hidden="true" className="size-4" /> Join party
          </button>
        </div>

        {notice && <p className={ERROR_TEXT}>{notice}</p>}

        <form onSubmit={submit} className="flex flex-col gap-4">
          {session ? (
            <p className="text-sm text-white/75">
              Playing as <strong className="text-white">{session.user.name}</strong>
            </p>
          ) : (
            <label className={LABEL}>
              Your name
              <input
                className={INPUT}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={20}
                required
                autoComplete="nickname"
                placeholder="e.g. Explorer42"
              />
            </label>
          )}

          {tab === "join" && (
            <label className={LABEL}>
              Party code
              <input
                className={`${INPUT} text-center text-2xl font-bold tracking-[0.4em]`}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                pattern="\d{6}"
                required
                placeholder="000000"
                aria-describedby="code-help"
              />
              <span id="code-help" className="text-xs text-white/55">
                Ask the host for the 6-digit code (or open their invite link).
              </span>
            </label>
          )}

          {error && (
            <p className={ERROR_TEXT} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sent || !playerName || (tab === "join" && code.length !== 6)}
            className={`${PRIMARY_BUTTON} w-full`}
          >
            {sent ? "Connecting…" : tab === "create" ? "Create party" : "Join party"}
          </button>
        </form>
      </section>
    </div>
  );
}
