"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Users, MapPin, X, SlidersHorizontal,
  Music, Cigarette, Dog, UserRound, Loader2, CircleDot, Navigation,
  ArrowRight, Clock, ChevronDown, Timer, Route, MapPinned, BadgeCheck,
  ArrowUpDown
} from "lucide-react";
import LocationAutocomplete from "@/components/ui/location-autocomplete";
import RideCard, { type RideCardData } from "@/components/ui/ride-card";
import SearchPillDatePicker from "@/components/ui/search-pill-date-picker";

interface LocationData {
  displayName: string;
  lat: string;
  lng: string;
}

type SortOption = "earliest" | "cheapest" | "shortest" | "closest_dep" | "closest_arr";
type TimeFilter = "before_6" | "6_12" | "12_18" | "after_18";

export default function SearchPage() {
  const searchParams = useSearchParams();

  // Pre-fill from URL params (when coming from landing page)
  const [from, setFrom] = useState<LocationData | null>(null);
  const [to, setTo] = useState<LocationData | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [seats, setSeats] = useState(1);
  const [rides, setRides] = useState<RideCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter & sort state
  const [sortBy, setSortBy] = useState<SortOption>("earliest");
  const [timeFilters, setTimeFilters] = useState<Set<TimeFilter>>(new Set());
  const [maxPrice, setMaxPrice] = useState(5000);
  const [musicOnly, setMusicOnly] = useState(false);
  const [noSmoking, setNoSmoking] = useState(false);
  const [petsOk, setPetsOk] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Initialize from URL params
  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const dateParam = searchParams.get("date");
    const seatsParam = searchParams.get("seats");
    const fromName = searchParams.get("fromName");
    const toName = searchParams.get("toName");

    if (fromParam) {
      const [lat, lng] = fromParam.split(",");
      setFrom({ displayName: fromName || "Origin", lat, lng });
    }
    if (toParam) {
      const [lat, lng] = toParam.split(",");
      setTo({ displayName: toName || "Destination", lat, lng });
    }
    if (dateParam) setDate(dateParam);
    if (seatsParam) setSeats(parseInt(seatsParam) || 1);
  }, [searchParams]);

  // Auto-search when params are loaded
  useEffect(() => {
    if (from && to) {
      doSearch();
    }
  }, [from, to]);

  const doSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (from) params.set("from", `${from.lat},${from.lng}`);
      if (to) params.set("to", `${to.lat},${to.lng}`);
      if (date) params.set("date", date);
      if (seats > 0) params.set("seats", String(seats));

      const res = await fetch(`/api/rides?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRides(data.rides || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [from, to, date, seats]);

  // Get departure hour from time string
  const getHour = (time: string) => {
    const [h] = time.split(":").map(Number);
    return h;
  };

  // Apply filters and sorting
  const filteredRides = rides
    .filter((r) => {
      if (r.pricePerSeat > maxPrice) return false;
      if (musicOnly && r.musicAllowed !== 1) return false;
      if (noSmoking && r.smokingAllowed === 1) return false;
      if (petsOk && r.petsAllowed !== 1) return false;
      if (femaleOnly && r.femaleOnly !== 1) return false;

      // Time filters
      if (timeFilters.size > 0) {
        const h = getHour(r.departureTime);
        let matchesTime = false;
        if (timeFilters.has("before_6") && h < 6) matchesTime = true;
        if (timeFilters.has("6_12") && h >= 6 && h < 12) matchesTime = true;
        if (timeFilters.has("12_18") && h >= 12 && h < 18) matchesTime = true;
        if (timeFilters.has("after_18") && h >= 18) matchesTime = true;
        if (!matchesTime) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "cheapest":
          return a.pricePerSeat - b.pricePerSeat;
        case "shortest":
          return (a.estimatedDuration || 999) - (b.estimatedDuration || 999);
        case "earliest":
        default:
          return a.departureTime.localeCompare(b.departureTime);
      }
    });

  // Count rides per time slot
  const timeCounts = {
    before_6: rides.filter((r) => getHour(r.departureTime) < 6).length,
    "6_12": rides.filter((r) => { const h = getHour(r.departureTime); return h >= 6 && h < 12; }).length,
    "12_18": rides.filter((r) => { const h = getHour(r.departureTime); return h >= 12 && h < 18; }).length,
    after_18: rides.filter((r) => getHour(r.departureTime) >= 18).length,
  };

  const toggleTime = (t: TimeFilter) => {
    setTimeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const clearFilters = () => {
    setSortBy("earliest");
    setTimeFilters(new Set());
    setMaxPrice(5000);
    setMusicOnly(false);
    setNoSmoking(false);
    setPetsOk(false);
    setFemaleOnly(false);
  };

  const formatDateLabel = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
  };

  const shortLoc = (loc: string) => loc.replace(/،/g, ",").split(",")[0].trim();

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── Search Header Bar ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 overflow-visible">
          {/* Compact search row */}
          <div className="flex items-center gap-0 h-[64px] overflow-visible">
            {/* From */}
            <div className="flex-1 min-w-0">
              <LocationAutocomplete
                placeholder="Leaving from..."
                value={from?.displayName || ""}
                onSelect={setFrom}
                icon={<CircleDot className="w-4 h-4 text-[#0553BA] flex-shrink-0" />}
                compact
              />
            </div>

            {/* Swap */}
            <button
              onClick={() => { const temp = from; setFrom(to); setTo(temp); }}
              className="w-8 h-8 flex items-center justify-center text-[#0553BA] hover:bg-[#F0F7FF] rounded-full transition-colors shrink-0 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* To */}
            <div className="flex-1 min-w-0">
              <LocationAutocomplete
                placeholder="Going to..."
                value={to?.displayName || ""}
                onSelect={setTo}
                icon={<CircleDot className="w-4 h-4 text-[#0553BA] flex-shrink-0" />}
                compact
              />
            </div>

            {/* Date */}
            <div className="hidden md:flex items-center border-l border-gray-200 h-full shrink-0 relative">
              <SearchPillDatePicker
                value={date}
                onChange={setDate}
              />
            </div>

            {/* Seats */}
            <div className="hidden md:flex items-center gap-2 px-4 border-l border-gray-200 h-full shrink-0">
              <Users className="w-4 h-4 text-[#708C91]" />
              <select
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value))}
                className="text-[14px] font-semibold text-[#054752] outline-none bg-transparent cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>

            {/* Search button */}
            <button
              onClick={doSearch}
              disabled={isLoading}
              className="h-[40px] px-6 bg-[#0553BA] text-white rounded-full font-bold text-sm hover:bg-[#033B85] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ml-3 shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Route Summary ── */}
      {hasSearched && from && to && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] text-[#054752]">
              <span className="font-bold">{formatDateLabel(date)}</span>
              <span className="text-[#708C91] mx-1">·</span>
              <span className="font-medium truncate max-w-[200px]">{shortLoc(from.displayName)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#708C91] shrink-0" />
              <span className="font-medium truncate max-w-[200px]">{shortLoc(to.displayName)}</span>
            </div>
            <span className="text-[13px] text-[#708C91] font-semibold shrink-0">
              {filteredRides.length} ride{filteredRides.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ── Left Sidebar (Filters) ── */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="sticky top-[120px] space-y-6">

              {/* Sort By */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-extrabold text-[#054752]">Sort by</h3>
                  <button onClick={clearFilters} className="text-[12px] text-[#0553BA] font-semibold hover:underline cursor-pointer">
                    Clear all
                  </button>
                </div>
                <div className="space-y-1">
                  {([
                    { key: "earliest" as SortOption, label: "Earliest departure", icon: Clock },
                    { key: "cheapest" as SortOption, label: "Lowest price", icon: ArrowRight },
                    { key: "shortest" as SortOption, label: "Shortest ride", icon: Route },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer
                        ${sortBy === key
                          ? "bg-[#F0F7FF]"
                          : "hover:bg-gray-50"
                        }`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0
                        ${sortBy === key ? "border-[#0553BA]" : "border-gray-300"}`}
                      >
                        {sortBy === key && <div className="w-[8px] h-[8px] rounded-full bg-[#0553BA]" />}
                      </div>
                      <span className={`text-[14px] font-medium flex-1 ${sortBy === key ? "text-[#054752] font-semibold" : "text-[#054752]"}`}>
                        {label}
                      </span>
                      <Icon className={`w-[18px] h-[18px] ${sortBy === key ? "text-[#0553BA]" : "text-[#708C91]"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure Time */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[15px] font-extrabold text-[#054752] mb-4">Departure time</h3>
                <div className="space-y-1">
                  {([
                    { key: "before_6" as TimeFilter, label: "Before 06:00", count: timeCounts.before_6 },
                    { key: "6_12" as TimeFilter, label: "06:00 - 12:00", count: timeCounts["6_12"] },
                    { key: "12_18" as TimeFilter, label: "12:01 - 18:00", count: timeCounts["12_18"] },
                    { key: "after_18" as TimeFilter, label: "After 18:00", count: timeCounts.after_18 },
                  ] as const).map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => toggleTime(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer
                        ${timeFilters.has(key) ? "bg-[#F0F7FF]" : "hover:bg-gray-50"}`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0
                        ${timeFilters.has(key) ? "border-[#0553BA] bg-[#0553BA]" : "border-gray-300"}`}
                      >
                        {timeFilters.has(key) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-[#054752] flex-1">{label}</span>
                      <span className="text-[13px] text-[#708C91] font-semibold">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[15px] font-extrabold text-[#054752] mb-4">Amenities</h3>
                <div className="space-y-1">
                  {[
                    { label: "Smoking allowed", state: !noSmoking, toggle: () => setNoSmoking(!noSmoking), icon: Cigarette, count: rides.filter(r => r.smokingAllowed === 1).length },
                    { label: "Pets allowed", state: petsOk, toggle: () => setPetsOk(!petsOk), icon: Dog, count: rides.filter(r => r.petsAllowed === 1).length },
                    { label: "Music allowed", state: musicOnly, toggle: () => setMusicOnly(!musicOnly), icon: Music, count: rides.filter(r => r.musicAllowed === 1).length },
                    { label: "Female only", state: femaleOnly, toggle: () => setFemaleOnly(!femaleOnly), icon: UserRound, count: rides.filter(r => r.femaleOnly === 1).length },
                  ].map(({ label, state, toggle, icon: Icon, count }) => (
                    <button
                      key={label}
                      onClick={toggle}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer
                        ${state ? "bg-[#F0F7FF]" : "hover:bg-gray-50"}`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0
                        ${state ? "border-[#0553BA] bg-[#0553BA]" : "border-gray-300"}`}
                      >
                        {state && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-[#054752] flex-1">{label}</span>
                      <span className="text-[13px] text-[#708C91] font-semibold mr-1">{count}</span>
                      <Icon className="w-[16px] h-[16px] text-[#708C91]" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust & Safety */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[15px] font-extrabold text-[#054752] mb-4">Trust and safety</h3>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F0F7FF]">
                  <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-[#0553BA] bg-[#0553BA] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[14px] font-medium text-[#054752] flex-1">Verified Profile</span>
                  <span className="text-[13px] text-[#708C91] font-semibold mr-1">{rides.length}</span>
                  <BadgeCheck className="w-[16px] h-[16px] text-[#0553BA]" />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Mobile Filter Button ── */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0553BA] text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:bg-[#033B85] transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {!hasSearched ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#F0F7FF] rounded-full flex items-center justify-center">
                  <Search className="w-10 h-10 text-[#0553BA]" />
                </div>
                <h2 className="text-xl font-extrabold text-[#054752] mb-2">Search for rides</h2>
                <p className="text-[#708C91] font-medium">Enter your route and date to find available carpools</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-20">
                <Loader2 className="w-10 h-10 text-[#0553BA] animate-spin mx-auto mb-4" />
                <p className="text-[#708C91] font-semibold">Searching rides...</p>
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-extrabold text-[#054752] mb-2">No rides found</h2>
                <p className="text-[#708C91] font-medium">
                  Try adjusting your search or check back later. Drivers often publish rides 2-3 days before.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredRides.map((ride, idx) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <RideCard ride={ride} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
