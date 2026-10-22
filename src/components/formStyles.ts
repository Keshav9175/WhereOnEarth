// Tailwind class lists shared by every form, so all forms look the same.
// Change a style here and it updates everywhere. Forms sit on the dark ocean background.

export const LABEL = "flex flex-col gap-1.5 text-sm font-medium text-white/80";

export const INPUT =
  "rounded-xl border border-white/20 bg-slate-950/40 px-3.5 py-2.5 text-base text-white placeholder:text-white/40 focus-visible:border-amber-300 focus-visible:outline-2 focus-visible:outline-amber-300/60";

export const PRIMARY_BUTTON =
  "cursor-pointer rounded-xl bg-amber-400 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-amber-900/30 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const ERROR_TEXT = "rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200";

export const SUCCESS_TEXT = "rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100";

export const HINT_TEXT = "text-sm text-white/70";

export const TEXT_LINK = "font-semibold text-amber-300 underline-offset-4 hover:underline";
