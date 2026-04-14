"use client";

import React from "react";
import { Car, Star } from "lucide-react";
import Link from "next/link";

export interface RideCardData {
  id: number;
  driverName: string;
  pickupLocation: string;
  dropLocation: string;
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  totalSeats: number;
  estimatedDuration?: number | null;
  estimatedDistance?: number | null;
  vehicleModel: string;
  vehicleImageUrl?: string | null;
  smokingAllowed: number;
  musicAllowed: number;
  petsAllowed: number;
  femaleOnly: number;
  luggageSize: string;
}

/** Replace Arabic/Urdu comma (،) with standard comma */
function cleanAddr(s: string) {
  return s.replace(/،/g, ",");
}

/** Shorten location to first meaningful part */
function shortLoc(loc: string) {
  return cleanAddr(loc).split(",")[0].trim();
}

/** Format duration like BlaBlaCar: "1h20" or "46 min" */
function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

/** Calculate arrival time */
function calcArrival(depTime: string, durationMins: number) {
  const [h, m] = depTime.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const total = h * 60 + m + durationMins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

/**
 * BlaBlaCar-style ride result card.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────┐
 * │ 00:10  ○ Bharthia                       ₹250.00 │
 * │ 1h20                                            │
 * │ 01:30  ○ Agra                                   │
 * │─────────────────────────────────────────────────│
 * │ 🚗  (avatar) Driver Name  ★ 5.0                 │
 * └──────────────────────────────────────────────────┘
 */
export default function RideCard({ ride }: { ride: RideCardData }) {
  const duration = ride.estimatedDuration || 0;
  const durationText = duration ? formatDuration(duration) : "";
  const arrivalTime = duration ? calcArrival(ride.departureTime, duration) : "";

  return (
    <Link href={`/rides/${ride.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 hover:border-[#0553BA]/30 hover:shadow-[0_4px_20px_rgba(5,83,186,0.08)] transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Route + Price Section */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between">
            {/* Left: Timeline */}
            <div className="flex-1 min-w-0">
              {/* Departure row */}
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-[#054752] w-[42px] shrink-0 tabular-nums">
                  {ride.departureTime}
                </span>
                <div className="w-[10px] h-[10px] rounded-full bg-[#054752] shrink-0" />
                <span className="text-[15px] font-bold text-[#054752] truncate">
                  {shortLoc(ride.pickupLocation)}
                </span>
              </div>

              {/* Duration */}
              {durationText && (
                <div className="flex items-stretch gap-3 ml-0">
                  <span className="text-[12px] text-[#708C91] font-medium w-[42px] shrink-0 text-center">
                    {durationText}
                  </span>
                  <div className="w-[10px] flex justify-center shrink-0">
                    <div className="w-[1.5px] h-full bg-[#054752]/20 min-h-[20px]" />
                  </div>
                </div>
              )}

              {/* Arrival row */}
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-[#054752] w-[42px] shrink-0 tabular-nums">
                  {arrivalTime}
                </span>
                <div className="w-[10px] h-[10px] rounded-full border-[2.5px] border-[#054752] bg-white shrink-0" />
                <span className="text-[15px] font-bold text-[#054752] truncate">
                  {shortLoc(ride.dropLocation)}
                </span>
              </div>
            </div>

            {/* Right: Price */}
            <div className="text-right ml-4 shrink-0 pt-1">
              <span className="text-[22px] font-extrabold text-[#054752] leading-none">
                ₹{ride.pricePerSeat}
              </span>
              <span className="text-[11px] font-bold text-[#054752] align-super">.00</span>
            </div>
          </div>
        </div>

        {/* Driver Section */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
          {/* Car icon */}
          <div className="text-[#708C91]">
            <Car className="w-[18px] h-[18px]" />
          </div>

          {/* Driver avatar */}
          {ride.vehicleImageUrl ? (
            <img
              src={ride.vehicleImageUrl}
              alt=""
              className="w-[32px] h-[32px] rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-[32px] h-[32px] rounded-full bg-[#E8F0FE] flex items-center justify-center border border-gray-200">
              <span className="text-[13px] font-bold text-[#0553BA]">
                {ride.driverName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}

          {/* Driver name */}
          <span className="text-[14px] font-semibold text-[#054752]">
            {ride.driverName}
          </span>

          {/* Star rating placeholder */}
          <div className="flex items-center gap-0.5 ml-1">
            <Star className="w-3 h-3 text-[#054752] fill-[#054752]" />
            <span className="text-[12px] font-semibold text-[#054752]">5.0</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
