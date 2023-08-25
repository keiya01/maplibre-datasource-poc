import { DEFAULT_CLOCK } from "./clock";
import { getClock } from "./datasource/czml";
import { IControl, Map } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox/typed";
import { CZMLLayer, handleCZML } from "./layers/czml";
import { PointCloudLayer, handlePointCloud } from "./layers/pointCloud";

const initializeMap = () => {
  const map = new Map({
    container: "app",
    style:
      "https://raw.githubusercontent.com/gsi-cyberjapan/gsivectortile-mapbox-gl-js/master/blank.json",
    center: [139.7535, 35.694], // Tokyo
    zoom: 13,
    antialias: true,
  });
  const overlay = new MapboxOverlay({
    interleaved: false,
  });

  map.addControl(overlay as unknown as IControl);

  return map;
};

type FrameHandler = (time: number) => Promise<void>;
const frame = (handlers: FrameHandler[]) => {
  const loop = async (time: number) => {
    await Promise.all(handlers.map((h) => h?.(time)));

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

type DataSource = CZMLLayer | PointCloudLayer;

// NOTE: Clock is handled by each datsrouce currently.
export const runMap = (dataSources: DataSource[]) => {
  const map = initializeMap();

  map.on("load", async () => {
    const frames = await Promise.all(
      dataSources.map(async (d) => {
        switch (d.type) {
          case "czml": {
            return await handleCZML(
              map,
              d,
              (czml) => getClock(czml) || DEFAULT_CLOCK,
            );
          }
          case "pointCloud": {
            return await handlePointCloud(
              map,
              d,
            );
          }
        }
      }),
    );

    frame(frames.filter((v): v is NonNullable<FrameHandler> => !!v));
  });
};
