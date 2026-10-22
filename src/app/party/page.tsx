import type { Metadata } from "next";
import { Suspense } from "react";
import { PartyApp } from "./PartyApp";

export const metadata: Metadata = {
  title: "Party — WhereOnEarth",
};

type PageProps = {
  // ?create=1 (from "Create Party"), ?join=1 (from "Join Party"), ?code=123456 (a shared invite link)
  searchParams: Promise<{ create?: string; join?: string; code?: string }>;
};

async function PartyFromLink({ searchParams }: PageProps) {
  const { create, code } = await searchParams;
  const inviteCode = code && /^\d{6}$/.test(code) ? code : null;
  return <PartyApp startWith={inviteCode ? "join" : create ? "create" : "join"} inviteCode={inviteCode} />;
}

// /party — play with friends: create a party or join one with a 6-digit code.
export default function PartyPage(props: PageProps) {
  return (
    <Suspense fallback={<main className="h-dvh" />}>
      <PartyFromLink {...props} />
    </Suspense>
  );
}
