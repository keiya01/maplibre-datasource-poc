/**
 * Supported patterns
 * - { property: { number: [date, n] } }
 * - TODO: { property: { interval: date, number: [date, n] } }
 */

import { FeatureCollection, Geometry, Polygon } from "geojson";
import { Clock } from "../clock";

type CZMLDocument = {
  id: "document";
  version?: string;
  availability?: string;
};

type CZMLLayer = {
  id?: string;
  polygon?: {
    extrudedHeight?: {
      interval?: number;
      number: (string | number)[];
    };
    material?: {
      interval?: number;
      solidColor?: {
        color?: {
          rgba?: (string | number)[];
        };
      };
    };
    positions?: {
      cartographicDegrees?: number[];
    };
  };
};

type CZMLContent = CZMLDocument | CZMLLayer;

export type CZML = CZMLContent[];

const isDocument = (content: CZMLContent): content is CZMLDocument =>
  content.id === "document" && Object.hasOwn(content, "version");

export type ExtendedGeoJSONForCZML = FeatureCollection & {
  availavility: CZMLDocument["availability"];
};

type BasicGemetry = Extract<
  Geometry["type"],
  "Point" | "Polygon" | "LineString"
>;

// TODO: Support point, linestring
const LAYER_GEOMERTY_MAP: {
  [K in Exclude<keyof Omit<CZMLLayer, "id">, undefined>]: BasicGemetry;
} = {
  polygon: "Polygon",
};

const chunks = (arr: number[], offset: number) => {
  const result: number[][] = [];
  const chunk: number[] = [];
  for (const v of arr) {
    chunk.push(v);
    if (chunk.length === offset) {
      result.push([...chunk]);
      chunk.length = 0;
    }
  }
  if (chunk.length !== 0) {
    throw new Error("Chunk does not match");
  }
  return result;
};

const getGeometry = (content: CZMLContent): Geometry | undefined => {
  const [k, v] =
    Object.entries(content).find(([k, v]) =>
      LAYER_GEOMERTY_MAP[k as keyof typeof LAYER_GEOMERTY_MAP] ? v : undefined,
    ) || [];

  if (!k || !v || typeof v === "string") {
    return;
  }

  const geometryType = LAYER_GEOMERTY_MAP[k as keyof typeof LAYER_GEOMERTY_MAP];

  if (geometryType === "Polygon") {
    return {
      type: "Polygon",
      coordinates: [chunks(v.positions?.cartographicDegrees || [], 3)],
    } as Polygon;
  }
};

export const loadCZML = async (url: string): Promise<CZML> => {
  return (await window.fetch(url).then((d) => d.json())) as CZML;
};

const convertColor = (color: string | number | number[] | undefined) => {
  if (
    !color ||
    typeof color === "string" ||
    typeof color === "number" ||
    color.length === 3
  ) {
    return color;
  }
  return [color[0], color[1], color[2], color[3] / 255];
};

export const getCurrentFeatureCollection = (
  czml: CZML,
  current: Date,
): ExtendedGeoJSONForCZML => {
  const geojson = {
    type: "FeatureCollection",
    features: [] as ExtendedGeoJSONForCZML["features"],
  } as ExtendedGeoJSONForCZML;

  czml.forEach((d) => {
    if (isDocument(d)) {
      geojson.availavility = d.availability;
      return;
    }
    const geometry = getGeometry(d);
    if (!geometry) {
      return;
    }

    // TODO: Support other geometry
    geojson.features.push({
      type: "Feature",
      geometry,
      properties: {
        polygonExtrudedHeight: d.polygon?.extrudedHeight?.number
          ? getCurrentProperty(d.polygon?.extrudedHeight?.number, current)
          : undefined,
        polygonColor: d.polygon?.material?.solidColor?.color?.rgba
          ? convertColor(
              getCurrentProperty(
                d.polygon?.material?.solidColor?.color?.rgba as number[],
                current,
              ),
            )
          : undefined,
      },
    });
  });

  return geojson;
};

const stringToDate = (d: unknown) => {
  if (typeof d !== "string") {
    return;
  }
  try {
    return new Date(d);
  } catch {
    // noop
  }
};

const getCurrentProperty = <T>(
  value: T[],
  current: Date,
): T | T[] | undefined => {
  const result: T[] = [];
  let currentDateState: string | undefined = undefined;
  let prevDateState: string | undefined = undefined;
  let propertyDate: Date | undefined = undefined;
  for (const v of value) {
    const date = stringToDate(v);
    if (date) {
      propertyDate = date;
      currentDateState = v as string;
      continue;
    }
    if (propertyDate && propertyDate.getTime() <= current.getTime()) {
      if (currentDateState !== prevDateState) {
        prevDateState = currentDateState;
        result.length = 0;
      }
      result.push(v);
    }
  }
  return result.length === 1 ? result[0] : result;
};

export const getClock = (czml: CZML): Clock | undefined => {
  const doc = czml.find((v) => isDocument(v)) as CZMLDocument;
  if (!doc.availability) {
    return;
  }

  const splitAvail = doc.availability.split("/");
  if (splitAvail.length > 2) {
    throw new Error("Unexpected availability");
  }

  const [start, end] = splitAvail;

  const [startDate, endDate] = [new Date(start), new Date(end)];

  return {
    start: startDate,
    current: startDate,
    end: endDate,
  };
};
