import { GeoJSONSource, Map } from "maplibre-gl";
import {
  CZML,
  getCurrentFeatureCollection,
  loadCZML,
} from "../datasource/czml";
import { Clock, clampCurrent } from "../clock";

export type CZMLLayer = {
  type: "czml";
  url: string;
  property: {
    polygonOpacity: number;
  };
};

export const handleCZML = async (
  map: Map,
  layer: CZMLLayer,
  getClock: (czml: CZML) => Clock,
) => {
  const data = await loadCZML(layer.url);
  const clock = getClock(data);
  const geojson = getCurrentFeatureCollection(data, clock.current);
  map.addSource("czml", {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: "czml",
    type: "fill-extrusion",
    source: "czml",
    paint: {
      "fill-extrusion-color": ["get", "polygonColor"],
      // NOTE: Opacity is still not working for now.
      // ref: https://github.com/mapbox/mapbox-gl-js/issues/9184
      "fill-extrusion-opacity": layer.property.polygonOpacity || 0.8,
      "fill-extrusion-height": ["get", "polygonExtrudedHeight"],
    },
  });

  clock.speed = 10;

  let current = new Date(clock.current);
  const frame = async (time: number) => {
    const move = time * (clock.speed || 0.001);
    current = clampCurrent(clock, new Date(current.getTime() + move), {
      ...clock,
      start: clock.end,
      end: clock.start,
    });
    const geojsonSource = map.getSource("czml") as GeoJSONSource;
    // Update the data after the GeoJSON source was created
    geojsonSource?.setData(getCurrentFeatureCollection(data, current));
  };

  return frame;
};
