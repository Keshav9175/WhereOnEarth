import type { StyleSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { toGameStyle } from "./gameMapStyle";

// A tiny stand-in for the real Liberty style, with one layer of each kind we care about.
const style = {
  version: 8,
  sources: {},
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#f8f4f0" } },
    { id: "natural_earth", type: "raster", source: "ne2_shaded" },
    { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": "rgb(158,189,255)" } },
    {
      id: "label_country",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      layout: { "text-field": ["concat", ["get", "name:latin"], "\n", ["get", "name:nonlatin"]] },
    },
    { id: "road_shield", type: "symbol", source: "openmaptiles", "source-layer": "transportation_name", layout: { "text-field": ["to-string", ["get", "ref"]] } },
  ],
} as StyleSpecification;

describe("toGameStyle", () => {
  const result = toGameStyle(style);
  const layer = (id: string) => result.layers.find((l) => l.id === id) as unknown as Record<string, Record<string, unknown>>;

  it("paints the sea bright blue and the land light", () => {
    expect(layer("water").paint["fill-color"]).toBe("#5cc6e3");
    expect(layer("background").paint["background-color"]).toBe("#f5f3ee");
  });

  it("shows place names in Latin letters only", () => {
    expect(JSON.stringify(layer("label_country").layout["text-field"])).not.toContain("nonlatin");
    expect(layer("label_country").layout["text-field"]).toEqual([
      "coalesce",
      ["get", "name_en"],
      ["get", "name:latin"],
      ["get", "name"],
    ]);
  });

  it("keeps the terrain picture strong until zoomed in close", () => {
    expect(layer("natural_earth").paint["raster-opacity"]).toEqual(["interpolate", ["linear"], ["zoom"], 0, 0.9, 5, 0.85, 7, 0.5]);
    expect(layer("natural_earth").paint["raster-saturation"]).toBe(0.2);
  });

  it("leaves road numbers alone", () => {
    expect(layer("road_shield").layout["text-field"]).toEqual(["to-string", ["get", "ref"]]);
  });

  it("does not change the original style", () => {
    expect((style.layers[2] as unknown as { paint: Record<string, string> }).paint["fill-color"]).toBe("rgb(158,189,255)");
  });
});
