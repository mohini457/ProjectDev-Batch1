"use client";

import dynamic from "next/dynamic";
import React from "react";

// Mapbox GL must be loaded client-side only (no SSR — it uses WebGL)
const MapInner = dynamic(() => import("./map-view-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#F5F7FA] rounded-2xl flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#0553BA] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: "blue" | "green" | "red";
}

export interface RouteOption {
  id: string;
  label: string;
  tag: string;
  color: string;
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export interface MapViewProps {
  markers?: MapMarker[];
  routeCoords?: [number, number][]; // [lat, lng] pairs for a single route line (legacy)
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  // ── Draggable markers ──
  draggableMarkers?: boolean;
  onMarkerDragEnd?: (markerLabel: string, lngLat: { lng: number; lat: number }) => void;
  // ── Multi-route ──
  multiRoutes?: RouteOption[];
  selectedRouteId?: string;
  onRouteSelect?: (routeId: string) => void;
}

/**
 * SSR-safe Mapbox GL JS map wrapper.
 * Dynamically imports the actual WebGL map to avoid "window is not defined" errors.
 */
export default function MapView(props: MapViewProps) {
  return <MapInner {...props} />;
}
