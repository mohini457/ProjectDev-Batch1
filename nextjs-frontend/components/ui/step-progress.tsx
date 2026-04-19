"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface StepProgressProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

/**
 * Horizontal wizard stepper with an animated car that drives
 * between steps when the user advances.
 *
 * The car "parks" at the active step circle and drives forward
 * with a smooth spring transition on every step change.
 */
export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  const totalSteps = steps.length;
  const [isMoving, setIsMoving] = useState(false);
  const [direction, setDirection] = useState<"right" | "left">("right");
  const prevStep = useRef(currentStep);

  // Trigger movement and direction tracking on step change
  useEffect(() => {
    if (currentStep > prevStep.current) {
      setDirection("right");
    } else if (currentStep < prevStep.current) {
      setDirection("left");
    }
    prevStep.current = currentStep;

    setIsMoving(true);
    const t = setTimeout(() => setIsMoving(false), 800); // 800ms matches the layout transition duration
    return () => clearTimeout(t);
  }, [currentStep]);

  return (
    <div className="w-full px-2 pt-6 pb-12 select-none">
      {/* Step bar container with fixed height to support absolute positioned children */}
      <div className="relative flex w-full h-10">
        {/* Track wrapper inset to exactly the center of the first/last circles (w-10 = 40px, so 20px radius = left-5/right-5) */}
        <div className="absolute top-1/2 left-5 right-5 h-[3px] -translate-y-1/2 z-0">
          {/* Background track line */}
          <div className="absolute inset-0 bg-gray-200 rounded-full" />

          {/* Completed track line */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-[#0553BA] rounded-full z-[1]"
            initial={{ width: "0%" }}
            animate={{
              width: `${(currentStep / (totalSteps - 1)) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>

        {/* Step circles perfectly positioned at 0%, 25%, 50%, 75%, 100% */}
        {steps.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;
          
          const percent = (idx / (totalSteps - 1)) * 100;

          return (
            <div
              key={idx}
              className="absolute z-10 flex flex-col items-center top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `calc(1.25rem + (100% - 2.5rem) * ${percent / 100})` }} // properly scale within the left-5/right-5 padding
            >
              {/* Circle */}
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex flex-col items-center justify-center font-bold text-sm border-[3px] transition-colors duration-300
                  ${isCompleted ? "bg-[#0553BA] border-[#0553BA] text-white" : ""}
                  ${isActive ? "bg-white border-[#0553BA] text-[#0553BA]" : ""}
                  ${isPending ? "bg-white border-gray-300 text-gray-400" : ""}
                `}
                initial={false}
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {idx + 1}
              </motion.div>

              {/* Label */}
              <div className="absolute top-[3.25rem] text-center w-32 -translate-x-1/2 left-1/2">
                <span
                  className={`
                    text-xs font-semibold whitespace-nowrap
                    ${isActive ? "text-[#0553BA]" : isCompleted ? "text-[#054752]" : "text-gray-400"}
                  `}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}

        {/* 🚗 Animated car that drives along the track */}
        {/* We place it inside a left-5 right-5 bounding box so 0% to 100% aligns perfectly */}
        <div className="absolute inset-0 left-5 right-5 z-20 pointer-events-none">
          <motion.div
            className="absolute"
            style={{ bottom: "calc(50% - 3px)" }}
            initial={{ left: "0%" }}
            animate={{
              left: `${(currentStep / (totalSteps - 1)) * 100}%`,
            }}
            transition={{
              type: "tween",
              ease: "easeInOut",
              duration: 0.8,
            }}
          >
          {/* Car wrapper with bump/driving animation */}
          {/* Outer wrapper: Handles direction flips without repeating loops */}
          <motion.div
            className="relative flex flex-col items-center justify-center transform-gpu origin-center"
            animate={{
              x: direction === "right" ? "-20%" : "20%",
              scaleX: direction === "right" ? 1 : -1,
            }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
            }}
          >
            {/* Inner vehicle: Handles the repeating bumpy physics */}
            <motion.div
              animate={isMoving ? {
                y: [0, -1.5, 0], // slight road bump
                rotate: [0, 1.5, 0], // slight rock back and forth
              } : {
                y: 0,
                rotate: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: isMoving ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="relative flex flex-col items-center justify-center"
            >
              {/* Small car SVG */}
              <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Car body */}
              <path
                d="M4 13h28c1 0 2-1 2-2v-1c0-1-0.5-2-1.5-2.5L28 5.5c-0.5-0.5-1.5-1.5-3-2.5C23.5 2 22 1.5 20 1.5h-5c-2 0-3.5 0.5-5 1.5L7 5.5 3.5 7.5C2.5 8 2 9 2 10v1c0 1 1 2 2 2z"
                fill="#0553BA"
              />
              {/* Windshield */}
              <path
                d="M11 5.5L9 9h6V4c-1.5 0-3 0.5-4 1.5z"
                fill="#7CB9FF"
                opacity="0.7"
              />
              {/* Rear window */}
              <path
                d="M17 4v5h6L25 5.5c-1-1-2.5-1.5-4-1.5h-4z"
                fill="#7CB9FF"
                opacity="0.7"
              />
              {/* Front wheel */}
              <circle cx="9" cy="14" r="3.5" fill="#054752" />
              <circle cx="9" cy="14" r="1.5" fill="#E2E8F0" />
              {/* Rear wheel */}
              <circle cx="27" cy="14" r="3.5" fill="#054752" />
              <circle cx="27" cy="14" r="1.5" fill="#E2E8F0" />
              {/* Headlight */}
              <rect x="31" y="8" width="2" height="2" rx="0.5" fill="#FCD34D" />
            </svg>

            {/* Exhaust puff (always on, even when idling) */}
            <motion.div
              className="absolute -left-2 top-1 text-[9px] opacity-40 mix-blend-multiply drop-shadow-sm"
              animate={{ opacity: [0.6, 0, 0.6], x: [0, -6, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              💨
            </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
