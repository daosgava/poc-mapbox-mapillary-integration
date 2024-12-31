import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Viewer } from "mapillary-js";
import "mapbox-gl/dist/mapbox-gl.css";
import "mapillary-js/dist/mapillary.css";

const MELBOURNE_COORDINATES = [144.962646, -37.810272];
const INITIAL_ZOOM = 15;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPILLATY_TILE_URL = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPILLARY_ACCESS_TOKEN}`;

const App = () => {
  const mapRef = useRef(null);
  const viewerRef = useRef(null);

  const initializeMapillarySource = useCallback((map) => {
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
  }, []);

  const handleMapClick = useCallback((e) => {
    if (!mapRef.current || !viewerRef.current) return;

    const features = mapRef.current.queryRenderedFeatures(e.point, {
      layers: ["mapillary"],
    });

    const closest = features[0];
    if (!closest?.properties?.image_id) {
      console.warn("No image_id found");
      return;
    }

    viewerRef.current
      .moveTo(closest.properties.image_id)
      .catch((error) => console.error("Mapillary viewer error:", error));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error("Mapbox token is missing");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      zoom: INITIAL_ZOOM,
      center: MELBOURNE_COORDINATES,
    });

    map.on("load", () => {
      initializeMapillarySource(map);
    });

    map.addControl(new mapboxgl.NavigationControl());

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initializeMapillarySource]);

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

    viewerRef.current = viewer;

    if (mapRef.current) {
      mapRef.current.on("click", handleMapClick);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
      viewer.remove();
      viewerRef.current = null;
    };
  }, [handleMapClick]);

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
          width: "50%",
        }}
      ></div>
      <div
        id="map"
        ref={mapRef}
        style={{ height: "100vh", width: "50%" }}
      ></div>
    </div>
  );
};

export default App;
