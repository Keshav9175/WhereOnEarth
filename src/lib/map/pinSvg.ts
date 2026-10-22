// Map pins as SVG text, so any map library can use them (Google advanced markers, Leaflet div icons).
// Look: a rounded teardrop with a soft light-to-dark gradient and a small gloss highlight (it reads as
// a real 3D pin), NO white outline, and a soft shadow on the GROUND under the tip — so the pin looks
// planted on the map instead of floating above it.

// The pin is drawn on a 34×50 grid (viewBox) and shown at 80% of that, so it's noticeable without
// hiding the map around it. Change PIN_SCALE to resize every pin in the game.
const PIN_SCALE = 0.8;
export const PIN_WIDTH = Math.round(34 * PIN_SCALE);
export const PIN_HEIGHT = Math.round(50 * PIN_SCALE);
// The tip of the pin (in displayed pixels, from the top). The ground shadow sits just below it, so map
// libraries must anchor the pin at the TIP, not at the bottom edge of the picture.
const TIP_IN_GRID = 45;
export const PIN_TIP_Y = Math.round(TIP_IN_GRID * PIN_SCALE);

type PinColors = { id: string; light: string; base: string; dark: string };

const GUESS: PinColors = { id: "guess", light: "#60a5fa", base: "#2563eb", dark: "#1e3a8a" }; // blue
const ANSWER: PinColors = { id: "answer", light: "#4ade80", base: "#16a34a", dark: "#14532d" }; // green

const BODY = "M17 1C8.2 1 1 8 1 16.8 1 28.6 17 45 17 45s16-16.4 16-28.2C33 8 25.8 1 17 1z";

function pinSvg(colors: PinColors, symbol: string) {
  // Gradient/filter ids are per colour, so blue and green pins on the same page never mix them up.
  const gradient = `pin-fill-${colors.id}`;
  return `<svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 34 50" style="display:block;overflow:visible">
      <defs>
        <linearGradient id="${gradient}" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="${colors.light}"/>
          <stop offset="0.55" stop-color="${colors.base}"/>
          <stop offset="1" stop-color="${colors.dark}"/>
        </linearGradient>
        <filter id="pin-ground-blur" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="1.4"/>
        </filter>
      </defs>
      <ellipse cx="17" cy="${TIP_IN_GRID}" rx="7.5" ry="2.6" fill="black" opacity="0.35" filter="url(#pin-ground-blur)"/>
      <path d="${BODY}" fill="url(#${gradient})" stroke="${colors.dark}" stroke-opacity="0.55" stroke-width="1"/>
      <ellipse cx="11.5" cy="9" rx="5" ry="3.2" fill="white" opacity="0.28" transform="rotate(-25 11.5 9)"/>
      ${symbol}
    </svg>`;
}

const DOT = '<circle cx="17" cy="16.5" r="5.2" fill="white"/>';
const FLAG =
  '<path d="M12.5 9.5v15" stroke="white" stroke-width="2.2" stroke-linecap="round"/><path d="M13.5 10h9.5l-2.6 3.6 2.6 3.6h-9.5z" fill="white"/>';
const number = (n: number) =>
  `<text x="17" y="21.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="white">${n}</text>`;

export const GUESS_PIN_SVG = pinSvg(GUESS, DOT);
export const ANSWER_PIN_SVG = pinSvg(ANSWER, FLAG);

// Numbered pins for the end-of-game map: "3" in blue = your guess in round 3, in green = the answer.
export const numberedGuessPinSvg = (round: number) => pinSvg(GUESS, number(round));
export const numberedAnswerPinSvg = (round: number) => pinSvg(ANSWER, number(round));
