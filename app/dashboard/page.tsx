"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Car, UserRound, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Tab = "active" | "archived";

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync user
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/sync", { method: "POST" }).catch(console.error);
    }
  }, [isSignedIn]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/auth");
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rides/my-rides");
      if (res.ok) {
        const data = await res.json();
        // Here we just fetch published rides for the "Your rides" dashboard
        // If we want to merge requested rides, we could, but let's keep it clean
        setMyRides(data.rides || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) fetchData();
  }, [isSignedIn, fetchData]);

  const handleRequestAction = async (rideId: string, requestId: number, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/rides/${rideId}/request`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        fetchData(); // Refresh list to update pending counts
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="w-8 h-8 text-[#054752] animate-spin" />
      </div>
    );
  }

  // Check if a ride's departure date+time has passed
  const isRideExpired = (ride: any) => {
    try {
      const [year, month, day] = new Date(ride.departureDate)
        .toISOString()
        .split("T")[0]
        .split("-")
        .map(Number);
      const [hours, minutes] = (ride.departureTime || "00:00").split(":").map(Number);
      const departureDateTime = new Date(year, month - 1, day, hours, minutes);
      // Add estimated duration so it only expires after drop-off time
      if (ride.estimatedDuration) {
        departureDateTime.setMinutes(departureDateTime.getMinutes() + ride.estimatedDuration);
      }
      return departureDateTime.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  // Enrich rides with expired flag
  const enrichedRides = myRides.map((r) => ({
    ...r,
    isExpired: r.status === "active" && isRideExpired(r),
  }));

  // Split active from completed/cancelled
  const activeRides = enrichedRides.filter((r) => r.status === "active");
  const archivedRides = enrichedRides.filter((r) => r.status !== "active");

  const ridesToShow = activeTab === "active" ? activeRides : archivedRides;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24 pt-10 px-4">
      <div className="max-w-2xl mx-auto md:w-[600px] w-full">
        <h1 className="text-[36px] font-extrabold text-[#054752] text-center mb-10 tracking-tight">
          Your rides
        </h1>

        <AnimatePresence mode="popLayout">
          {ridesToShow.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <Car className="w-12 h-12 text-[#708C91]/30 mx-auto mb-4" />
              <p className="text-[#054752] font-semibold text-lg">No rides yet</p>
              <p className="text-[#708C91] mt-1 text-sm">When you publish a ride, it will appear here.</p>
              <Link href="/publish" className="text-[#0553BA] font-bold mt-4 inline-block hover:underline">
                Publish a ride
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {ridesToShow.map((ride) => (
                <RideCard key={ride.id} ride={ride} onAction={handleRequestAction} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {activeTab === "active" ? (
          <button 
            onClick={() => setActiveTab("archived")}
            className="w-full flex items-center justify-between text-[#054752] font-semibold text-[17px] hover:text-[#0553BA] transition-colors py-5 border-t border-gray-200 mt-8"
          >
            <span>Archived rides</span>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </button>
        ) : (
          <button 
            onClick={() => setActiveTab("active")}
            className="w-full justify-center flex text-[#0553BA] font-semibold text-[15px] pt-8 hover:underline"
          >
            Back to Active Rides
          </button>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Custom formatting helpers
// =====================================================
function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  // E.g. "Tue 14 Apr"
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(',', '');
}

function calculateDropTime(departureTime: string, durationMinutes: number) {
  if (!durationMinutes) return "—";
  const [hours, minutes] = departureTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, "0")} min`;
}

/** Replace Arabic/Urdu comma (،) with standard comma */
function cleanAddress(loc: string) {
  return loc.replace(/،/g, ",");
}

function shortLoc(loc: string) {
  return cleanAddress(loc).split(",")[0].trim();
}

