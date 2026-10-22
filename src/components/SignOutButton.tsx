"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

type SignOutButtonProps = {
  className?: string;
  // Show the words "Sign out" next to the icon (the profile page does).
  showLabel?: boolean;
};

// A small client component, so server-rendered areas (like the home nav) can still offer "Sign out".
export function SignOutButton({ className = "", showLabel = false }: SignOutButtonProps) {
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
      aria-label={showLabel ? undefined : "Sign out"}
      title="Sign out"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      <LogOut aria-hidden="true" className="size-5" />
      {showLabel && (busy ? "Signing out…" : "Sign out")}
    </button>
  );
}
