// The first-visit intro video (D-025). Shared by the root layout (inline script) and IntroVideo.
// A plain module, not "use client": a server component (the layout) can only import real values
// from files like this one.

// Two renders of the same intro. The video fills the screen (object-fit: cover), so the logo is kept in a
// "safe area": the landscape file still shows it fully on a 4:3 screen, the portrait file on a tall phone.
export const INTRO_VIDEO_LANDSCAPE = "/intro.mp4"; // 1920x1080
export const INTRO_VIDEO_PORTRAIT = "/intro-portrait.mp4"; // 1080x1920

// Saved in the browser once the intro has played, so it only shows on a player's first visit.
export const INTRO_SEEN_KEY = "whereonearth:intro-seen";

// Set on <html> as data-intro="play" when the intro should show. CSS (the `intro:` variant in
// globals.css) reveals the black intro screen from the very first paint, so the home page never flashes.
export const INTRO_ATTRIBUTE = "data-intro";

// Runs in <head> before anything is painted (see Next.js docs: "Preventing flash before hydration").
// Only on the home page, only the first time, and never for players who asked their system for
// reduced motion. try/catch: localStorage can be blocked (private mode, strict privacy settings).
export const INTRO_INLINE_SCRIPT = `(function(){try{
if(location.pathname!=="/")return;
if(localStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)}))return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
document.documentElement.setAttribute(${JSON.stringify(INTRO_ATTRIBUTE)},"play");
}catch(e){}})()`;
