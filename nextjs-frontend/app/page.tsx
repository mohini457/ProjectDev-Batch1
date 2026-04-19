"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Calendar, User, ChevronRight, CheckCircle2, ShieldCheck, Zap, PlusCircle, Circle, Luggage, Coins, Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Globe } from "@/components/ui/globe";
import { StarsBackground } from "@/components/ui/stars";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AnimatedRoadmap } from "@/components/ui/animated-roadmap";
import LocationAutocomplete from "@/components/ui/location-autocomplete";
import SearchPillDatePicker from "@/components/ui/search-pill-date-picker";


const globeMarkers = [
  { id: "nyc", location: [40.7128, -74.0060] as [number, number], image: "/globe-image/carpooling1.jpg" },
  { id: "london", location: [51.5074, -0.1278] as [number, number], image: "/globe-image/carpooling2.jpg" },
  { id: "tokyo", location: [35.6762, 139.6503] as [number, number], image: "/globe-image/carpooling3.jpg" },
  { id: "sydney", location: [-33.8688, 151.2093] as [number, number], image: "/globe-image/carpooling4.jpg" },
  { id: "rio", location: [-22.9068, -43.1729] as [number, number], image: "/globe-image/carpooling5.jpg" },
  { id: "cape-town", location: [-33.9249, 18.4241] as [number, number], image: "/globe-image/carpooling6.jpg" },
  { id: "paris", location: [48.8566, 2.3522] as [number, number], image: "/globe-image/carpooling7.jpg" },
  { id: "dubai", location: [25.2048, 55.2708] as [number, number], image: "/globe-image/carpooling8.jpg" },
  { id: "mumbai", location: [19.0760, 72.8777] as [number, number], image: "/globe-image/carpooling9.jpg" },
]

// Animated connecting arcs forming a global carpool network
const globeArcs = [
  { id: "nyc-london", from: [40.7128, -74.0060] as [number, number], to: [51.5074, -0.1278] as [number, number] },
  { id: "london-dubai", from: [51.5074, -0.1278] as [number, number], to: [25.2048, 55.2708] as [number, number] },
  { id: "dubai-mumbai", from: [25.2048, 55.2708] as [number, number], to: [19.0760, 72.8777] as [number, number] },
  { id: "mumbai-tokyo", from: [19.0760, 72.8777] as [number, number], to: [35.6762, 139.6503] as [number, number] },
  { id: "tokyo-sydney", from: [35.6762, 139.6503] as [number, number], to: [-33.8688, 151.2093] as [number, number] },
]

