"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Car, Users, IndianRupee,
  Music, Cigarette, Dog, UserRound, Luggage, ChevronRight,
  ChevronLeft, ArrowRight, CheckCircle2, Loader2, StickyNote,
  CircleDot, Navigation, Camera, Upload, X, ShieldCheck, AlertTriangle
} from "lucide-react";
import StepProgress from "@/components/ui/step-progress";
import LocationAutocomplete from "@/components/ui/location-autocomplete";
import MapView from "@/components/ui/map-view";
import type { RouteOption } from "@/components/ui/map-view";
import DatePicker from "@/components/ui/date-picker";
import TimePicker from "@/components/ui/time-picker";

const STEPS = ["Route", "Schedule", "Vehicle", "Preferences", "Review"];

interface LocationData {
  displayName: string;
  lat: string;
  lng: string;
}

interface RideFormData {
  pickup: LocationData | null;
  drop: LocationData | null;
  estimatedDistance: number;
  estimatedDuration: number;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  vehicleCapacity: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleImageUrl: string;
  vehicleImageId: string;
  pricePerSeat: number;
  smokingAllowed: number;
  musicAllowed: number;
  petsAllowed: number;
  femaleOnly: number;
  luggageSize: string;
  additionalNotes: string;
}

const initialFormData: RideFormData = {
  pickup: null,
  drop: null,
  estimatedDistance: 0,
  estimatedDuration: 0,
  departureDate: "",
  departureTime: "",
  totalSeats: 3,
  vehicleCapacity: 4,
  vehicleModel: "",
  vehiclePlate: "",
  vehicleImageUrl: "",
  vehicleImageId: "",
  pricePerSeat: 200,
  smokingAllowed: 0,
  musicAllowed: 1,
  petsAllowed: 0,
  femaleOnly: 0,
  luggageSize: "medium",
  additionalNotes: "",
};

