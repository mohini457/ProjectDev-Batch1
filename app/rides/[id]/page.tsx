"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  MapPin, Calendar, Clock, Car, Users, IndianRupee,
  Music, Cigarette, Dog, UserRound, Luggage, ArrowLeft,
  CheckCircle2, Loader2, Send, StickyNote, Navigation,
  CircleDot, Shield, AlertTriangle
} from "lucide-react";
import MapView from "@/components/ui/map-view";

interface RideDetail {
  id: string;
  pickupLocation: string;
  dropLocation: string;
  pickupLat: string;
  pickupLng: string;
  dropLat: string;
  dropLng: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  vehicleCapacity: number;
  vehicleModel: string;
  vehiclePlate: string;
  pricePerSeat: number;
  smokingAllowed: number;
  musicAllowed: number;
  petsAllowed: number;
  femaleOnly: number;
  luggageSize: string;
  additionalNotes: string | null;
  status: string;
  estimatedDuration: number | null;
  estimatedDistance: number | null;
  routePolyline: string | null;
  driverName: string;
  driverClerkId: string;
}

export default function RideDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [ride, setRide] = useState<RideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Join form state
  const [requestSeats, setRequestSeats] = useState(1);
  const [message, setMessage] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rides/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ride) setRide(data.ride);
        else setError("Ride not found");
      })
      .catch(() => setError("Failed to load ride"))
      .finally(() => setLoading(false));
  }, [id]);

  // Sync user
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/sync", { method: "POST" }).catch(console.error);
    }
  }, [isSignedIn]);

  const handleJoinRequest = async () => {
    if (!isSignedIn) {
      router.push("/auth");
      return;
    }
    setIsRequesting(true);
    setRequestError("");

    try {
      const res = await fetch(`/api/rides/${id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedSeats: requestSeats,
          message: message || null,
          pickupNote: pickupNote || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send request");

      setRequestSent(true);
    } catch (err: any) {
      setRequestError(err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const isOwnRide = ride?.driverClerkId === user?.id;

  const calculateDropTime = (timeStr: string, durationMins: number) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return "";
    const totalMins = h * 60 + m + durationMins;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m.toString().padStart(2, "0")} min`;
  };

  const cleanAddr = (s: string) => s.replace(/،/g, ",");
  const shortLoc = (loc: string) => cleanAddr(loc).split(",")[0].trim();

  // Decode Google-style encoded polyline string into [lat, lng] pairs
  const decodePolyline = (encoded: string): [number, number][] => {
    const coords: [number, number][] = [];
    let i = 0, lat = 0, lng = 0;
    while (i < encoded.length) {
      let shift = 0, result = 0, byte;
      do { byte = encoded.charCodeAt(i++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;
      shift = 0; result = 0;
      do { byte = encoded.charCodeAt(i++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;
      coords.push([lat / 1e5, lng / 1e5]);
    }
    return coords;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 text-[#0553BA] animate-spin" />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA]">
        <AlertTriangle className="w-12 h-12 text-orange-400 mb-4" />
        <h2 className="text-xl font-extrabold text-[#054752]">{error || "Ride not found"}</h2>
        <button onClick={() => router.push("/search")} className="mt-4 text-[#0553BA] font-bold hover:underline cursor-pointer">
          ← Back to search
        </button>
      </div>
    );
  }

  const markers = [
    { lat: parseFloat(ride.pickupLat), lng: parseFloat(ride.pickupLng), label: "Pickup", color: "green" as const },
    { lat: parseFloat(ride.dropLat), lng: parseFloat(ride.dropLng), label: "Drop", color: "red" as const },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#0553BA] font-bold text-sm mb-4 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Map & Preferences */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-[24px]">
            {/* Map */}
            <div className="h-[350px] lg:h-[400px] rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm w-full">
              <MapView
                markers={markers}
                routeCoords={ride.routePolyline ? decodePolyline(ride.routePolyline) : undefined}
                zoom={8}
              />
            </div>


          </div>

          {/* Right: Ride Details & Request Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Route card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm"
            >
              <div className="flex items-start justify-between">
                
                {/* Timeline */}
                <div className="flex-1 relative">
                  {/* Absolute linking line */}
                  <div className="absolute left-[63px] top-4 bottom-5 w-[2px] bg-black z-0" />
                  
                  {/* Pickup Row */}
                  <div className="flex items-start gap-3 pb-8 relative z-10">
                    <div className="w-[45px] text-right pt-[2px]">
                      <span className="text-[19px] leading-none font-bold text-[#054752] block">{ride.departureTime}</span>
                    </div>
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0 outline outline-[6px] outline-white mt-1 relative z-10" />
                      <div>
                        <p className="text-[17px] font-extrabold text-[#054752] leading-tight">{shortLoc(ride.pickupLocation)}</p>
                        <p className="text-xs text-[#708C91] font-medium mt-0.5 line-clamp-1">{cleanAddr(ride.pickupLocation)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Duration Bubble (absolute positioned against the line) */}
                  {ride.estimatedDuration && (
                    <div className="absolute left-[6px] top-[45%] -translate-y-1/2 text-right z-10 bg-white py-2">
                      <span className="text-[13px] text-[#708C91] font-semibold whitespace-nowrap">{formatDuration(ride.estimatedDuration)}</span>
                    </div>
                  )}

                  {/* Drop Row */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-[45px] text-right pt-[2px]">
                      <span className="text-[19px] leading-none font-bold text-[#054752] block">
                        {calculateDropTime(ride.departureTime, ride.estimatedDuration || 0)}
                      </span>
                    </div>
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 flex-shrink-0 bg-white outline outline-[6px] outline-white mt-1 relative z-10" />
                      <div>
                        <p className="text-[17px] font-extrabold text-[#054752] leading-tight">{shortLoc(ride.dropLocation)}</p>
                        <p className="text-xs text-[#708C91] font-medium mt-0.5 line-clamp-1">{cleanAddr(ride.dropLocation)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right ml-4">
                  <div className="flex items-center justify-end gap-0.5">
                    <IndianRupee className="w-6 h-6 text-[#054752]" />
                    <span className="text-[32px] leading-none font-extrabold text-[#054752]">{ride.pricePerSeat}</span>
                  </div>
                  <p className="text-[13px] text-[#708C91] font-semibold mt-0.5">per seat</p>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-6" />

              <div className="space-y-4">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-[18px] h-[18px] text-[#0553BA]" />
                  <span className="text-sm font-bold text-[#054752]">{formatDate(ride.departureDate)}</span>
                </div>

                {/* Distance */}
                {ride.estimatedDistance && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-[18px] h-[18px] text-[#0553BA]" />
                    <span className="text-sm font-bold text-[#054752]">{ride.estimatedDistance} km total distance</span>
                  </div>
                )}

                {/* Vehicle */}
                <div className="flex items-center gap-3">
                  <Car className="w-[18px] h-[18px] text-[#0553BA]" />
                  <span className="text-sm font-bold text-[#054752]">{ride.vehicleModel}</span>
                  <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-[#054752]">{ride.vehiclePlate}</span>
                </div>

                {/* Seats */}
                <div className="flex items-center gap-3">
                  <Users className="w-[18px] h-[18px] text-[#0553BA]" />
                  <span className="text-sm font-bold text-[#054752]">
                    {ride.availableSeats} of {ride.totalSeats} seats available
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Join request form (Only if NOT the driver's own ride) */}
            {!isOwnRide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm"
              >
                {requestSent ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-extrabold text-[#054752] mb-2">Request sent! 🎉</h3>
                    <p className="text-sm text-[#708C91] font-medium">
                      {ride.driverName} will review your request. You'll be notified once they respond.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-extrabold text-[#054752] mb-6">Request to join</h3>

                    {/* Seats selector */}
                    <div className="mb-5">
                      <label className="block text-sm font-bold text-[#054752] mb-3">Seats needed</label>
                      <div className="flex items-center gap-3">
                        {Array.from({ length: Math.min(ride.availableSeats, 4) }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRequestSeats(n)}
                            className={`w-[46px] h-[46px] rounded-full font-bold text-[15px] transition-all cursor-pointer
                              ${requestSeats === n
                                ? "bg-[#0553BA] text-white shadow-md"
                                : "bg-[#F0F7FF] text-[#0553BA] hover:bg-[#E2F0FF]"
                              }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-5">
                      <label className="block text-sm font-bold text-[#054752] mb-2">
                        Message <span className="font-normal text-[#708C91]">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Introduce yourself to the driver..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl text-[15px] font-medium text-[#054752] placeholder:text-[#708C91]/70 outline-none focus:border-[#0553BA] focus:ring-2 focus:ring-[#0553BA]/10 transition-all resize-none"
                      />
                    </div>

                    {/* Pickup note */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-[#054752] mb-2">
                        Pickup preference <span className="font-normal text-[#708C91]">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={pickupNote}
                        onChange={(e) => setPickupNote(e.target.value)}
                        placeholder="e.g. Near Pune Station"
                        className="w-full h-[52px] px-4 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl text-[15px] font-medium text-[#054752] placeholder:text-[#708C91]/70 outline-none focus:border-[#0553BA] focus:ring-2 focus:ring-[#0553BA]/10 transition-all"
                      />
                    </div>

                    {/* Total price */}
                    <div className="bg-[#F0F7FF] rounded-2xl p-5 mb-6 flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[#054752]">Total price</span>
                      <div className="flex items-center gap-0.5">
                        <IndianRupee className="w-5 h-5 text-[#0553BA]" />
                        <span className="text-[24px] leading-none font-extrabold text-[#0553BA]">
                          {ride.pricePerSeat * requestSeats}
                        </span>
                      </div>
                    </div>

                    {requestError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold mb-6 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        {requestError}
                      </div>
                    )}

                    <button
                      onClick={handleJoinRequest}
                      disabled={isRequesting || ride.availableSeats === 0}
                      className="w-full h-[54px] bg-[#0553BA] text-white rounded-full font-bold text-[15px] hover:bg-[#033B85] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {isRequesting ? (
                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      ) : (
                        <Send className="w-[18px] h-[18px]" />
                      )}
                      {ride.availableSeats === 0 ? "No seats available" : isSignedIn ? "Send Request" : "Sign in to join"}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Full Width Preferences & Driver */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mt-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-extrabold text-[#054752] mb-4">Ride preferences</h3>
              <div className="flex flex-wrap gap-2">
                <PrefBadge icon={Music} label="Music" active={ride.musicAllowed === 1} color="blue" />
                <PrefBadge icon={Cigarette} label="Smoking" active={ride.smokingAllowed === 1} color="orange" />
                <PrefBadge icon={Dog} label="Pets" active={ride.petsAllowed === 1} color="amber" />
                <PrefBadge icon={UserRound} label="Female only" active={ride.femaleOnly === 1} color="pink" />
                <PrefBadge icon={Luggage} label={`${ride.luggageSize} luggage`} active={true} color="gray" />
              </div>

              <div className="bg-[#FAFBFC] rounded-2xl p-4 mt-6 border border-gray-50">
                <div className="flex items-start gap-3">
                  <StickyNote className="w-5 h-5 text-[#0553BA] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#054752] mb-0.5">Additional info from driver</h4>
                    <p className="text-[14px] text-[#708C91] font-medium leading-relaxed">
                      {ride.additionalNotes ? ride.additionalNotes : "No additional info"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-[#054752] mb-4">Driver</h3>
              <div className="bg-[#FAFBFC] rounded-2xl p-5 border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-[60px] h-[60px] rounded-full bg-[#0553BA]/10 flex items-center justify-center shrink-0">
                    <UserRound className="w-8 h-8 text-[#0553BA]" />
                  </div>
                  <div>
                    <p className="text-[18px] font-extrabold text-[#054752]">{ride.driverName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-[13px] font-bold text-green-600">Verified profile</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Preference badge helper
function PrefBadge({
  icon: Icon,
  label,
  active,
  color,
}: {
  icon: any;
  label: string;
  active: boolean;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: active ? "bg-[#F0F7FF] text-[#0553BA]" : "bg-gray-100 text-gray-400 line-through",
    orange: active ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-400 line-through",
    amber: active ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400 line-through",
    pink: active ? "bg-pink-50 text-pink-500" : "bg-gray-100 text-gray-400 line-through",
    gray: "bg-gray-100 text-[#054752]",
  };

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${colorMap[color]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