// =====================================================
// Ride Card Component (BlaBlaCar Style + Image + Requests)
// =====================================================
function RideCard({ ride, onAction }: { ride: any; onAction: any }) {
  const [expanded, setExpanded] = useState(ride.pendingCount > 0);
  const durationText = formatDuration(ride.estimatedDuration);
  const dropTime = ride.estimatedDuration ? calculateDropTime(ride.departureTime, ride.estimatedDuration) : "";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow duration-300 overflow-hidden break-inside-avoid relative
        ${ride.isExpired ? "bg-gray-50 opacity-60 pointer-events-none select-none" : "bg-white"}`}
    >
      {/* Expired overlay badge */}
      {ride.isExpired && (
        <div className="absolute top-4 right-4 z-20 bg-red-100 text-red-600 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
          Expired
        </div>
      )}

      <div className={`p-6 ${ride.isExpired ? "cursor-default" : "cursor-pointer"}`} onClick={() => !ride.isExpired && routerPush(`/rides/${ride.id}`)}>
        {/* Top line: Date */}
        <h2 className={`text-[20px] font-extrabold mb-6 ${ride.isExpired ? "text-gray-400" : "text-[#054752]"}`}>
          {formatDateLabel(ride.departureDate)}
        </h2>

        {/* Timeline Row */}
        <div className="flex items-center w-full px-1">
          {/* Pick Up */}
          <div className="flex flex-col items-start min-w-[70px]">
            <span className={`font-extrabold text-[17px] ${ride.isExpired ? "text-gray-400" : "text-[#054752]"}`}>{ride.departureTime}</span>
            <span className={`font-bold text-[15px] mt-3 whitespace-nowrap ${ride.isExpired ? "text-gray-400" : "text-[#054752]"}`}>{shortLoc(ride.pickupLocation)}</span>
          </div>

          {/* Line / Duration */}
          <div className="flex-1 flex items-center justify-center mx-4 -mt-8 relative">
            <div className="w-full flex items-center">
              <div className={`w-2 h-2 rounded-full border-2 bg-white ring-4 ring-white z-10 ${ride.isExpired ? "border-gray-300" : "border-[#708C91]"}`}></div>
              <div className={`flex-1 h-[2px] ${ride.isExpired ? "bg-gray-200" : "bg-[#E2E8F0]"}`}></div>
              <span className={`px-2 text-[14px] font-semibold bg-white z-10 shrink-0 ${ride.isExpired ? "text-gray-300 bg-gray-50" : "text-[#708C91]"}`}>
                {durationText}
              </span>
              <div className={`flex-1 h-[2px] ${ride.isExpired ? "bg-gray-200" : "bg-[#E2E8F0]"}`}></div>
              <div className={`w-2 h-2 rounded-full border-2 bg-white ring-4 ring-white z-10 ${ride.isExpired ? "border-gray-300" : "border-[#708C91]"}`}></div>
            </div>
          </div>

          {/* Drop Off */}
          <div className="flex flex-col items-end min-w-[70px]">
            <span className={`font-extrabold text-[17px] ${ride.isExpired ? "text-gray-400" : "text-[#054752]"}`}>{dropTime}</span>
            <span className={`font-bold text-[15px] mt-3 whitespace-nowrap ${ride.isExpired ? "text-gray-400" : "text-[#054752]"}`}>{shortLoc(ride.dropLocation)}</span>
          </div>
        </div>
      </div>

      {/* Footer / Passengers / Requests */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-[#FAFBFC]/50">
        <div className="flex items-center gap-3">
          {/* Add the newly verified car image if it exists */}
          {ride.vehicleImageUrl ? (
            <img 
              src={ride.vehicleImageUrl} 
              alt="Car" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#F0F7FF] flex items-center justify-center border-2 border-white shadow-sm">
              <Car className="w-5 h-5 text-[#0553BA]" />
            </div>
          )}
          
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[#054752]">
              {ride.vehicleModel}
            </span>
            <span className="text-[13px] font-semibold text-[#708C91]">
              Passengers
            </span>
          </div>
        </div>

        {/* Requests Toggle / Indicator */}
        {ride.requests && ride.requests.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer
              ${ride.pendingCount > 0 
                ? "bg-red-50 text-red-600 hover:bg-red-100" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {ride.pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 border-r border-red-200 pr-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {ride.pendingCount} pending
              </span>
            ) : null}
            <span>{ride.requests.length} total</span>
            {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        )}
      </div>

      {/* Expanded Requests Section */}
      <AnimatePresence>
        {expanded && ride.requests && ride.requests.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white"
          >
            {ride.requests.map((req: any) => (
              <div key={req.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 last:border-0 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0553BA]/10 flex items-center justify-center shrink-0">
                    <UserRound className="w-5 h-5 text-[#0553BA]" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#054752]">{req.riderName}</h4>
                    <p className="text-[13px] text-[#708C91] font-medium leading-tight mt-0.5">
                      {req.requestedSeats} seat{req.requestedSeats > 1 ? "s" : ""}
                      {req.message && ` · "${req.message}"`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto pl-13 sm:pl-0">
                  {req.status === "pending" ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAction(ride.id, req.id, "approve"); }}
                        className="px-4 py-2 bg-green-500 text-white rounded-full text-[13px] font-bold hover:bg-green-600 transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAction(ride.id, req.id, "reject"); }}
                        className="px-4 py-2 bg-[#F5F5F5] text-red-600 rounded-full text-[13px] font-bold hover:bg-red-50 transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span className={`px-3 py-1.5 rounded-full text-[12px] font-extrabold uppercase tracking-wide
                      ${req.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Add simple routing push helper
function routerPush(url: string) {
  window.location.href = url;
}
