import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

// The guessing map's background: OpenFreeMap's "Liberty" style (free, no key, no request limits;
// https://openfreemap.org — attribution is added automatically). It's a VECTOR map: the browser
// draws it from data, so we can recolour it and choose the label language ourselves.
export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Colours in the style of the map players know from other geography games: bright blue sea,
// light land, soft greens for forests and parks.
const LAYER_COLORS: Record<string, string> = {
  background: "#f5f3ee",
  water: "#5cc6e3",
  waterway_river: "#5cc6e3",
  waterway_other: "#5cc6e3",
  waterway_tunnel: "#5cc6e3",
  park: "#cde8c4",
  landcover_wood: "#bfe0b5",
  landcover_grass: "#cfe9c6",
  landcover_ice: "#ffffff",
};

// Labels in Latin letters only ("Ethiopia", not "Ethiopia ኢትዮጵያ"): the English name when the data
// has one, otherwise the Latin-alphabet name, otherwise the local name.
const LATIN_NAME = ["coalesce", ["get", "name_en"], ["get", "name:latin"], ["get", "name"]];

const COLOR_PROPERTY: Partial<Record<LayerSpecification["type"], string>> = {
  background: "background-color",
  fill: "fill-color",
  line: "line-color",
};

// Liberty's "natural_earth" picture layer is a terrain view: land shaded green (forests), beige (deserts)
// and with mountain relief — the look of the reference map. Liberty draws it very faintly; we keep it
// strong up to country zoom and only fade it close in (zoom 7+), where real forest and park shapes take
// over. A little extra saturation makes the greens livelier. The blue sea is drawn on top of it.
const LAND_PICTURE_OPACITY = ["interpolate", ["linear"], ["zoom"], 0, 0.9, 5, 0.85, 7, 0.5];
const LAND_PICTURE_SATURATION = 0.2;

function restyleLayer(layer: LayerSpecification): LayerSpecification {
  if (layer.id === "natural_earth" && layer.type === "raster") {
    return {
      ...layer,
      paint: { ...layer.paint, "raster-opacity": LAND_PICTURE_OPACITY, "raster-saturation": LAND_PICTURE_SATURATION },
    } as LayerSpecification;
  }

  const color = LAYER_COLORS[layer.id];
  const colorProperty = COLOR_PROPERTY[layer.type];
  if (color && colorProperty) {
    return { ...layer, paint: { ...layer.paint, [colorProperty]: color } } as LayerSpecification;
  }

  // Only text that shows a place NAME (road numbers like "A1" keep their own text).
  if (layer.type === "symbol" && JSON.stringify(layer.layout?.["text-field"] ?? "").includes('"name')) {
    return { ...layer, layout: { ...layer.layout, "text-field": LATIN_NAME } } as LayerSpecification;
  }

  return layer;
}

// Turns the downloaded Liberty style into our game style. Pure: returns a new object, changes nothing.
export function toGameStyle(style: StyleSpecification): StyleSpecification {
  return { ...style, layers: style.layers.map(restyleLayer) };
}
