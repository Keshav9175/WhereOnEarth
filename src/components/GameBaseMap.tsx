"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { DomUtil, tileLayer, type Layer, type Map as LeafletMap } from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { OPENFREEMAP_STYLE_URL, toGameStyle } from "@/lib/map/gameMapStyle";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map/tiles";

// MapLibre draws the map in a background "worker" script. After bundling it can't find that file by
// itself, so we serve a copy from public/ (scripts/copy-maplibre-worker.mjs) and point it there.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// The style is downloaded once and shared by every map on the page (guess, result, summary).
let gameStylePromise: Promise<StyleSpecification> | null = null;
function loadGameStyle() {
  gameStylePromise ??= fetch(OPENFREEMAP_STYLE_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Map style: HTTP ${response.status}`);
      return response.json() as Promise<StyleSpecification>;
    })
    .then(toGameStyle)
    .catch((error: unknown) => {
      gameStylePromise = null; // let the next map try again
      throw error;
    });
  return gameStylePromise;
}

// The add-on's private parts we touch below (not in its TypeScript types).
type MaplibreLayerInternals = {
  _map: LeafletMap | null;
  _glMap: { _actualCanvas: HTMLElement; once(type: string, listener: () => void): void; jumpTo(options: object): void };
  _resizeContainer(): void;
  _zoomEnd(): void;
  _transitionEnd(event?: unknown): void;
};

// Bug in @maplibre/maplibre-gl-leaflet 0.1.4 (latest): after a resize/zoom transition it waits one
// animation frame and then reads `this._map` — but if the map was removed in that frame (e.g. a new
// game starts when the player switches maps), `_map` is null and it throws "reading 'getZoom'".
// These two replacements are the library's own code (ISC licence) plus a "still on a map?" check.
function guardAgainstLateFrames(layer: Layer) {
  const internals = layer as unknown as MaplibreLayerInternals;
  const zoomEnd = internals._zoomEnd;

  internals._zoomEnd = function () {
    if (internals._map) zoomEnd.call(internals);
  };

  internals._transitionEnd = function () {
    requestAnimationFrame(() => {
      const map = internals._map;
      if (!map) return;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const offset = map.latLngToContainerPoint(map.getBounds().getNorthWest());
      internals._resizeContainer();
      DomUtil.setTransform(internals._glMap._actualCanvas, offset, 1);
      internals._glMap.once("moveend", () => internals._zoomEnd());
      internals._glMap.jumpTo({ center, zoom: zoom - 1 });
    });
  };
}

// The map's background, placed inside a react-leaflet <MapContainer>. MapLibre draws OpenFreeMap's
// vector map underneath Leaflet, so our clicks, pins and lines keep working exactly as before.
// If OpenFreeMap can't be reached, it falls back to plain image tiles (src/lib/map/tiles.ts).
export function GameBaseMap() {
  const map = useMap();

  useEffect(() => {
    let layer: Layer | null = null;
    let removed = false;

    loadGameStyle()
      .then((style) => {
        if (removed) return;
        const vectorLayer = maplibreGL({ style });
        guardAgainstLateFrames(vectorLayer);
        layer = vectorLayer.addTo(map);
      })
      .catch(() => {
        if (!removed) layer = tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION }).addTo(map);
      });

    return () => {
      removed = true;
      layer?.remove();
    };
  }, [map]);

  return null;
}
