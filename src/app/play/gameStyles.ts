import { PRIMARY_FILL } from "@/components/formStyles";

// Shared look of the game screens: same as the home screen — dark glass panels, blue main button.
export const GLASS = "rounded-2xl border border-white/15 bg-slate-950/60 shadow-xl backdrop-blur-md";

export const PRIMARY_BUTTON = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold ${PRIMARY_FILL} disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white`;

export const SECONDARY_BUTTON =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white ring-1 ring-white/30 hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300";
