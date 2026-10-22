"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

type SignOutButtonProps = {
  className?: string;
};

// A small client component, so server-rendered areas (like the home nav) can still offer "Sign out".
export function SignOutButton({ className = "" }: SignOutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      aria-label="Sign out"
      title="Sign out"
      className={`grid cursor-pointer place-items-center rounded-full disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      <LogOut aria-hidden="true" className="size-5" />
    </button>
  );
}
