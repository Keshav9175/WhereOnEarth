import type { Metadata } from "next";
import { PlayGame } from "./PlayGame";

export const metadata: Metadata = {
  title: "Play — WhereOnEarth",
};

// /play — the game screen. The interactive part lives in a client component.
export default function PlayPage() {
  return <PlayGame />;
}
