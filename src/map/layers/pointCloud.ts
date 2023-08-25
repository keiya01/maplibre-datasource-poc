import { COORDINATE_SYSTEM } from "@deck.gl/core/typed";
import { PointCloudLayer as DeckPointCloudLayer, PointCloudLayerProps } from "@deck.gl/layers/typed";
import { Layer } from "./types";
import { LayerSpecification, Map } from "maplibre-gl";
import { MapboxLayer } from "@deck.gl/mapbox/typed";
import { easeCubicInOut } from "d3";
import { clampColor, randomValue } from "../../utils/math";

export type PointCloudLayer = Layer<{
    type: "pointCloud",
    url: string,
}>;

/*
* https://deck.gl/docs/api-reference/layers/point-cloud-layer
*/
export const handlePointCloud = async (map: Map, layer: PointCloudLayer) => {
    const l = new MapboxLayer({
    id: layer.id,
    type: DeckPointCloudLayer,

    data: layer.url,
    /* props from PointCloudLayer class */
    
    getColor: d => d.color,
    getNormal: d => d.normal,
    getPosition: d => d.position,
    // material: true,
    pointSize: 3,
    // sizeUnits: 'pixels',
    
    /* props inherited from Layer class */
    
    // autoHighlight: false,
    coordinateOrigin: [139.7535, 35.694, 100],
    coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
    // highlightColor: [0, 0, 128, 128],
    // modelMatrix: null,
    // opacity: 1,
    pickable: false,
    transitions: {
        getPosition: {
            duration: 3000,
            easing: easeCubicInOut,
            enter: (value: number[]) => [value[0] * randomValue(100), value[1] * randomValue(100), value[2] * randomValue(100)] // fade in
        },
        getColor: {
          duration: 3300,
          easing: easeCubicInOut,
          enter: (value: number[]) => [value[0] * clampColor(randomValue(100)), value[1] * clampColor(randomValue(10)), value[2] * clampColor(randomValue(10)), 1] // fade in
        },
    },
    // visible: true,
    // wrapLongitude: false,
    } as PointCloudLayerProps);

    map.addLayer(l as unknown as LayerSpecification);
    
    // new DeckGL({
    //   mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    //   initialViewState: {
    //     longitude: -122.4,
    //     latitude: 37.74,
    //     zoom: 11,
    //     maxZoom: 20,
    //     pitch: 30,
    //     bearing: 0
    //   },
    //   controller: true,
    //   getTooltip: ({object}) => object && object.position.join(', '),
    //   layers: [layer]
    // });  
}