export default function PublishRidePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RideFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Sync user on first load
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

  const updateField = useCallback(<K extends keyof RideFormData>(key: K, value: RideFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return !!(formData.pickup && formData.drop);
      case 1: return !!(formData.departureDate && formData.departureTime);
      case 2: return !!(formData.vehicleModel && formData.vehiclePlate && formData.totalSeats > 0);
      case 3: return formData.pricePerSeat > 0;
      case 4: return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupLocation: formData.pickup!.displayName,
          dropLocation: formData.drop!.displayName,
          pickupLat: formData.pickup!.lat,
          pickupLng: formData.pickup!.lng,
          dropLat: formData.drop!.lat,
          dropLng: formData.drop!.lng,
          departureDate: formData.departureDate,
          departureTime: formData.departureTime,
          seatsToOffer: formData.totalSeats,
          vehicleModel: formData.vehicleModel,
          vehicleCapacity: formData.vehicleCapacity,
          vehiclePlate: formData.vehiclePlate,
          vehicleImageUrl: formData.vehicleImageUrl,
          vehicleImageId: formData.vehicleImageId,
          pricePerSeat: formData.pricePerSeat,
          smokingAllowed: formData.smokingAllowed,
          musicAllowed: formData.musicAllowed,
          petsAllowed: formData.petsAllowed,
          femaleOnly: formData.femaleOnly,
          luggageSize: formData.luggageSize,
          additionalNotes: formData.additionalNotes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish ride");
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 text-[#0553BA] animate-spin" />
      </div>
    );
  }

  // Step slide animation variants
  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] relative">
      {/* Brand Logo (Absolute, does not affect scroll layout) */}
      <div className="absolute top-4 left-4 md:top-6 md:left-8 z-10">
        <Link href="/">
          <Image src="/logo-transparent.png" alt="Carvaan Go" width={180} height={54} className="h-[36px] md:h-[44px] w-auto object-contain" priority />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-4 md:pt-16 md:pb-6 relative z-0">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-extrabold text-[#054752] tracking-tight">
            Publish a ride
          </h1>
          <p className="text-[#708C91] font-medium text-sm mt-0.5">
            Share your ride, cut your costs. In just 5 easy steps.
          </p>
        </div>

        {/* Step progress with driving car */}
        <StepProgress steps={STEPS} currentStep={currentStep} />

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mt-2">
          {/* Success state */}
          {submitSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 px-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
              </motion.div>
              <h2 className="text-2xl font-extrabold text-[#054752] mb-2">Ride Published! 🎉</h2>
              <p className="text-[#708C91] font-medium text-center">
                Your ride is now visible to nearby riders. You'll be notified when someone requests to join.
              </p>
              <p className="text-sm text-[#0553BA] font-semibold mt-4">Redirecting to dashboard...</p>
            </motion.div>
          ) : (
            <>
              {/* Step content */}
              <div className="p-5 md:p-6 min-h-[340px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {currentStep === 0 && (
                      <StepRoute formData={formData} updateField={updateField} />
                    )}
                    {currentStep === 1 && (
                      <StepSchedule formData={formData} updateField={updateField} />
                    )}
                    {currentStep === 2 && (
                      <StepVehicle formData={formData} updateField={updateField} />
                    )}
                    {currentStep === 3 && (
                      <StepPreferences formData={formData} updateField={updateField} />
                    )}
                    {currentStep === 4 && (
                      <StepReview formData={formData} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Error */}
              {submitError && (
                <div className="mx-6 md:mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
                  {submitError}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-[#FAFBFC] border-t border-gray-100 rounded-b-3xl">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer
                    ${currentStep === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#054752] hover:bg-gray-100"
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={goNext}
                    disabled={!canProceed()}
                    className={`flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all cursor-pointer
                      ${canProceed()
                        ? "bg-[#0553BA] text-white hover:bg-[#033B85] shadow-md hover:shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Publish Ride
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STEP 1: Route (Split layout: form left, map right)
// =====================================================
function StepRoute({
  formData,
  updateField,
}: {
  formData: RideFormData;
  updateField: <K extends keyof RideFormData>(key: K, value: RideFormData[K]) => void;
}) {
  const [multiRoutes, setMultiRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch multiple routes when both pickup & drop are set
  useEffect(() => {
    if (!formData.pickup || !formData.drop) {
      setMultiRoutes([]);
      setSelectedRouteId("");
      return;
    }

    const fetchRoutes = async () => {
      setRouteLoading(true);
      try {
        const res = await fetch(
          `/api/route?pickup_lat=${formData.pickup!.lat}&pickup_lng=${formData.pickup!.lng}&drop_lat=${formData.drop!.lat}&drop_lng=${formData.drop!.lng}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            setMultiRoutes(data.routes);
            // Auto-select the fastest route
            setSelectedRouteId(data.routes[0].id);
            updateField("estimatedDistance", data.routes[0].distance);
            updateField("estimatedDuration", data.routes[0].duration);
          }
        }
      } catch (err) {
        console.error("Failed to fetch routes:", err);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoutes();
  }, [formData.pickup, formData.drop]);

  // Handle route selection
  const handleRouteSelect = useCallback(
    (routeId: string) => {
      setSelectedRouteId(routeId);
      const route = multiRoutes.find((r) => r.id === routeId);
      if (route) {
        updateField("estimatedDistance", route.distance);
        updateField("estimatedDuration", route.duration);
      }
    },
    [multiRoutes, updateField]
  );

  // Handle marker drag end — always reverse geocode for precise location name
  const handleMarkerDragEnd = useCallback(
    async (markerLabel: string, lngLat: { lng: number; lat: number }) => {
      setIsDragging(true);
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${lngLat.lat}&lng=${lngLat.lng}`
        );
        if (res.ok) {
          const data = await res.json();
          const locationData: LocationData = {
            displayName: data.displayName,
            lat: String(lngLat.lat),
            lng: String(lngLat.lng),
          };
          if (markerLabel === "Pickup") {
            updateField("pickup", locationData);
          } else if (markerLabel === "Drop") {
            updateField("drop", locationData);
          }
        } else {
          // Reverse geocode failed — still update coordinates
          const existing = markerLabel === "Pickup" ? formData.pickup : formData.drop;
          if (existing) {
            const locationData: LocationData = {
              displayName: existing.displayName,
              lat: String(lngLat.lat),
              lng: String(lngLat.lng),
            };
            if (markerLabel === "Pickup") {
              updateField("pickup", locationData);
            } else {
              updateField("drop", locationData);
            }
          }
        }
      } catch (err) {
        console.error("Reverse geocode failed:", err);
      } finally {
        setIsDragging(false);
      }
    },
    [updateField, formData.pickup, formData.drop]
  );

  const selectedRoute = multiRoutes.find((r) => r.id === selectedRouteId);

  const markers = [];
  if (formData.pickup) {
    markers.push({
      lat: parseFloat(formData.pickup.lat),
      lng: parseFloat(formData.pickup.lng),
      label: "Pickup",
      color: "green" as const,
    });
  }
  if (formData.drop) {
    markers.push({
      lat: parseFloat(formData.drop.lat),
      lng: parseFloat(formData.drop.lng),
      label: "Drop",
      color: "red" as const,
    });
  }

  const formatDuration = (mins: number) =>
    mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${mins} min`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Form inputs */}
      <div>
        <h2 className="text-xl font-extrabold text-[#054752] mb-1">Where are you going?</h2>
        <p className="text-[#708C91] font-medium text-sm mb-6">Enter your pickup and drop-off locations</p>

        <div className="space-y-4">
          {/* Pickup */}
          <div>
            <label className="block text-xs font-bold text-[#708C91] uppercase tracking-wider mb-2">Pickup point</label>
            <LocationAutocomplete
              placeholder="e.g. Hinjewadi Phase 1, Pune"
              value={formData.pickup?.displayName || ""}
              onSelect={(result) => updateField("pickup", result)}
              icon={<CircleDot className="w-5 h-5 text-green-500 flex-shrink-0" />}
            />
          </div>

          {/* Drop */}
          <div>
            <label className="block text-xs font-bold text-[#708C91] uppercase tracking-wider mb-2">Drop-off point</label>
            <LocationAutocomplete
              placeholder="e.g. Shivaji Nagar, Mumbai"
              value={formData.drop?.displayName || ""}
              onSelect={(result) => updateField("drop", result)}
              icon={<Navigation className="w-5 h-5 text-red-500 flex-shrink-0" />}
            />
          </div>
        </div>

        {/* Selection summary */}
        {(formData.pickup || formData.drop) && (
          <div className="mt-5 bg-[#F5F7FA] rounded-xl p-4 space-y-2">
            {formData.pickup && (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-sm font-bold text-[#054752] truncate">{formData.pickup.displayName.split(',')[0]}</span>
              </div>
            )}
            {formData.pickup && formData.drop && (
              <div className="ml-[4px] w-[1px] h-3 border-l-2 border-dashed border-[#0553BA]/30" />
            )}
            {formData.drop && (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-red-500 flex-shrink-0" />
                <span className="text-sm font-bold text-[#054752] truncate">{formData.drop.displayName.split(',')[0]}</span>
              </div>
            )}

            {/* Loading */}
            {(routeLoading || isDragging) && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                <Loader2 className="w-4 h-4 text-[#0553BA] animate-spin" />
                <span className="text-xs text-[#708C91]">
                  {isDragging ? "Updating location..." : "Finding best routes..."}
                </span>
              </div>
            )}

            {/* Selected route summary */}
            {selectedRoute && !routeLoading && !isDragging && (
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0553BA]" />
                  <span className="text-sm font-bold text-[#054752]">{selectedRoute.distance} km</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0553BA]" />
                  <span className="text-sm font-bold text-[#054752]">
                    {formatDuration(selectedRoute.duration)}
                  </span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: selectedRoute.color + '18', color: selectedRoute.color }}
                >
                  {selectedRoute.tag}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Live interactive map */}
      {markers.length > 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-[#F5F7FA] h-[480px]">
          <MapView
            markers={markers}
            multiRoutes={multiRoutes.length > 0 ? multiRoutes : undefined}
            selectedRouteId={selectedRouteId}
            onRouteSelect={handleRouteSelect}
            draggableMarkers={true}
            onMarkerDragEnd={handleMarkerDragEnd}
            zoom={markers.length > 1 ? 8 : 12}
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-[#F5F7FA] min-h-[350px] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
              <MapPin className="w-8 h-8 text-[#0553BA]/40" />
            </div>
            <p className="text-sm font-semibold text-[#708C91]">Select locations to see them on the map</p>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// STEP 2: Schedule
// =====================================================
function StepSchedule({
  formData,
  updateField,
}: {
  formData: RideFormData;
  updateField: <K extends keyof RideFormData>(key: K, value: RideFormData[K]) => void;
}) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h2 className="text-xl font-extrabold text-[#054752] mb-1">When are you leaving?</h2>
      <p className="text-[#708C91] font-medium text-sm mb-6">Pick a date and time for your ride</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-[#054752] mb-2">
              <Calendar className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
              Departure Date
            </label>
            <DatePicker
              value={formData.departureDate}
              onChange={(val) => updateField("departureDate", val)}
              minDate={new Date(today)}
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-bold text-[#054752] mb-2">
              <Clock className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
              Departure Time
            </label>
            <TimePicker
              value={formData.departureTime}
              onChange={(val) => updateField("departureTime", val)}
            />
          </div>
        </div>

        {/* Quick time selector */}
        <div>
          <span className="text-xs font-bold text-[#708C91] uppercase tracking-wider">Quick select</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateField("departureTime", t)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer
                  ${formData.departureTime === t
                    ? "bg-[#0553BA] text-white"
                    : "bg-[#F0F7FF] text-[#0553BA] hover:bg-[#E2F0FF]"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STEP 3: Vehicle
// =====================================================
function StepVehicle({
  formData,
  updateField,
}: {
  formData: RideFormData;
  updateField: <K extends keyof RideFormData>(key: K, value: RideFormData[K]) => void;
}) {
  const [uploadState, setUploadState] = useState<"idle" | "validating" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview if form already has an image
  useEffect(() => {
    if (formData.vehicleImageUrl && !previewUrl) {
      setPreviewUrl(formData.vehicleImageUrl);
      setUploadState("done");
    }
  }, [formData.vehicleImageUrl, previewUrl]);

  // Reset verification when vehicle model changes
  const prevModelRef = useRef(formData.vehicleModel);
  useEffect(() => {
    if (prevModelRef.current !== formData.vehicleModel && (uploadState === "done" || uploadState === "error")) {
      // Model name changed after verification — reset
      updateField("vehicleImageUrl", "");
      updateField("vehicleImageId", "");
      setPreviewUrl(null);
      setUploadState("idle");
      setErrorMsg("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    prevModelRef.current = formData.vehicleModel;
  }, [formData.vehicleModel, uploadState, updateField]);

  const isUploadEnabled = formData.vehicleModel.trim().length >= 2;

  const handleFile = async (file: File) => {
    if (!isUploadEnabled) return;

    // Reset state
    setErrorMsg("");
    setUploadState("validating");

    // Create local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      // Step 1: Validate with Groq Vision AI
      const validateForm = new FormData();
      validateForm.append("file", file);
      validateForm.append("vehicleModel", formData.vehicleModel);

      const validateRes = await fetch("/api/validate-car-image", {
        method: "POST",
        body: validateForm,
      });

      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setUploadState("error");
        setErrorMsg(validateData.reason || "This doesn't look like a car photo");
        setPreviewUrl(null);
        URL.revokeObjectURL(localPreview);
        return;
      }

      // Step 2: Upload to Appwrite
      setUploadState("uploading");

      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch("/api/upload-car-image", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();

      if (uploadData.error) {
        setUploadState("error");
        setErrorMsg(uploadData.error);
        return;
      }

      // Success → store in form state
      updateField("vehicleImageUrl", uploadData.fileUrl);
      updateField("vehicleImageId", uploadData.fileId);
      
      const capacity = validateData.vehicleCapacity || 4;
      updateField("vehicleCapacity", capacity);
      
      // Auto-correct seats if the user previously selected more than the car holds
      if (formData.totalSeats > capacity - 1) {
        updateField("totalSeats", Math.max(1, capacity - 1));
      }

      setUploadState("done");
      // Keep the local preview — Appwrite URL is stored in formData for the DB
      // but may not be publicly viewable for immediate preview
      if (!previewUrl) setPreviewUrl(uploadData.fileUrl);
    } catch {
      setUploadState("error");
      setErrorMsg("Something went wrong. Please try again.");
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    updateField("vehicleImageUrl", "");
    updateField("vehicleImageId", "");
    setPreviewUrl(null);
    setUploadState("idle");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploadEnabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (isUploadEnabled) setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div>
      <h2 className="text-xl font-extrabold text-[#054752] mb-1">Vehicle details</h2>
      <p className="text-[#708C91] font-medium text-sm mb-5">Tell riders about your vehicle</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: Form Fields ─────────────────────── */}
        <div className="space-y-5">
          {/* Vehicle model */}
          <div>
            <label className="block text-sm font-bold text-[#054752] mb-2">
              <Car className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
              Vehicle Model
            </label>
            <input
              type="text"
              value={formData.vehicleModel}
              onChange={(e) => updateField("vehicleModel", e.target.value)}
              placeholder="e.g. Maruti Swift, Hyundai Creta"
              className="w-full h-[52px] px-4 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl text-[15px] font-semibold text-[#054752] placeholder:text-[#708C91] placeholder:font-medium outline-none focus:border-[#0553BA] focus:ring-2 focus:ring-[#0553BA]/10 transition-all"
            />
          </div>

          {/* License plate */}
          <div>
            <label className="block text-sm font-bold text-[#054752] mb-2">
              License Plate
            </label>
            <input
              type="text"
              value={formData.vehiclePlate}
              onChange={(e) => updateField("vehiclePlate", e.target.value.toUpperCase())}
              placeholder="e.g. MH12 AB 1234"
              className="w-full h-[52px] px-4 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl text-[15px] font-semibold text-[#054752] placeholder:text-[#708C91] placeholder:font-medium placeholder:normal-case outline-none focus:border-[#0553BA] focus:ring-2 focus:ring-[#0553BA]/10 transition-all uppercase tracking-wider"
            />
          </div>

          {/* Seats */}
          <div>
            <label className="block text-sm font-bold text-[#054752] mb-2">
              <Users className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
              Seats to Offer
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => formData.totalSeats > 1 && updateField("totalSeats", formData.totalSeats - 1)}
                className="w-12 h-12 rounded-full bg-[#F0F7FF] text-[#0553BA] font-bold text-xl flex items-center justify-center hover:bg-[#E2F0FF] transition-colors cursor-pointer"
              >
                −
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(1, formData.vehicleCapacity - 1) }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    className={`w-3 h-8 rounded-sm transition-all duration-200 ${n <= formData.totalSeats ? "bg-[#0553BA]" : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <span className="text-2xl font-extrabold text-[#054752] min-w-[32px] text-center">
                {formData.totalSeats}
              </span>
              <button
                type="button"
                onClick={() => formData.totalSeats < (formData.vehicleCapacity - 1) && updateField("totalSeats", formData.totalSeats + 1)}
                className="w-12 h-12 rounded-full bg-[#F0F7FF] text-[#0553BA] font-bold text-xl flex items-center justify-center hover:bg-[#E2F0FF] transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Car Photo Upload ──────────────── */}
        <div className="flex flex-col">
          <label className="block text-sm font-bold text-[#054752] mb-2">
            <Camera className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
            Car Photo
            <span className="ml-1 text-xs font-normal text-[#708C91]">(AI verified)</span>
          </label>

          {/* Upload Zone / Preview */}
          {uploadState === "done" && previewUrl ? (
            /* ── Photo Preview (verified) ── */
            <div className="relative flex-1 min-h-[200px] rounded-2xl overflow-hidden border-2 border-emerald-300 bg-emerald-50/30 group">
              <img
                src={previewUrl}
                alt="Your car"
                className="w-full h-full object-cover rounded-2xl"
                style={{ minHeight: 200 }}
              />
              {/* Verified badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI Verified
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ── Upload Drop Zone ── */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => isUploadEnabled && uploadState !== "validating" && uploadState !== "uploading" && fileInputRef.current?.click()}
              className={`
                flex-1 min-h-[200px] rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3
                ${!isUploadEnabled
                  ? "border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-60"
                  : isDragging
                    ? "border-[#0553BA] bg-[#0553BA]/5 scale-[1.02] cursor-pointer"
                    : uploadState === "error"
                      ? "border-red-300 bg-red-50/50 hover:border-red-400 cursor-pointer"
                      : "border-[#E2E8F0] bg-[#F5F7FA]/50 hover:border-[#0553BA]/40 hover:bg-[#F0F7FF]/50 cursor-pointer"
                }
              `}
            >
              {!isUploadEnabled ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <Car className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Enter vehicle model first</p>
                  <p className="text-xs text-gray-300 text-center">
                    Type your car model above to<br />unlock photo upload
                  </p>
                </>
              ) : uploadState === "validating" ? (
                <>
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-xl opacity-60" />
                  )}
                  <Loader2 className="w-6 h-6 text-[#0553BA] animate-spin" />
                  <p className="text-sm font-semibold text-[#0553BA]">CarvaanGo AI is analyzing...</p>
                  <p className="text-xs text-[#708C91] text-center">Verifying &quot;{formData.vehicleModel}&quot;<br />This may take a moment</p>
                </>
              ) : uploadState === "uploading" ? (
                <>
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-xl opacity-60" />
                  )}
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <p className="text-sm font-semibold text-emerald-600">Verified ✓ Uploading...</p>
                </>
              ) : uploadState === "error" ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-red-600">Upload Rejected</p>
                  <p className="text-xs text-red-500 text-center max-w-[220px]">{errorMsg}</p>
                  <p className="text-xs text-[#708C91] mt-1">Click to try another photo</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#F0F7FF] flex items-center justify-center">
                    <Upload className="w-7 h-7 text-[#0553BA]" />
                  </div>
                  <p className="text-sm font-bold text-[#054752]">Upload {formData.vehicleModel} photo</p>
                  <p className="text-xs text-[#708C91] text-center">
                    Drag & drop or click to browse<br />
                    JPG, PNG, WebP · Max 5MB
                  </p>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                disabled={!isUploadEnabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          <p className="text-[10px] text-[#708C91] mt-2 leading-tight">
            {isUploadEnabled
              ? `Upload an exterior photo of your ${formData.vehicleModel}. CarvaanGo AI will verify it matches your vehicle.`
              : "Enter your vehicle model above to enable photo upload."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STEP 4: Preferences & Price
// =====================================================
function StepPreferences({
  formData,
  updateField,
}: {
  formData: RideFormData;
  updateField: <K extends keyof RideFormData>(key: K, value: RideFormData[K]) => void;
}) {
  // Dynamic Pricing Logic based on calculated route distance (India/Carpooling rates)
  const distance = formData.estimatedDistance || 10; 
  
  // Clean rounding to nearest 10 (e.g. 224 -> 220)
  const round10 = (val: number) => Math.round(val / 10) * 10;

  const minPrice = Math.max(50, round10(distance * 1.5));
  const maxPrice = Math.max(100, round10(distance * 6));
  const recommendedPrice = Math.max(50, round10(distance * 3.5));

  useEffect(() => {
    // Auto-adjust price if entirely out of newly calculated bounds
    if (formData.pricePerSeat < minPrice || formData.pricePerSeat > maxPrice) {
      updateField("pricePerSeat", recommendedPrice);
    }
  }, [distance, minPrice, maxPrice, recommendedPrice, formData.pricePerSeat, updateField]);

  const togglePrefs = [
    { key: "musicAllowed" as const, label: "Music", icon: Music, activeColor: "text-[#0553BA]" },
    { key: "smokingAllowed" as const, label: "Smoking", icon: Cigarette, activeColor: "text-orange-500" },
    { key: "petsAllowed" as const, label: "Pets", icon: Dog, activeColor: "text-amber-600" },
    { key: "femaleOnly" as const, label: "Female only", icon: UserRound, activeColor: "text-pink-500" },
  ];

  return (
    <div>
      <h2 className="text-xl font-extrabold text-[#054752] mb-1">Preferences & pricing</h2>
      <p className="text-[#708C91] font-medium text-sm mb-6">Set your ride rules and price</p>

      {/* Price */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-[#054752] mb-2">
          <IndianRupee className="w-4 h-4 inline-block mr-1 text-[#0553BA]" />
          Price per seat (INR)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={10}
            value={formData.pricePerSeat}
            onChange={(e) => updateField("pricePerSeat", parseInt(e.target.value))}
            className="flex-1 accent-[#0553BA] h-2 cursor-pointer"
          />
          <div className="flex items-center bg-[#F0F7FF] rounded-2xl px-4 py-2 min-w-[100px] justify-center">
            <IndianRupee className="w-4 h-4 text-[#0553BA]" />
            <span className="text-xl font-extrabold text-[#0553BA]">{formData.pricePerSeat}</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-[#708C91] font-medium mt-1">
          <span>₹{minPrice}</span>
          <span>₹{maxPrice}</span>
        </div>
      </div>

      <hr className="border-gray-100 border-t-2 my-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Toggles */}
        <div>
          <label className="block text-sm font-bold text-[#054752] mb-3">
            Ride Preferences
          </label>
          <div className="grid grid-cols-2 gap-3">
            {togglePrefs.map(({ key, label, icon: Icon, activeColor }) => {
              const isOn = formData[key] === 1;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateField(key, isOn ? 0 : 1)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer
                    ${isOn
                      ? "border-[#0553BA] bg-[#F0F7FF]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isOn ? activeColor : "text-gray-400"}`} />
                  <span className={`text-[13px] font-bold ${isOn ? "text-[#054752]" : "text-gray-400"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Luggage */}
        <div>
          <label className="block text-sm font-bold text-[#054752] mb-3">
            <Luggage className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
            Luggage Space
          </label>
          <div className="flex flex-col gap-3">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updateField("luggageSize", size)}
                className={`flex-1 py-3 px-4 rounded-2xl border-2 font-bold text-sm capitalize transition-all cursor-pointer flex items-center justify-center
                  ${formData.luggageSize === size
                    ? "border-[#0553BA] bg-[#F0F7FF] text-[#0553BA]"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <hr className="border-gray-100 border-t-2 my-8" />

      {/* Notes */}
      <div>
        <label className="block text-sm font-bold text-[#054752] mb-2">
          <StickyNote className="w-4 h-4 inline-block mr-2 text-[#0553BA]" />
          Additional Notes <span className="font-normal text-[#708C91]">(optional)</span>
        </label>
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => updateField("additionalNotes", e.target.value)}
          placeholder="Any specific instructions for riders..."
          rows={3}
          className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl text-[15px] font-medium text-[#054752] placeholder:text-[#708C91] outline-none focus:border-[#0553BA] focus:ring-2 focus:ring-[#0553BA]/10 transition-all resize-none"
        />
      </div>
    </div>
  );
}

// =====================================================
// STEP 5: Review
// =====================================================
function StepReview({ formData }: { formData: RideFormData }) {
  const markers = [];
  if (formData.pickup) {
    markers.push({
      lat: parseFloat(formData.pickup.lat),
      lng: parseFloat(formData.pickup.lng),
      label: "Pickup",
      color: "green" as const,
    });
  }
  if (formData.drop) {
    markers.push({
      lat: parseFloat(formData.drop.lat),
      lng: parseFloat(formData.drop.lng),
      label: "Drop",
      color: "red" as const,
    });
  }

  const shortLoc = (loc: string) => {
    const parts = loc.split(",");
    return parts.length > 1 ? parts[0].trim() : loc;
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d + "T00:00").toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-[#054752] mb-1">Review your ride</h2>
      <p className="text-[#708C91] font-medium text-sm mb-6">Everything look good? Hit publish!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left: Summary card */}
        <div className="bg-[#FAFBFC] rounded-2xl p-5 space-y-4 flex flex-col justify-center order-2 md:order-1">
        {/* Route */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#0553BA] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-extrabold text-[#054752]">
              {formData.pickup ? shortLoc(formData.pickup.displayName) : "—"}
            </p>
            <p className="text-xs text-[#708C91] font-medium">↓</p>
            <p className="text-sm font-extrabold text-[#054752]">
              {formData.drop ? shortLoc(formData.drop.displayName) : "—"}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Date & time */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#0553BA] flex-shrink-0" />
          <span className="text-sm font-bold text-[#054752]">
            {formatDate(formData.departureDate)} at {formData.departureTime}
          </span>
        </div>

        {/* Vehicle */}
        <div className="flex gap-3">
          <Car className="w-5 h-5 text-[#0553BA] flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#054752]">
              {formData.vehicleModel} · {formData.vehiclePlate}
            </span>
            {formData.vehicleImageUrl && (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm mt-1">
                <img 
                  src={formData.vehicleImageUrl} 
                  alt="Car Exterior" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Verified
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seats & Price */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0553BA] flex-shrink-0" />
            <span className="text-sm font-bold text-[#054752]">
              {formData.totalSeats} seats
            </span>
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-4 h-4 text-[#0553BA]" />
            <span className="text-sm font-extrabold text-[#0553BA]">{formData.pricePerSeat}</span>
            <span className="text-xs text-[#708C91] font-medium">/seat</span>
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap gap-2">
          {formData.musicAllowed === 1 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-[#F0F7FF] rounded-full text-xs font-bold text-[#0553BA]">
              <Music className="w-3 h-3" /> Music
            </span>
          )}
          {formData.smokingAllowed === 1 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full text-xs font-bold text-orange-600">
              <Cigarette className="w-3 h-3" /> Smoking
            </span>
          )}
          {formData.petsAllowed === 1 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-600">
              <Dog className="w-3 h-3" /> Pets
            </span>
          )}
          {formData.femaleOnly === 1 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-pink-50 rounded-full text-xs font-bold text-pink-500">
              <UserRound className="w-3 h-3" /> Female only
            </span>
          )}
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-[#054752]">
            <Luggage className="w-3 h-3" /> {formData.luggageSize} luggage
          </span>
        </div>

        {formData.additionalNotes && (
          <>
            <div className="h-px bg-gray-200" />
            <p className="text-sm text-[#708C91] font-medium italic">"{formData.additionalNotes}"</p>
          </>
        )}
        </div>

        {/* Right: Map */}
        <div className="order-1 md:order-2 h-[220px] md:h-auto min-h-[260px] flex">
          {markers.length > 0 && (
            <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-[#F5F7FA]">
              <MapView markers={markers} zoom={8} className="w-full h-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
