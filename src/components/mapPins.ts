import { divIcon } from "leaflet";
import {
  ANSWER_PIN_SVG,
  GUESS_PIN_SVG,
  numberedAnswerPinSvg,
  numberedGuessPinSvg,
  PIN_HEIGHT,
  PIN_TIP_Y,
  PIN_WIDTH,
} from "@/lib/map/pinSvg";

// Leaflet versions of our pins (the artwork lives in src/lib/map/pinSvg.ts). Built as "divIcons" (plain
// HTML) instead of Leaflet's default image pin, whose image files bundlers like Next.js can't find.
// Leaflet needs `window`, so only import this from browser-only maps (loaded with ssr: false).
function pinIcon(html: string) {
  return divIcon({
    className: "", // removes Leaflet's default white box behind div icons
    iconSize: [PIN_WIDTH, PIN_HEIGHT],
    iconAnchor: [PIN_WIDTH / 2, PIN_TIP_Y], // the tip of the pin sits exactly on the point
    html,
  });
}

export const GUESS_PIN = pinIcon(GUESS_PIN_SVG);
export const ANSWER_PIN = pinIcon(ANSWER_PIN_SVG);

export const numberedGuessPin = (round: number) => pinIcon(numberedGuessPinSvg(round));
export const numberedAnswerPin = (round: number) => pinIcon(numberedAnswerPinSvg(round));
