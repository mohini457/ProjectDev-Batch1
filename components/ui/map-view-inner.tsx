"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  FullscreenControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapViewProps } from "./map-view";
import type { MapRef } from "react-map-gl/mapbox";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const MAP_STYLES = {
  streets: { label: "Streets", url: "mapbox://styles/mapbox/streets-v12" },
  satellite: {
    label: "Satellite",
    url: "mapbox://styles/mapbox/satellite-streets-v12",
  },
  light: { label: "Light", url: "mapbox://styles/mapbox/light-v11" },
} as const;

type StyleKey = keyof typeof MAP_STYLES;

export default function MapViewInner({
  markers = [],
  routeCoords,
  center,
  zoom = 5,
  className = "",
  style,
  draggableMarkers = false,
  onMarkerDragEnd,
  multiRoutes,
  selectedRouteId,
  onRouteSelect,
}: MapViewProps) {
  const [activeStyle, setActiveStyle] = useState<StyleKey>("streets");
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Calculate default bounds if markers exist to auto-fit
  const initialViewState = useMemo(() => {
    if (markers.length > 0) {
      return {
        longitude: markers[0].lng,
        latitude: markers[0].lat,
        zoom: markers.length > 1 ? 8 : 12,
      };
    }
    return {
      longitude: center ? center[1] : 78.9629,
      latitude: center ? center[0] : 22.5,
      zoom: zoom,
    };
  }, [markers, center, zoom]);

  // Auto-fit bounds when markers or selected route changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || markers.length < 2) return;

    const map = mapRef.current;

    // Collect all points to fit
    const allLngs = markers.map((m) => m.lng);
    const allLats = markers.map((m) => m.lat);

    // Include selected route coordinates in bounds
    const selectedRoute = multiRoutes?.find((r) => r.id === selectedRouteId);
    if (selectedRoute) {
      selectedRoute.coordinates.forEach(([lat, lng]) => {
        allLngs.push(lng);
        allLats.push(lat);
      });
    }

    const sw: [number, number] = [Math.min(...allLngs), Math.min(...allLats)];
    const ne: [number, number] = [Math.max(...allLngs), Math.max(...allLats)];

    map.fitBounds([sw, ne], {
      padding: { top: 60, bottom: 60, left: 50, right: 50 },
      duration: 800,
    });
  }, [markers, selectedRouteId, multiRoutes, mapLoaded]);

  // ── Legacy single route GeoJSON ──
  const routeGeoJSON = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoords.map((c) => [c[1], c[0]]), // Mapbox needs [lng, lat]
      },
    };
  }, [routeCoords]);

  // ── Multi-route GeoJSON map ──
  const routeGeoJSONs = useMemo(() => {
    if (!multiRoutes || multiRoutes.length === 0) return null;

    return multiRoutes.map((route) => ({
      route,
      geojson: {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: route.coordinates.map((c) => [c[1], c[0]]),
        },
      },
    }));
  }, [multiRoutes]);

  // Marker drag handler
  const handleDragEnd = useCallback(
    (label: string, event: any) => {
      if (onMarkerDragEnd && event.lngLat) {
        onMarkerDragEnd(label, {
          lng: event.lngLat.lng,
          lat: event.lngLat.lat,
        });
      }
    },
    [onMarkerDragEnd]
  );

  // Has multi-route mode?
  const isMultiRoute = routeGeoJSONs && routeGeoJSONs.length > 0;

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{ minHeight: 300, ...style }}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        mapStyle={MAP_STYLES[activeStyle].url}
        style={{ width: "100%", height: "100%", borderRadius: "1rem" }}
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
        attributionControl={false}
        onLoad={() => setMapLoaded(true)}
      >
        <NavigationControl position="top-right" visualizePitch={true} />
        <FullscreenControl position="top-right" />

        {/* ── Multi-route rendering ── */}
        {isMultiRoute &&
          routeGeoJSONs!.map(({ route, geojson }) => {
            const isSelected = route.id === selectedRouteId;
            const opacity = isSelected ? 0.9 : 0.35;
            const width = isSelected ? 6 : 4;

            return (
              <span key={route.id}>
                {/* Outline for selected route */}
                {isSelected && (
                  <Source
                    id={`route-outline-${route.id}`}
                    type="geojson"
                    data={geojson}
                  >
                    <Layer
                      id={`route-outline-layer-${route.id}`}
                      type="line"
                      layout={{ "line-join": "round", "line-cap": "round" }}
                      paint={{
                        "line-color": route.color,
                        "line-width": 12,
                        "line-opacity": 0.15,
                      }}
                    />
                  </Source>
                )}

                {/* Main route line */}
                <Source
                  id={`route-${route.id}`}
                  type="geojson"
                  data={geojson}
                >
                  <Layer
                    id={`route-layer-${route.id}`}
                    type="line"
                    layout={{ "line-join": "round", "line-cap": "round" }}
                    paint={{
                      "line-color": route.color,
                      "line-width": width,
                      "line-opacity": opacity,
                      ...(isSelected
                        ? {}
                        : {
                            "line-dasharray": [2, 2],
                          }),
                    }}
                  />
                </Source>

                {/* Route label at midpoint */}
                {(() => {
                  const coords = route.coordinates;
                  const midIdx = Math.floor(coords.length / 2);
                  const mid = coords[midIdx];
                  if (!mid) return null;

                  return (
                    <Marker
                      key={`label-${route.id}`}
                      longitude={mid[1]}
                      latitude={mid[0]}
                      anchor="center"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRouteSelect?.(route.id);
                        }}
                        className={`
                          px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg
                          border-2 transition-all duration-200 cursor-pointer whitespace-nowrap
                          ${
                            isSelected
                              ? "bg-white border-current scale-110"
                              : "bg-white/80 backdrop-blur-sm border-gray-200 hover:scale-105 hover:bg-white"
                          }
                        `}
                        style={{
                          color: route.color,
                          borderColor: isSelected ? route.color : undefined,
                        }}
                        title={`${route.label}: ${route.distance} km, ${
                          route.duration >= 60
                            ? `${Math.floor(route.duration / 60)}h ${
                                route.duration % 60
                              }m`
                            : `${route.duration} min`
                        }`}
                      >
                        {route.tag}
                      </button>
                    </Marker>
                  );
                })()}
              </span>
            );
          })}

        {/* ── Legacy single route rendering ── */}
        {!isMultiRoute && routeGeoJSON && (
          <>
            <Source id="route-outline" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-outline-layer"
                type="line"
                layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{
                  "line-color": "#042E62",
                  "line-width": 9,
                  "line-opacity": 0.2,
                }}
              />
            </Source>
            <Source id="route-main" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-main-layer"
                type="line"
                layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{
                  "line-color": "#0553BA",
                  "line-width": 5,
                  "line-opacity": 0.9,
                }}
              />
            </Source>
          </>
        )}

        {/* ── Markers ── */}
        {markers.map((m, idx) => {
          const color =
            m.color === "green"
              ? "#059669"
              : m.color === "red"
                ? "#DC2626"
                : "#0553BA";
          const isDraggable = draggableMarkers && !!m.label;

          return (
            <Marker
              key={`${m.label || idx}-${m.lat}-${m.lng}`}
              longitude={m.lng}
              latitude={m.lat}
              anchor="bottom"
              draggable={isDraggable}
              onDragEnd={
                isDraggable
                  ? (e) => handleDragEnd(m.label!, e)
                  : undefined
              }
            >
              <div
                style={{ position: "relative", cursor: isDraggable ? "grab" : "pointer" }}
                className={isDraggable ? "group" : ""}
              >
                {/* Pin SVG */}
                <svg
                  width="32"
                  height="44"
                  viewBox="0 0 32 44"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter
                      id={`shadow-${idx}`}
                      x="-30%"
                      y="-10%"
                      width="160%"
                      height="150%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="2.5"
                        floodColor="#000"
                        floodOpacity="0.35"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z"
                    fill={color}
                    filter={`url(#shadow-${idx})`}
                  />
                  <circle cx="16" cy="16" r="7" fill="white" opacity="0.95" />
                  <text
                    x="16"
                    y="20"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={color}
                    fontFamily="system-ui, sans-serif"
                  >
                    {m.label === "Pickup"
                      ? "P"
                      : m.label === "Drop"
                        ? "D"
                        : "●"}
                  </text>
                </svg>

                {/* Label + drag hint */}
                {m.label && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-32px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "white",
                      color: "#054752",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 10px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                      whiteSpace: "nowrap",
                      fontFamily: "system-ui, sans-serif",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {m.label}
                    {isDraggable && (
                      <span
                        style={{
                          fontSize: "8px",
                          color: "#0553BA",
                          opacity: 0.7,
                        }}
                      >
                        ✥ drag
                      </span>
                    )}
                  </div>
                )}

                {/* Pulsing ring for draggable markers */}
                {isDraggable && (
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: `2px solid ${color}`,
                      opacity: 0.4,
                      animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Style switcher */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/60 p-1">
        {(Object.keys(MAP_STYLES) as StyleKey[]).map((key) => (
          <button
            key={key}
            onClick={(e) => {
              e.preventDefault();
              setActiveStyle(key);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeStyle === key
                ? "bg-[#0553BA] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {MAP_STYLES[key].label}
          </button>
        ))}
      </div>

      {/* Inline keyframes for the pulsing ring */}
      <style jsx global>{`
        @keyframes ping {
          75%,
          100% {
            transform: translateX(-50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
