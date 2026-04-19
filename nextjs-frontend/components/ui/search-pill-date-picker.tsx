"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, isBefore, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface SearchPillDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

/**
 * A custom date picker designed to fit inside the landing-page search pill.
 * Shows "Today" / "Tomorrow" / formatted date as the trigger,
 * and opens the same beautiful calendar used in the publish flow.
 */
export default function SearchPillDatePicker({ value, onChange }: SearchPillDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const minDate = new Date();

  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToPreviousMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSelectDate = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  // Build label
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = format(today, "yyyy-MM-dd");
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

  let label = "Select date";
  if (value === todayStr) label = "Today";
  else if (value === tomorrowStr) label = "Tomorrow";
  else if (value) label = format(selectedDate, "d MMM");

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 md:py-0 md:h-[60px] cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <CalendarIcon className="text-[#708C91] w-[22px] h-[22px] flex-shrink-0" />
        <span className="text-base font-semibold text-[#054752] whitespace-nowrap">{label}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-[200] w-[340px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 border border-gray-100">
          {/* Quick picks */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => { onChange(todayStr); setIsOpen(false); }}
              className={`flex-1 px-3 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer transition-all
                ${value === todayStr ? "bg-[#0553BA] text-white shadow-md" : "bg-[#F0F7FF] text-[#0553BA] hover:bg-[#E2F0FF]"}`}
            >
              Today
            </button>
            <button
              onClick={() => { onChange(tomorrowStr); setIsOpen(false); }}
              className={`flex-1 px-3 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer transition-all
                ${value === tomorrowStr ? "bg-[#0553BA] text-white shadow-md" : "bg-[#F0F7FF] text-[#0553BA] hover:bg-[#E2F0FF]"}`}
            >
              Tomorrow
            </button>
          </div>

          {/* Month Header */}
          <div className="flex justify-between items-center mb-5">
            <button
              onClick={goToPreviousMonth}
              disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(minDate))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-[#0553BA]" strokeWidth={3} />
            </button>
            <h2 className="text-lg font-bold text-[#054752]">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-[#0553BA]" strokeWidth={3} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[13px] font-bold text-[#054752]">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {/* Empty slots for start of month */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="w-10 h-10" />
            ))}

            {/* Actual days */}
            {days.map((day, idx) => {
              const isDisabled = isBefore(startOfDay(day), startOfDay(minDate));
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={idx} className="flex justify-center">
                  <button
                    onClick={() => !isDisabled && handleSelectDate(day)}
                    disabled={isDisabled}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-semibold transition-all
                      ${isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : isSelected
                          ? "bg-[#0553BA] text-white shadow-md"
                          : isToday
                            ? "bg-[#F0F7FF] text-[#0553BA] font-bold cursor-pointer hover:bg-[#E2F0FF]"
                            : "text-[#054752] hover:bg-gray-100 cursor-pointer"
                      }
                    `}
                  >
                    {format(day, "d")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
