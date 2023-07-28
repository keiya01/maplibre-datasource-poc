import { DEFAULT_CLOCK } from "./clock";
import { getClock } from "./datasource/czml";
import { Map } from "maplibre-gl";
import { CZMLLayer, handleCZML } from "./layers/czml";

const initializeMap = () => {
  return new Map({
    container: "app",
    style:
      "https://raw.githubusercontent.com/gsi-cyberjapan/gsivectortile-mapbox-gl-js/master/blank.json",
    center: [139.7535, 35.694], // Tokyo
    zoom: 13,
  });
};

type FrameHandler = (time: number) => Promise<void>;
const frame = (handlers: (FrameHandler | undefined)[]) => {
  const loop = async (time: number) => {
    await Promise.all(handlers.map((h) => h?.(time)));

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

type DataSource = CZMLLayer;

// NOTE: Clock is handled by each datsrouce currently.
export const runMap = (dataSources: DataSource[]) => {
  const map = initializeMap();

  map.on("load", async () => {
    const frames = await Promise.all(
      dataSources.map(async (d) => {
        if (d.type === "czml") {
          return await handleCZML(
            map,
            d,
            (czml) => getClock(czml) || DEFAULT_CLOCK,
          );
        }
      }),
    );

    frame(frames);
  });
};
