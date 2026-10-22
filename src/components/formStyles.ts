// Tailwind class lists shared by every form, so all forms look the same.
// Change a style here and it updates everywhere. Forms sit on the dark ocean background.

export const LABEL = "flex flex-col gap-1.5 text-sm font-medium text-white/80";

export const INPUT =
  "rounded-xl border border-white/20 bg-slate-950/40 px-3.5 py-2.5 text-base text-white placeholder:text-white/40 focus-visible:border-amber-300 focus-visible:outline-2 focus-visible:outline-amber-300/60";

// The main-action colour everywhere: the same blue gradient as the active navbar pill.
export const PRIMARY_FILL =
  "bg-gradient-to-b from-sky-500 to-blue-700 text-white shadow-lg shadow-blue-900/50 hover:from-sky-400 hover:to-blue-600";

export const PRIMARY_BUTTON = `cursor-pointer rounded-xl px-5 py-3 text-base font-bold ${PRIMARY_FILL} disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;

export const ERROR_TEXT = "rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200";

export const SUCCESS_TEXT = "rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100";

export const HINT_TEXT = "text-sm text-white/70";

export const TEXT_LINK = "font-semibold text-amber-300 underline-offset-4 hover:underline";
