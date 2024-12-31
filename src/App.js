import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Viewer } from "mapillary-js";
import "mapbox-gl/dist/mapbox-gl.css";
import "mapillary-js/dist/mapillary.css";

const MELBOURNE_COORDINATES = [144.962646, -37.810272];
const INITIAL_ZOOM = 15;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPILLATY_TILE_URL = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPILLARY_ACCESS_TOKEN}`;

const initializeMapillarySource = (map) => {
  map.addSource("mapillary", {
    type: "vector",
    tiles: [MAPILLATY_TILE_URL],
    minzoom: 6,
    maxzoom: 14,
  });

  map.addLayer(
    {
      id: "mapillary",
      type: "line",
      source: "mapillary",
      "source-layer": "sequence",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-opacity": 0.6,
        "line-color": "rgb(53, 175, 140)",
        "line-width": 2,
      },
    },
    "road-label-simple",
  );
};

const App = () => {
  const mapContainerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState();
  const viewerRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      zoom: INITIAL_ZOOM,
      center: MELBOURNE_COORDINATES,
      accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
    });

    map.on("load", () => {
      initializeMapillarySource(map);
    });

    map.on("click", handleMapClick);

    map.addControl(new mapboxgl.NavigationControl());

    setMapInstance(map);

    return () => {
      map.remove();
      setMapInstance(null);
    };
  }, [mapContainerRef]);

  // Initialize Mapillary Viewer
  useEffect(() => {
    if (!viewerRef.current) return;

    const mapillaryToken = process.env.REACT_APP_MAPILLARY_ACCESS_TOKEN;
    if (!mapillaryToken) {
      console.error("Mapillary token is missing");
      return;
    }

    const viewer = new Viewer({
      accessToken: mapillaryToken,
      container: viewerRef.current,
    });

    setViewerInstance(viewer);

    return () => {
      viewer.remove();
      setViewerInstance(null);
    };
  }, [viewerRef]);

  const handleMapClick = useCallback(
    (e) => {
      if (!mapInstance || !viewerInstance) return;

      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["mapillary"],
      });

      const closest = features[0];
      if (!closest?.properties?.image_id) {
        console.warn("No image_id found");
        return;
      }

      viewerInstance
        .moveTo(closest.properties.image_id)
        .catch((error) => console.error("Mapillary viewer error:", error));
    },
    [mapInstance, viewerInstance],
  );

  useEffect(() => {
    if (!mapInstance || !viewerInstance) return;
    mapInstance.on("click", handleMapClick);

    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [mapInstance, viewerInstance, handleMapClick]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
      }}
    >
      <div
        ref={viewerRef}
        style={{
          backgroundColor: "white",
          width: "50%",
        }}
      ></div>
      <div
        id="map"
        ref={mapContainerRef}
        style={{ height: "100vh", width: "50%" }}
      ></div>
    </div>
  );
};

export default App;
