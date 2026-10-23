// Map pins as SVG text, so any map library can use them (Google advanced markers, Leaflet div icons).
// Look: a flat, solid-colour teardrop with a white badge in its head; the label (dot, flag, round number
// or a player's initial) sits on the badge in the pin's colour, so it stays crisp on any colour. No gloss,
// no gradient, no white outline — depth comes from a soft drop shadow and a blurred shadow on the GROUND
// under the tip, so the pin looks planted on the map instead of floating above it.

// The pin is drawn on a 34×50 grid (viewBox) and shown at 80% of that, so it's noticeable without
// hiding the map around it. Change PIN_SCALE to resize every pin in the game.
const PIN_SCALE = 0.8;
export const PIN_WIDTH = Math.round(34 * PIN_SCALE);
export const PIN_HEIGHT = Math.round(50 * PIN_SCALE);
// The tip of the pin (in displayed pixels, from the top). The ground shadow sits just below it, so map
// libraries must anchor the pin at the TIP, not at the bottom edge of the picture.
const TIP_IN_GRID = 45;
export const PIN_TIP_Y = Math.round(TIP_IN_GRID * PIN_SCALE);

const GUESS_COLOR = "#2563eb"; // blue
const ANSWER_COLOR = "#16a34a"; // green

// A round head (centre 17,16, radius 14) narrowing to the tip at the bottom.
const BODY = `M17 ${TIP_IN_GRID}C17 ${TIP_IN_GRID} 3 29.5 3 16a14 14 0 0 1 28 0c0 13.5-14 29-14 29z`;
const BADGE = { x: 17, y: 16, r: 9.5 };

// `label` draws on the white badge, given the pin's colour.
function pinSvg(id: string, color: string, label: (color: string) => string) {
  // The filter ids are per pin kind, so pins on the same page never mix up their definitions.
  return `<svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 34 50" style="display:block;overflow:visible">
      <defs>
        <filter id="pin-ground-${id}" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="1.4"/>
        </filter>
        <filter id="pin-drop-${id}" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.3" flood-color="#0f172a" flood-opacity="0.35"/>
        </filter>
      </defs>
      <ellipse cx="17" cy="${TIP_IN_GRID}" rx="6.5" ry="2.2" fill="black" opacity="0.3" filter="url(#pin-ground-${id})"/>
      <path d="${BODY}" fill="${color}" filter="url(#pin-drop-${id})"/>
      <circle cx="${BADGE.x}" cy="${BADGE.y}" r="${BADGE.r}" fill="white"/>
      ${label(color)}
    </svg>`;
}

// Text inherits the page font (Figtree), so pins match the rest of the game.
const text = (value: string | number, size: number) => (color: string) =>
  `<text x="${BADGE.x}" y="${BADGE.y}" text-anchor="middle" dominant-baseline="central" style="font-family:inherit" font-size="${size}" font-weight="800" fill="${color}">${value}</text>`;
const DOT = (color: string) =>
  `<circle cx="${BADGE.x}" cy="${BADGE.y}" r="4" fill="${color}"/>`;
const FLAG = (color: string) =>
  `<path d="M14 11v10.5" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M14.8 11.2h6.4l-1.8 2.5 1.8 2.5h-6.4z" fill="${color}"/>`;

export const GUESS_PIN_SVG = pinSvg("guess", GUESS_COLOR, DOT);
export const ANSWER_PIN_SVG = pinSvg("answer", ANSWER_COLOR, FLAG);

// Party games: one pin per player, in that player's colour, with their initial.
export function playerPinSvg(color: string, initial: string, id: string) {
  const safe =
    initial
      .replace(/[^\p{L}\p{N}]/gu, "")
      .slice(0, 1)
      .toUpperCase() || "?";
  const safeColor = /^#[0-9a-f]{3,8}$/i.test(color) ? color : GUESS_COLOR;
  return pinSvg(
    `player-${id.replace(/[^\w-]/g, "")}`,
    safeColor,
    text(safe, 11),
  );
}

// Numbered pins for the end-of-game map: "3" in blue = your guess in round 3, in green = the answer.
export const numberedGuessPinSvg = (round: number) =>
  pinSvg(`guess-${round}`, GUESS_COLOR, text(round, 11));
export const numberedAnswerPinSvg = (round: number) =>
  pinSvg(`answer-${round}`, ANSWER_COLOR, text(round, 11));
