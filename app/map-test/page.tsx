"use client";
import MapViewInner from "@/components/ui/map-view-inner";

export default function MapTestPage() {
  return (
    <div className="w-full h-screen p-10 bg-white">
      <h1 className="mb-4 text-2xl font-bold text-black">Map Drag Test</h1>
      <div className="w-full h-[500px] border-4 border-red-500 rounded-xl relative">
        <MapViewInner center={[28.6139, 77.209]} zoom={10} />
      </div>
    </div>
  );
}
