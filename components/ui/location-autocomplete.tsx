"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, Building2, Navigation } from "lucide-react";

export interface LocationResult {
  displayName: string;
  lat: string;
  lng: string;
  city?: string;
  state?: string;
  type?: string;
}

interface LocationAutocompleteProps {
  placeholder: string;
  value: string;
  onSelect: (result: LocationResult) => void;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Location input with debounced Geoapify/Nominatim autocomplete.
 * Fetches suggestions via /api/geocode proxy.
 * Shows area, city, and state for precise selection.
 */
export default function LocationAutocomplete({
  placeholder,
  value,
  onSelect,
  icon,
  className = "",
  compact = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchLocations = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setSelectedIdx(-1);
      }
    } catch (err) {
      console.error("Geocode search failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // Debounce: wait 300ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 300);
  };

  const handleSelect = (result: LocationResult) => {
    // Show a shorter version for the input
    const shortName = getShortName(result);
    setQuery(shortName);
    setIsOpen(false);
    onSelect(result);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={compact
        ? "flex items-center gap-3 px-5 py-4 md:py-0 md:h-[60px] hover:bg-gray-50 transition-colors"
        : "flex items-center gap-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl px-4 h-[52px] focus-within:border-[#0553BA] focus-within:ring-2 focus-within:ring-[#0553BA]/10 transition-all"
      }>
        {icon || <MapPin className="w-5 h-5 text-[#0553BA] flex-shrink-0" />}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={compact
            ? "flex-1 bg-transparent outline-none text-base font-semibold text-[#054752] placeholder:text-[#054752] placeholder:font-semibold min-w-0 truncate"
            : "flex-1 bg-transparent outline-none text-[15px] font-semibold text-[#054752] placeholder:text-[#708C91] placeholder:font-medium"
          }
          autoComplete="off"
        />
        {isLoading && <Loader2 className="w-4 h-4 text-[#0553BA] animate-spin flex-shrink-0" />}
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown with rich results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[200] max-h-[340px] overflow-y-auto min-w-[320px] w-max max-w-[420px]">
          {results.map((result, idx) => {
            const parts = parseLocation(result);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(result)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 transition-colors text-left cursor-pointer first:rounded-t-2xl last:rounded-b-2xl
                  ${idx === selectedIdx ? "bg-[#F0F7FF]" : "hover:bg-[#FAFBFC]"}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#F0F7FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#0553BA]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#054752] truncate">
                    {parts.primary}
                  </p>
                  {parts.secondary && (
                    <p className="text-xs text-[#708C91] font-medium truncate mt-0.5">
                      {parts.secondary}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[200] p-4 text-center">
          <p className="text-sm text-[#708C91] font-medium">No locations found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

// Parse a result into primary (area/place) and secondary (city, state) display
function parseLocation(result: LocationResult): { primary: string; secondary: string } {
  const parts = result.displayName.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    return {
      primary: parts[0],
      secondary: parts.slice(1, 4).join(", "),
    };
  }

  if (parts.length === 2) {
    return { primary: parts[0], secondary: parts[1] };
  }

  // Fallback: use city/state metadata
  if (result.city || result.state) {
    return {
      primary: parts[0] || result.displayName,
      secondary: [result.city, result.state].filter(Boolean).join(", "),
    };
  }

  return { primary: result.displayName, secondary: "" };
}

// Get a user-friendly short name for the input field after selection
function getShortName(result: LocationResult): string {
  const parts = result.displayName.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return result.displayName;
}