const milestonesData = [
  {
    id: 1,
    name: "Pool Creation",
    status: "complete" as const,
    position: { top: "70%", left: "45%" },
  },
  {
    id: 2,
    name: "Intelligent Match",
    status: "complete" as const,
    position: { top: "35%", left: "60%" },
  },
  {
    id: 3,
    name: "Route Match",
    status: "in-progress" as const,
    position: { top: "55%", left: "30%" },
  },
  {
    id: 4,
    name: "Privacy Protection",
    status: "pending" as const,
    position: { top: "28%", left: "40%" },
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [from, setFrom] = useState<{ displayName: string; lat: string; lng: string } | null>(null);
  const [to, setTo] = useState<{ displayName: string; lat: string; lng: string } | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [passengers, setPassengers] = useState(1);
  const [showPassengers, setShowPassengers] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) {
      params.set("from", `${from.lat},${from.lng}`);
      params.set("fromName", from.displayName);
    }
    if (to) {
      params.set("to", `${to.lat},${to.lng}`);
      params.set("toName", to.displayName);
    }
    params.set("date", date);
    params.set("seats", String(passengers));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full flex-col flex min-h-screen bg-white">
      
      {/* Search Hero Section */}
      <section className="w-full relative flex flex-col justify-center items-center pt-4 pb-0 overflow-visible">
        {/* Blue Glow - LEFT side */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at 25% 50%, #0254A3 0%, transparent 65%), radial-gradient(ellipse at 85% 50%, #0254A3 0%, transparent 45%)`,
            opacity: 0.6,
          }}
        />
        {/* Stars Background Layer */}
        <StarsBackground
          className="absolute inset-0 z-[1]"
          starColor="#002C6F"
          speed={80}
          factor={0.05}
        />
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-0 items-center relative z-10 overflow-visible">
          <div className="flex flex-col items-start z-20 md:pr-10">
            <div className="w-max inline-flex items-center rounded-full border border-[#002C6F] bg-white p-1 shadow-sm mb-6 relative z-20">
              <div className="flex -space-x-1.5 pl-1">
                <img
                  className="rounded-full ring-2 ring-white object-cover object-center"
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  width={24}
                  height={24}
                  alt="Avatar 01"
                />
                <img
                  className="rounded-full ring-2 ring-white object-cover object-center"
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  width={24}
                  height={24}
                  alt="Avatar 02"
                />
                <img
                  className="rounded-full ring-2 ring-white object-cover object-center"
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  width={24}
                  height={24}
                  alt="Avatar 03"
                />
                <img
                  className="rounded-full ring-2 ring-white object-cover object-center"
                  src="https://randomuser.me/api/portraits/men/46.jpg"
                  width={24}
                  height={24}
                  alt="Avatar 04"
                />
              </div>
              <p className="px-3 text-sm font-medium text-[#708C91]">
                Trusted by <strong className="font-bold text-[#054752]">60K+</strong> carpoolers
              </p>
            </div>
            <h1 className="text-[32px] md:text-[48px] xl:text-[52px] leading-[1.1] font-black tracking-[-0.03em] text-[#05293C] mb-6">
               Travel anywhere<br /><span className="whitespace-nowrap">together. Spend smarter.</span>
            </h1>
          </div>

          <div className="relative w-[130%] max-w-[700px] aspect-square z-10 flex items-center justify-center mx-auto my-[-120px] overflow-visible">
             <Globe 
               markers={globeMarkers}
               arcs={globeArcs}
               speed={0.002}
               mapBrightness={8}
               markerSize={0.035}
             />
          </div>
        </div>
      </section>

      {/* Floating Comprehensive Search Pill - STICKS GLOBALLY */}
      <div className="sticky top-[80px] z-[60] w-[95%] max-w-7xl mx-auto bg-white rounded-[16px] overflow-visible search-pill-shadow flex flex-col md:flex-row items-stretch border-[2px] border-[#0553BA] mt-4 md:-mt-8 transition-all duration-300">
            
            {/* From */}
            <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-gray-200 relative">
              <LocationAutocomplete
                placeholder="Leaving from"
                value={from?.displayName || ""}
                onSelect={setFrom}
                icon={<Circle className="text-[#708C91] w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                compact
              />
            </div>

            {/* To */}
            <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-gray-200 relative">
              <LocationAutocomplete
                placeholder="Going to"
                value={to?.displayName || ""}
                onSelect={setTo}
                icon={<Circle className="text-[#708C91] w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                compact
              />
            </div>

            {/* Date */}
            <div className="w-full md:w-[180px] relative border-b md:border-b-0 md:border-r border-gray-200">
              <SearchPillDatePicker
                value={date}
                onChange={(d) => { setDate(d); setShowPassengers(false); }}
              />
            </div>

            {/* Passengers */}
            <div className="w-full md:w-[220px] relative">
              <button
                onClick={() => setShowPassengers(!showPassengers)}
                className="w-full flex items-center gap-3 px-5 py-4 md:py-0 md:h-[60px] cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <User className="text-[#708C91] w-[22px] h-[22px] flex-shrink-0" />
                <span className="text-base font-semibold text-[#054752] whitespace-nowrap">{passengers} passenger{passengers > 1 ? "s" : ""}</span>
              </button>
              {showPassengers && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[200] p-4 min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-[#054752]">Passenger</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        disabled={passengers <= 1}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-[#054752] hover:bg-gray-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-[16px] font-bold text-[#054752] w-4 text-center">{passengers}</span>
                      <button
                        onClick={() => setPassengers(Math.min(6, passengers + 1))}
                        disabled={passengers >= 6}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-[#054752] hover:bg-gray-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="w-full md:w-[160px] h-[60px] bg-[#0553BA] hover:bg-[#033B85] text-white font-bold text-lg md:text-base transition-colors cursor-pointer flex items-center justify-center md:rounded-r-[14px]"
            >
              Search
            </button>

      </div>
          
      {/* Show stays Checkbox - NON-STICKY SIBLING */}
      <div className="w-[95%] max-w-7xl mx-auto flex items-center gap-3 mt-4 mb-4 pl-6 relative z-10">
        <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#0553BA] rounded cursor-pointer" />
        <span className="text-[#054752] font-semibold text-[15px]">Show stays</span>
      </div>


      {/* 3 Core Value Props with Scroll Animation */}
      <section className="w-full bg-[#f8f9fa] overflow-hidden">
        <ContainerScroll
          titleComponent={
            <div className="pb-4 md:pb-8">
              <h2 className="text-3xl font-semibold text-[#054752] mb-2 relative z-20">
                Why choose Carvaan Go?
              </h2>
              <span className="text-4xl md:text-[4rem] font-bold mt-1 leading-none text-[#0553BA] relative z-20">
                Carpooling at its best
              </span>
            </div>
          }
        >
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full max-w-6xl">
              <div className="flex flex-col items-center text-center gap-4">
                 <div className="w-[80px] h-[80px] bg-[#f5f6f7] flex items-center justify-center rounded-full shadow-sm">
                   <Luggage className="w-10 h-10 text-[#054752]" strokeWidth={1.5} />
                 </div>
                 <h3 className="text-[22px] font-bold text-[#054752] leading-tight mt-2">Travel everywhere</h3>
                 <p className="text-[#708C91] font-medium text-[15px] leading-relaxed max-w-[250px]">
                    Explore all over India with countless carpool rides.
                 </p>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                 <div className="w-[80px] h-[80px] bg-[#f5f6f7] flex items-center justify-center rounded-full shadow-sm">
                   <Coins className="w-10 h-10 text-[#054752]" strokeWidth={1.5} />
                 </div>
                 <h3 className="text-[22px] font-bold text-[#054752] leading-tight mt-2">Prices like nowhere</h3>
                 <p className="text-[#708C91] font-medium text-[15px] leading-relaxed max-w-[250px]">
                    Benefit from great-value shared costs on your carpool rides.
                 </p>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                 <div className="w-[80px] h-[80px] bg-[#f5f6f7] flex items-center justify-center rounded-full shadow-sm">
                   <ShieldCheck className="w-10 h-10 text-[#054752]" strokeWidth={1.5} />
                 </div>
                 <h3 className="text-[22px] font-bold text-[#054752] leading-tight mt-2">Ride with confidence</h3>
                 <p className="text-[#708C91] font-medium text-[15px] leading-relaxed max-w-[250px]">
                    Feel secure, knowing you're riding with carpool members with Verified Profiles.
                 </p>
              </div>
           </div>
        </ContainerScroll>
      </section>

      {/* Share your ride Section */}
      <section className="w-full bg-[#E5F7FF] py-16 overflow-hidden relative">
         <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="flex-1">
               <h2 className="text-[32px] md:text-[40px] font-bold text-[#054752] mb-4 leading-tight">Share your ride.<br/>Cut your costs.</h2>
               <p className="text-lg text-[#054752] mb-8 font-medium max-w-md leading-relaxed">
                 Carpool as a driver to turn your empty seats into lower travel costs. It's simple: publish your ride and get passengers to share your fuel and toll expenses.
               </p>
               <Link href="/offer-seats" className="inline-block bg-[#0553BA] hover:bg-[#033B85] text-white rounded-full px-7 py-3.5 font-bold transition-colors cursor-pointer text-base">
                  Share your ride
               </Link>
            </div>
            <div className="flex-1 w-full flex justify-end overflow-visible">
               {/* Animated Roadmap overriding the plus circle */}
               <AnimatedRoadmap
                 milestones={milestonesData}
                 mapImageSrc="https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-SsfjxCJh43Hr1dqzkbFWUGH3ICZQbH.png&w=320&q=75"
                 aria-label="An animated roadmap showing project features."
                 className="py-12 md:py-16"
               />
            </div>
         </div>
         <div className="absolute top-0 right-[-10%] w-[50%] h-[150%] bg-[#cce3fb] rounded-full mix-blend-multiply opacity-50 blur-3xl pointer-events-none" />
      </section>

      {/* Never miss a carpool */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-20 flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="flex-1 w-full">
           <img 
             src="/landing-page-img.png" 
             alt="Find a ride" 
             className="w-full rounded-2xl object-cover shadow-sm"
           />
        </div>
        <div className="flex-1 flex flex-col items-start px-2">
           <h2 className="text-[32px] md:text-[40px] font-bold text-[#054752] mb-4 leading-tight">Never miss a carpool!</h2>
           <p className="text-lg text-[#708C91] mb-8 font-medium leading-relaxed">
             We know it's frustrating when you want to book in advance and don't find any rides, as drivers often publish their ride just 3 days before they go. With our new alert system, you can set up notifications and get an email and app notification as soon as a new ride is published. Stay informed and book the best seat!
           </p>
           <button className="bg-[#0553BA] hover:bg-[#033B85] text-white rounded-full px-7 py-3.5 font-bold transition-colors cursor-pointer text-base">
              Find a ride
           </button>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-12 border-t border-gray-100">
        <div className="flex-1 flex flex-col items-start px-2">
           <h2 className="text-[32px] md:text-[40px] font-bold text-[#054752] mb-6 leading-tight">Only on Carvaan Go...</h2>
           <div className="relative">
             <span className="text-[80px] leading-none font-serif text-[#0553BA] absolute -top-8 -left-4 opacity-30">"</span>
             <p className="text-2xl text-[#054752] mb-6 font-semibold leading-relaxed italic z-10 relative">
               Carpooling's great: I pay a little money to get where I'm going on time, in comfort, and in AC! And I know it's nice for the driver to get a little financial help when they're travelling alone.
             </p>
           </div>
           <p className="text-[#708C91] font-bold text-lg">Amit, from Pune</p>
        </div>
        <div className="flex-1 w-full">
           <img 
             src="https://cdn.blablacar.com/k/a/images/ugc_IN_755x411-94d4d3fd6a139120.webp" 
             alt="User testimonial" 
             className="w-full rounded-2xl object-cover shadow-sm"
           />
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 pt-16 pb-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
               <div>
                  <h3 className="font-bold text-[#054752] mb-4">Go anywhere with Carvaan Go</h3>
                  <ul className="space-y-3">
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Popular rides</a></li>
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Popular destinations</a></li>
                  </ul>
               </div>
               <div>
                  <h3 className="font-bold text-[#054752] mb-4">Travel with carpool</h3>
                  <ul className="space-y-3">
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Nashik → Pune</a></li>
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Mumbai → Pune</a></li>
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Pune → Aurangabad</a></li>
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Bengaluru → Chennai</a></li>
                  </ul>
               </div>
               <div>
                  <h3 className="font-bold text-[#054752] mb-4">Find out more</h3>
                  <ul className="space-y-3">
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">How it works</a></li>
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">About Us</a></li>
                     <li><a href="#" className="text-[#0553BA] hover:underline font-medium">Help Centre</a></li>
                  </ul>
               </div>
            </div>
            <div className="border-t border-gray-200 pt-8 flex items-center justify-center">
               <div className="text-[#708C91] font-medium text-sm">
                  Carvaan Go, 2026 © All Rights Reserved.
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
