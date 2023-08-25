import "./style.css";
import { runMap } from "./map";

runMap([
  // {
  //   type: "czml",
  //   id: "tokyo",
  //   url: "/tokyo.czml",
  //   property: {
  //     polygonOpacity: 0.8,
  //   },
  // },
  {
    type: "pointCloud",
    id: "unknown-sphere",
    url: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/pointcloud.json",
    // property: {
    //   polygonOpacity: 0.8,
    // },
  },
]);
