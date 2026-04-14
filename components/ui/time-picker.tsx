"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse current value
  const [selectedHour, setSelectedHour] = useState<string>(value ? value.split(":")[0] : "10");
  const [selectedMinute, setSelectedMinute] = useState<string>(value ? value.split(":")[1] : "00");

  // Arrays for hours and minutes
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")); // 5-min intervals

  // Refs for scrolling into view
  const hourListRef = useRef<HTMLDivElement>(null);
  const minListRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active items into view when opened
  useEffect(() => {
    if (isOpen) {
      const activeHour = hourListRef.current?.querySelector(".bg-\\[\\#1877F2\\]");
      const activeMin = minListRef.current?.querySelector(".bg-\\[\\#1877F2\\]");
      if (activeHour) activeHour.scrollIntoView({ block: "center" });
      if (activeMin) activeMin.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  const handleHourSelect = (hr: string) => {
    setSelectedHour(hr);
    onChange(`${hr}:${selectedMinute}`);
  };

  const handleMinuteSelect = (min: string) => {
    setSelectedMinute(min);
    onChange(`${selectedHour}:${min}`);
    setIsOpen(false); // Close after picking minute for convenience
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Field Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[52px] px-4 bg-[#F5F7FA] border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[#0553BA] ring-2 ring-[#0553BA]/10' : 'border-[#E2E8F0] hover:border-[#0553BA]'}`}
      >
        <div className="flex items-center gap-2">
          {value ? (
            <span className="text-[15px] font-semibold text-[#054752]">
              {value}
            </span>
          ) : (
            <span className="text-[15px] font-medium text-[#708C91]">Select a time</span>
          )}
        </div>
        <Clock className="w-5 h-5 text-[#054752] opacity-70" />
      </div>

      {/* Dropdown TimePopover */}
      {isOpen && (
        <div className="absolute top-[60px] left-0 md:right-0 md:left-auto z-50 w-[280px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 border border-gray-100 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#054752]">
              Select Time
            </h2>
          </div>

          <div className="flex gap-4 h-[240px]">
            {/* Hours Column */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-bold text-[#708C91] mb-2 text-center uppercase tracking-wider">Hrs</span>
              <div ref={hourListRef} className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2 relative" style={{ scrollBehavior: 'smooth' }}>
                {hours.map(hr => {
                  const isSelected = selectedHour === hr;
                  return (
                    <button
                      key={`h-${hr}`}
                      onClick={() => handleHourSelect(hr)}
                      className={`w-full py-2.5 rounded-xl text-center text-[15px] font-semibold transition-all ${
                        isSelected 
                          ? 'bg-[#1877F2] text-white shadow-md'
                          : 'text-[#054752] hover:bg-gray-100'
                      }`}
                    >
                      {hr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center font-bold text-[#708C91] opacity-50 pb-4">
              :
            </div>

            {/* Minutes Column */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-bold text-[#708C91] mb-2 text-center uppercase tracking-wider">Min</span>
              <div ref={minListRef} className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2 relative" style={{ scrollBehavior: 'smooth' }}>
                {minutes.map(min => {
                  const isSelected = selectedMinute === min;
                  return (
                    <button
                      key={`m-${min}`}
                      onClick={() => handleMinuteSelect(min)}
                      className={`w-full py-2.5 rounded-xl text-center text-[15px] font-semibold transition-all ${
                        isSelected 
                          ? 'bg-[#1877F2] text-white shadow-md'
                          : 'text-[#054752] hover:bg-gray-100'
                      }`}
                    >
                      {min}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
