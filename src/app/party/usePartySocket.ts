"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, PartyView, ServerMessage } from "@/lib/party/protocol";

// Where the party server is (src/party/server.ts). Locally it runs next to the website on port 3001.
const PARTY_URL = process.env.NEXT_PUBLIC_PARTY_URL ?? "ws://localhost:3001";
// This tab's seat in a party, so a refresh can rejoin. sessionStorage = per tab, gone when it closes.
const SEAT_KEY = "woe-party-seat";

type Seat = { code: string; token: string };
export type PartyStatus = "connecting" | "open" | "reconnecting";

function readSeat(): Seat | null {
  try {
    return JSON.parse(sessionStorage.getItem(SEAT_KEY) ?? "null") as Seat | null;
  } catch {
    return null;
  }
}

// One live connection to the party server. It:
// - reconnects by itself when the connection drops (waiting a bit longer after each failure),
// - rejoins your seat after a refresh (the server gave this tab a secret token when you joined),
// - keeps the latest view of the party (the server sends a fresh one after every change),
// - works out the difference between your clock and the server's, so round timers agree.
export function usePartySocket() {
  const [view, setView] = useState<PartyView | null>(null);
  const [status, setStatus] = useState<PartyStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [everConnected, setEverConnected] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<ClientMessage[]>([]);

  useEffect(() => {
    let stopped = false;
    let retries = 0;
    let retryTimer: number | undefined;
    let errorTimer: number | undefined;

    const connect = () => {
      const socket = new WebSocket(PARTY_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        retries = 0;
        setStatus("open");
        setEverConnected(true);
        const seat = readSeat();
        if (seat) socket.send(JSON.stringify({ type: "rejoin", ...seat } satisfies ClientMessage));
        for (const message of queueRef.current.splice(0)) socket.send(JSON.stringify(message));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "state") {
          setView(message.view);
          setClockOffset(message.serverNow - Date.now());
          setClosedMessage(null);
        } else if (message.type === "joined") {
          sessionStorage.setItem(SEAT_KEY, JSON.stringify({ code: message.code, token: message.token }));
          // Make the address shareable without reloading the page.
          window.history.replaceState(null, "", `/party?code=${message.code}`);
        } else if (message.type === "error") {
          setError(message.message);
          window.clearTimeout(errorTimer);
          errorTimer = window.setTimeout(() => setError(null), 5000);
        } else if (message.type === "closed") {
          sessionStorage.removeItem(SEAT_KEY);
          setView(null);
          setClosedMessage(message.message);
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        setStatus("reconnecting");
        retries += 1;
        retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** (retries - 1), 8000));
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.clearTimeout(errorTimer);
      socketRef.current?.close();
    };
  }, []);

  // Sends now, or as soon as the connection is (re)opened.
  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    else queueRef.current.push(message);
  }, []);

  const leave = useCallback(() => {
    send({ type: "leave" });
    sessionStorage.removeItem(SEAT_KEY);
    setView(null);
  }, [send]);

  return { view, status, everConnected, error, closedMessage, clockOffset, send, leave };
}
