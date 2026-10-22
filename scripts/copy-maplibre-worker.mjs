// Copies MapLibre's background "worker" script into public/, so the browser can load it from
// /maplibre/maplibre-gl-worker.mjs. Next.js's bundler doesn't serve this file on its own, and without
// it MapLibre can't draw the map (D-021). Runs automatically after `npm install` and before `npm run build`,
// so the copy always matches the installed MapLibre version.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const source = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist", "maplibre-gl-worker.mjs");
const targetDir = path.join(process.cwd(), "public", "maplibre");

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, path.join(targetDir, "maplibre-gl-worker.mjs"));
console.log("Copied the MapLibre worker to public/maplibre/");
