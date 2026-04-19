"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, isBefore, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: Date;
}

export default function DatePicker({ value, onChange, minDate = new Date() }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse current value or default to today
  const selectedDate = value ? new Date(value) : null;
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

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

  const goToPreviousMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevMonth = subMonths(currentMonth, 1);
    setCurrentMonth(prevMonth);
  };

  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSelectDate = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart; 
  const endDate = monthEnd;

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday...

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Field Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[52px] px-4 bg-[#F5F7FA] border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[#0553BA] ring-2 ring-[#0553BA]/10' : 'border-[#E2E8F0] hover:border-[#0553BA]'}`}
      >
        <div className="flex items-center gap-2">
          {selectedDate ? (
            <span className="text-[15px] font-semibold text-[#054752]">
              {format(selectedDate, "dd-MM-yyyy")}
            </span>
          ) : (
            <span className="text-[15px] font-medium text-[#708C91]">Select a date</span>
          )}
        </div>
        <CalendarIcon className="w-5 h-5 text-[#054752] opacity-70" />
      </div>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute top-[60px] left-0 z-50 w-[340px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={goToPreviousMonth}
              disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(minDate))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-5 h-5 text-[#0553BA]" strokeWidth={3} />
            </button>
            <h2 className="text-lg font-bold text-[#054752]">
              {format(currentMonth, "MMMM")}
            </h2>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#0553BA]" strokeWidth={3} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[13px] font-bold text-[#054752]">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-3 gap-x-1">
            {/* Empty slots for start of month */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="w-10 h-10" />
            ))}
            
            {/* Actual days */}
            {days.map((day, idx) => {
              const isDisabled = isBefore(startOfDay(day), startOfDay(minDate));
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div key={idx} className="flex justify-center flex-col items-center">
                  <button
                    onClick={() => !isDisabled && handleSelectDate(day)}
                    disabled={isDisabled}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-semibold transition-all
                      ${isDisabled 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-[#1877F2] text-white shadow-md' // Matches the bright blue from the design
                          : 'text-[#054752] hover:bg-gray-100 cursor-pointer'
                      }
                    `}
                  >
                    {format(day, dateFormat)}
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
