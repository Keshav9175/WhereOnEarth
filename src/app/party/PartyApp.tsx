"use client";

import Link from "next/link";
import { LoaderCircle, ServerCrash } from "lucide-react";
import { GLASS_PANEL } from "@/components/PageShell";
import { PartyEntry } from "./PartyEntry";
import { PartyGame } from "./PartyGame";
import { PartyLobby } from "./PartyLobby";
import { usePartySocket } from "./usePartySocket";

type PartyAppProps = {
  startWith: "create" | "join";
  inviteCode: string | null;
};

// The whole party experience on one page: connect → choose/join → lobby → game. The live connection
// (usePartySocket) stays open the whole time; the screen follows the party's phase sent by the server.
export function PartyApp({ startWith, inviteCode }: PartyAppProps) {
  const { view, status, everConnected, error, closedMessage, clockOffset, send, leave } = usePartySocket();

  // The party server can't be reached (in development: it isn't running).
  if (!view && status !== "open") {
    return (
      <div className="grid min-h-dvh place-items-center p-4">
        <section className={`flex max-w-md flex-col items-center gap-3 p-6 text-center ${GLASS_PANEL}`} aria-live="polite">
          {everConnected || status === "connecting" ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-amber-300" />
              <p className="text-lg font-semibold">{everConnected ? "Reconnecting…" : "Connecting to the party server…"}</p>
            </>
          ) : (
            <>
              <ServerCrash aria-hidden="true" className="size-8 text-rose-300" />
              <p className="text-lg font-semibold">Can&apos;t reach the party server</p>
              <p className="text-sm text-white/70">
                It may be starting up — we keep trying. (Developers: run <code className="text-amber-300">npm run party</code>.)
              </p>
            </>
          )}
          <Link href="/" className="text-sm text-amber-300 hover:underline">
            Back to home
          </Link>
        </section>
      </div>
    );
  }

  if (!view) {
    // After a party ends (e.g. the host left), its code is dead: start from an empty Join screen.
    return (
      <PartyEntry
        key={closedMessage ?? "entry"}
        startWith={closedMessage ? "join" : startWith}
        inviteCode={closedMessage ? null : inviteCode}
        send={send}
        error={error}
        notice={closedMessage}
      />
    );
  }

  if (view.phase === "lobby") {
    return <PartyLobby view={view} send={send} onLeave={leave} error={error} />;
  }

  return <PartyGame view={view} send={send} onLeave={leave} clockOffset={clockOffset} error={error} />;
}
