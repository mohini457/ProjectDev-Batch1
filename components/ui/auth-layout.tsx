"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import NeumorphismButton from "@/components/ui/NeumorphismButton";

// Wireframe Car Component — constellation-style connected dots

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Persist dots and particles so they don't regenerate and jitter when form height shifts
  const bgDotsRef = useRef<{ x: number; y: number; radius: number; opacity: number }[] | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; opacity: number }[] | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.scale(dpr, dpr);

    const W = dimensions.width;
    const H = dimensions.height;
    
    // Center the car vertically, offset slightly up
    const cx = W * 0.5;
    const cy = H * 0.48;
    const scale = Math.min(W, H) * 0.0038;

    // =====================================================
    // Car outline vertices (side-profile sedan, normalized)
    // Much more detailed with extra vertices for smooth curves
    // =====================================================
    const bodyOutline: [number, number][] = [
      [-95, 20],   // front bumper bottom
      [-92, 14],   // front bumper curve
      [-90, 10],   // front bumper upper
      [-88, 5],    // front lip
      [-86, 2],    // grille top
      [-85, 0],    // hood start
      [-75, -3],   // hood curve 1
      [-60, -5],   // hood mid
      [-50, -7],   // hood curve 2
      [-42, -8],   // hood end / windshield base
      [-38, -18],  // windshield lower
      [-34, -30],  // windshield mid
      [-30, -42],  // windshield upper
      [-25, -50],  // A-pillar top
      [-20, -55],  // roof front
      [-10, -57],  // roof peak front
      [0, -58],    // roof center
      [10, -57],   // roof peak rear
      [18, -55],   // roof rear
      [25, -50],   // C-pillar top
      [30, -42],   // rear window upper
      [35, -30],   // rear window mid
      [40, -20],   // rear window lower
      [45, -15],   // trunk start / D-pillar
      [50, -12],   // trunk curve 1
      [55, -10],   // trunk mid
      [62, -8],    // trunk curve 2
      [70, -5],    // trunk end
      [75, -2],    // tail curve
      [80, 0],     // tail start
      [83, 3],     // tail light upper
      [85, 5],     // tail light mid
      [85, 10],    // tail
      [85, 15],    // rear bumper top
      [83, 18],    // rear bumper curve
      [82, 20],    // rear bumper bottom
      [75, 22],    // undercarriage rear
      // rear wheel arch
      [65, 22],    // rear arch start
      [65, 16],    // rear arch up 1
      [62, 10],    // rear arch up 2
      [57, 7],     // rear arch top 1
      [52, 6],     // rear arch peak
      [47, 7],     // rear arch top 2
      [44, 10],    // rear arch down 1
      [42, 16],    // rear arch down 2
      [42, 22],    // rear arch end
      // undercarriage mid
      [15, 22],    // mid floor 1
      [5, 22],     // mid floor 2
      // front wheel arch
      [-15, 22],   // front arch start
      [-15, 16],   // front arch up 1
      [-18, 10],   // front arch up 2
      [-23, 7],    // front arch top 1
      [-30, 6],    // front arch peak
      [-37, 7],    // front arch top 2
      [-40, 10],   // front arch down 1
      [-42, 16],   // front arch down 2
      [-42, 22],   // front arch end
      // return to front
      [-70, 22],   // undercarriage front 1
      [-80, 22],   // undercarriage front 2
      [-88, 21],   // front under-bumper
      [-95, 20],   // close to front bumper
    ];
    
    // Windshield glass line
    const windshield: [number, number][] = [
      [-42, -8], [-38, -18], [-34, -30], [-30, -42],
    ];
    
    // Rear window glass line
    const rearWindow: [number, number][] = [
      [45, -15], [40, -20], [35, -30], [30, -42],
    ];
    
    // Window sill line (belt line)
    const beltLine: [number, number][] = [
      [-42, -8], [-20, -10], [0, -11], [20, -10], [45, -15],
    ];
    
    // Roof line accent
    const roofRail: [number, number][] = [
      [-18, -58], [-5, -59], [8, -59], [16, -58],
    ];
    
    // Front door line
    const doorLine1: [number, number][] = [
      [-5, -53], [-5, 5],
    ];
    
    // Rear door line
    const doorLine2: [number, number][] = [
      [18, -53], [18, 5],
    ];
    
    // Front door handle
    const doorHandle1: [number, number][] = [
      [-18, -18], [-8, -18],
    ];
    // Rear door handle
    const doorHandle2: [number, number][] = [
      [5, -18], [15, -18],
    ];
    
    // Headlight shape (more detailed)
    const headlight: [number, number][] = [
      [-88, 0], [-86, -3], [-82, -2], [-80, 1], [-82, 4], [-86, 4], [-88, 2],
    ];
    
    // Taillight shape (more detailed)
    const taillight: [number, number][] = [
      [83, 1], [85, 3], [85, 8], [85, 13], [83, 15], [82, 12], [82, 5],
    ];
    
    // Front grille lines
    const grille1: [number, number][] = [[-88, 4], [-82, 4]];
    const grille2: [number, number][] = [[-88, 8], [-82, 8]];
    const grille3: [number, number][] = [[-88, 12], [-84, 12]];
    
    // Side mirror
    const mirror: [number, number][] = [
      [-44, -10], [-50, -16], [-52, -12], [-50, -8], [-44, -10],
    ];
    
    // Exhaust pipe
    const exhaust: [number, number][] = [
      [75, 22], [80, 23], [84, 22],
    ];
    
    // Front fender accent
    const fenderFront: [number, number][] = [
      [-70, 5], [-55, 3], [-45, 5],
    ];
    
    // Rear fender accent
    const fenderRear: [number, number][] = [
      [35, 5], [50, 3], [65, 5],
    ];
    
    // Window glass fill regions (will be drawn with subtle tint)
    const frontWindowGlass: [number, number][] = [
      [-42, -8], [-38, -18], [-34, -30], [-30, -42], [-25, -50], [-20, -55],
      [-10, -57], [-5, -53], [-5, -10], [-42, -8],
    ];
    const rearWindowGlass: [number, number][] = [
      [18, -53], [18, -10], [45, -15], [40, -20], [35, -30], [30, -42],
      [25, -50], [18, -55], [18, -53],
    ];

    // Wheel centers
    const frontWheelCenter: [number, number] = [-30, 16];
    const rearWheelCenter: [number, number] = [52, 16];
    const wheelRadius = 16;
    const hubRadius = 6;
    
    // Convert normalized coords to canvas coords
    const toCanvas = (p: [number, number]): [number, number] => {
      return [cx + p[0] * scale, cy + p[1] * scale];
    };
    
    // =====================================================
    // Background scattered dots (like original world map)
    // =====================================================
    if (!bgDotsRef.current) {
      const dots = [];
      const gap = 14;
      // Pre-generate for a very large area so resizing doesn't reveal blank edges
      const MAX_W = 1500; 
      const MAX_H = 1500;
      for (let x = gap; x < MAX_W; x += gap) {
        for (let y = gap; y < MAX_H; y += gap) {
          if (Math.random() > 0.5) {
            dots.push({
              x: x + (Math.random() - 0.5) * 4,
              y: y + (Math.random() - 0.5) * 4,
              radius: Math.random() * 1.5 + 0.8,
              opacity: Math.random() * 0.25 + 0.1,
            });
          }
        }
      }
      bgDotsRef.current = dots;
    }
    const bgDots = bgDotsRef.current;
    
    // Floating particles (animated, slightly bigger / brighter)
    if (!particlesRef.current) {
      const pts = [];
      const MAX_W = 1500;
      const MAX_H = 1500;
      for (let i = 0; i < 40; i++) {
        pts.push({
          x: Math.random() * MAX_W,
          y: Math.random() * MAX_H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.8 + 0.5,
          opacity: Math.random() * 0.2 + 0.05,
        });
      }
      particlesRef.current = pts;
    }
    const particles = particlesRef.current;

    let animationFrameId: number;
    let startTime = Date.now();

    function drawPath(points: [number, number][], close = false, strokeColor = "#0553BA", lineW = 1.5, progress = 1) {
      if (points.length < 2) return;
      const canvasPoints = points.map(toCanvas);
      
      let totalLen = 0;
      for (let i = 1; i < canvasPoints.length; i++) {
        totalLen += Math.hypot(canvasPoints[i][0] - canvasPoints[i-1][0], canvasPoints[i][1] - canvasPoints[i-1][1]);
      }
      if (close) {
        totalLen += Math.hypot(canvasPoints[0][0] - canvasPoints[canvasPoints.length-1][0], canvasPoints[0][1] - canvasPoints[canvasPoints.length-1][1]);
      }
      
      const drawLen = totalLen * progress;
      let drawn = 0;
      
      ctx.beginPath();
      ctx.moveTo(canvasPoints[0][0], canvasPoints[0][1]);
      
      const allSegments = [...canvasPoints.slice(1)];
      if (close) allSegments.push(canvasPoints[0]);
      
      let prevPoint = canvasPoints[0];
      for (const pt of allSegments) {
        const segLen = Math.hypot(pt[0] - prevPoint[0], pt[1] - prevPoint[1]);
        if (drawn + segLen <= drawLen) {
          ctx.lineTo(pt[0], pt[1]);
          drawn += segLen;
        } else {
          const remaining = drawLen - drawn;
          const ratio = remaining / segLen;
          const ix = prevPoint[0] + (pt[0] - prevPoint[0]) * ratio;
          const iy = prevPoint[1] + (pt[1] - prevPoint[1]) * ratio;
          ctx.lineTo(ix, iy);
          break;
        }
        prevPoint = pt;
      }
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineW;
      ctx.stroke();
    }
    
    function drawVertexDots(points: [number, number][], color = "#0553BA", radius = 2.5, progress = 1) {
      const visibleCount = Math.floor(points.length * progress);
      for (let i = 0; i < visibleCount; i++) {
        const [px, py] = toCanvas(points[i]);
        
        // Glow
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5, 83, 186, 0.07)`;
        ctx.fill();
        
        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
    
    function fillRegion(points: [number, number][], fillColor: string) {
      if (points.length < 3) return;
      const canvasPoints = points.map(toCanvas);
      ctx.beginPath();
      ctx.moveTo(canvasPoints[0][0], canvasPoints[0][1]);
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i][0], canvasPoints[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    function drawWheel(center: [number, number], progress: number) {
      const [wcx, wcy] = toCanvas(center);
      const r = wheelRadius * scale;
      const hr = hubRadius * scale;
      
      if (progress <= 0) return;
      
      // Tire (outer circle)
      ctx.beginPath();
      ctx.arc(wcx, wcy, r, 0, Math.PI * 2 * Math.min(progress * 1.5, 1));
      ctx.strokeStyle = "#0553BA";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      // Inner rim
      ctx.beginPath();
      ctx.arc(wcx, wcy, r * 0.8, 0, Math.PI * 2 * Math.min(progress * 1.5, 1));
      ctx.strokeStyle = "rgba(5, 83, 186, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Hub
      ctx.beginPath();
      ctx.arc(wcx, wcy, hr, 0, Math.PI * 2 * Math.min(progress * 1.5, 1));
      ctx.strokeStyle = "#0254A3";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      
      // Hub fill
      if (progress > 0.5) {
        ctx.beginPath();
        ctx.arc(wcx, wcy, hr * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(5, 83, 186, 0.12)";
        ctx.fill();
      }

      // Spokes (rotating)
      if (progress > 0.3) {
        const spokeProgress = Math.min((progress - 0.3) / 0.7, 1);
        const spokeCount = 5;
        for (let i = 0; i < spokeCount; i++) {
          const angle = (i / spokeCount) * Math.PI * 2 + (Date.now() / 2500);
          const innerX = wcx + Math.cos(angle) * hr;
          const innerY = wcy + Math.sin(angle) * hr;
          const outerX = wcx + Math.cos(angle) * r * 0.78 * spokeProgress;
          const outerY = wcy + Math.sin(angle) * r * 0.78 * spokeProgress;
          
          ctx.beginPath();
          ctx.moveTo(innerX, innerY);
          ctx.lineTo(outerX, outerY);
          ctx.strokeStyle = "rgba(5, 83, 186, 0.3)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      
      // Center dot
      ctx.beginPath();
      ctx.arc(wcx, wcy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#0553BA";
      ctx.fill();
    }
    
    function drawBgDots() {
      for (const dot of bgDots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5, 71, 82, ${dot.opacity})`;
        ctx.fill();
      }
    }
    
    function drawParticles() {
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        // Use larger boundary for floating particles so they don't bunch up immediately 
        const MAX_W = 1500;
        const MAX_H = 1500;
        if (p.x < 0 || p.x > MAX_W) p.vx *= -1;
        if (p.y < 0 || p.y > MAX_H) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5, 83, 186, ${p.opacity})`;
        ctx.fill();
      });
    }
    
    // Road / ground line
    function drawRoad(progress: number) {
      if (progress <= 0) return;
      const roadY = cy + 40 * scale;
      const roadStartX = cx - 110 * scale;
      const roadEndX = cx + 100 * scale;
      const drawEnd = roadStartX + (roadEndX - roadStartX) * progress;
      
      ctx.beginPath();
      ctx.setLineDash([8, 6]);
      ctx.moveTo(roadStartX, roadY);
      ctx.lineTo(drawEnd, roadY);
      ctx.strokeStyle = "rgba(5, 83, 186, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      
      const elapsed = (Date.now() - startTime) / 1000;
      
      // Animation timeline
      const bodyProgress = Math.min(elapsed / 3.0, 1);
      const detailProgress = Math.min(Math.max((elapsed - 1.5) / 2.0, 0), 1);
      const wheelProgress = Math.min(Math.max((elapsed - 2.0) / 1.5, 0), 1);
      const roadProgress = Math.min(Math.max((elapsed - 2.5) / 1.5, 0), 1);
      
      // 1. Background scattered dots
      drawBgDots();
      
      // 2. Floating particles
      drawParticles();
      
      // 3. Road
      drawRoad(roadProgress);
      
      // 4. Window glass fills (subtle tint)
      if (detailProgress > 0.3) {
        const glassAlpha = Math.min((detailProgress - 0.3) / 0.7, 1) * 0.06;
        fillRegion(frontWindowGlass, `rgba(5, 83, 186, ${glassAlpha})`);
        fillRegion(rearWindowGlass, `rgba(5, 83, 186, ${glassAlpha})`);
      }
      
      // 5. Car body outline
      drawPath(bodyOutline, true, "#0553BA", 1.8, bodyProgress);
      drawVertexDots(bodyOutline, "#0553BA", 2, bodyProgress);
      
      // 6. Interior details
      if (detailProgress > 0) {
        // Windows
        drawPath(windshield, false, "rgba(5, 83, 186, 0.45)", 1.2, detailProgress);
        drawPath(rearWindow, false, "rgba(5, 83, 186, 0.45)", 1.2, detailProgress);
        drawPath(beltLine, false, "rgba(5, 83, 186, 0.3)", 1, detailProgress);
        drawPath(roofRail, false, "rgba(5, 83, 186, 0.2)", 0.8, detailProgress);
        
        // Doors
        drawPath(doorLine1, false, "rgba(5, 83, 186, 0.25)", 0.8, detailProgress);
        drawPath(doorLine2, false, "rgba(5, 83, 186, 0.25)", 0.8, detailProgress);
        drawPath(doorHandle1, false, "rgba(5, 83, 186, 0.5)", 1.5, detailProgress);
        drawPath(doorHandle2, false, "rgba(5, 83, 186, 0.5)", 1.5, detailProgress);
        
        // Lights
        drawPath(headlight, true, "#e9a820", 1.8, detailProgress);
        drawPath(taillight, true, "#e04040", 1.8, detailProgress);
        
        // Grille
        drawPath(grille1, false, "rgba(5, 83, 186, 0.3)", 0.8, detailProgress);
        drawPath(grille2, false, "rgba(5, 83, 186, 0.3)", 0.8, detailProgress);
        drawPath(grille3, false, "rgba(5, 83, 186, 0.3)", 0.8, detailProgress);
        
        // Mirror, fenders, exhaust
        drawPath(mirror, true, "rgba(5, 83, 186, 0.4)", 1.2, detailProgress);
        drawPath(fenderFront, false, "rgba(5, 83, 186, 0.2)", 0.8, detailProgress);
        drawPath(fenderRear, false, "rgba(5, 83, 186, 0.2)", 0.8, detailProgress);
        drawPath(exhaust, false, "rgba(100, 100, 100, 0.4)", 1.5, detailProgress);
      }
      
      // 7. Wheels
      drawWheel(frontWheelCenter, wheelProgress);
      drawWheel(rearWheelCenter, wheelProgress);
      
      // Loop animation
      if (elapsed > 25) {
        startTime = Date.now();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// ============================================================
// Custom Clerk Appearance — adapted for Carvaan Go brand
// ============================================================
const clerkAppearance = {
  variables: {
    colorPrimary: "#0553BA",
    colorBackground: "transparent",
    colorText: "#05293C",
    colorInputText: "#05293C",
    colorInputBackground: "#F5F7FA",
    borderRadius: "0.75rem",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-none border-0 p-0 m-0 bg-transparent w-full",
    card: "shadow-none border-0 p-0 bg-transparent w-full",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    footer: "hidden",
    footerAction: "hidden",
    socialButtonsBlockButton: {
      height: "44px",
      padding: "0 16px",
      borderRadius: "9999px",
      backgroundColor: "#F0F7FF",
      color: "#05293C",
      fontWeight: "500",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      transition: "all 200ms ease",
      border: "1px solid #E2E8F0",
      "&:hover": {
        backgroundColor: "#E2F0FF",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(5, 83, 186, 0.08)",
      },
    },
    socialButtonsBlockButtonArrow: { display: "none" },
    socialButtonsBlockButtonText: { fontWeight: "500" },
    socialButtonsProviderIcon: { width: "18px", height: "18px" },
    dividerLine: { backgroundColor: "#E2E8F0" },
    dividerText: {
      color: "#708C91",
      backgroundColor: "#ffffff",
      padding: "0 12px",
      fontSize: "13px",
    },
    formFieldLabel: {
      color: "#05293C",
      fontWeight: "600",
      fontSize: "14px",
      marginBottom: "6px",
    },
    formFieldInput: {
      height: "44px",
      padding: "0 20px",
      borderRadius: "9999px",
      backgroundColor: "#F5F7FA",
      border: "1px solid #E2E8F0",
      color: "#05293C",
      fontSize: "14px",
      transition: "all 200ms ease",
      "&:focus": {
        borderColor: "#0553BA",
        boxShadow: "0 0 0 3px rgba(5, 83, 186, 0.1)",
        outline: "none",
      },
    },
    formButtonPrimary: {
      display: "none", // We replace with NeumorphismButton via DOM
    },
    footerActionLink: {
      color: "#0553BA",
      fontWeight: "500",
      "&:hover": { textDecoration: "underline" },
    },
    identityPreviewEditButton: {
      color: "#0553BA",
      "&:hover": { color: "#033B85" },
    },
  },
};

// Export the appearance so auth pages can import it
export { clerkAppearance };

// ============================================================
// AuthLayout — Left: DotMap, Right: Clerk form with custom button
// ============================================================
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine if currently on sign-in or sign-up view
  const isSignUp = searchParams.get("mode") === "sign-up";

  // Transition animation state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [carPosition, setCarPosition] = useState(isSignUp ? 85 : 15); // 15% for Sign-In (right), 85% for Sign-Up (left)
  const [carImage, setCarImage] = useState(isSignUp ? "car_east.png" : "car_west.png"); 
  const [smokeOpacity, setSmokeOpacity] = useState(0);
  const [smokeParticles, setSmokeParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const transitionTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Handle mode toggle with car animation
  const handleModeToggle = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const targetUrl = isSignUp ? "/auth" : "/auth?mode=sign-up";
    const nextIsSignUp = !isSignUp;
    const targetPosition = nextIsSignUp ? 85 : 15; // 85% is left side, 15% is right side
    
    // Note: The car image remains the current one during the drive, 
    // and flips to the target direction once it arrives.

    // Generate smoke particles (spread across the whole width)
    // Reduced count from 30 to 18 for massive performance gain, since they scale to cover the screen anyway
    const particles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 40 + Math.random() * 40,
      size: 100 + Math.random() * 250,
      delay: Math.random() * 0.6,
    }));
    setSmokeParticles(particles);

    // Phase 1: Car starts driving to the target side
    const t1 = setTimeout(() => setCarPosition(targetPosition), 50);

    // Phase 2: Smoke starts building (600ms)
    const t2 = setTimeout(() => setSmokeOpacity(0.3), 400);
    const t3 = setTimeout(() => setSmokeOpacity(0.7), 700);
    const t4 = setTimeout(() => setSmokeOpacity(1), 900);

    // Phase 3: At peak smoke, switch route (1100ms)
    const t5 = setTimeout(() => {
      router.push(targetUrl);
    }, 1100);

    // Phase 4: Smoke clears (1400ms - 2200ms)
    const t6 = setTimeout(() => setSmokeOpacity(0.6), 1500);
    const t7 = setTimeout(() => setSmokeOpacity(0.3), 1700);
    const t8 = setTimeout(() => setSmokeOpacity(0), 1900);

    // Phase 4.5: Car arrives at destination and parks (1250ms roughly)
    const tFlip = setTimeout(() => {
      setCarImage(nextIsSignUp ? "car_east.png" : "car_west.png");
    }, 1250);

    // Phase 5: Reset state (2300ms)
    const t9 = setTimeout(() => {
      setIsTransitioning(false);
      setSmokeParticles([]);
    }, 2300);

    transitionTimerRef.current = [t1, t2, t3, t4, t5, t6, t7, t8, tFlip, t9];
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      transitionTimerRef.current.forEach(clearTimeout);
    };
  }, []);

  // DOM hack: replace Clerk's hidden primary button with our NeumorphismButton
  useEffect(() => {
    const replaceClerkButton = () => {
      const clerkButton = document.querySelector(".cl-formButtonPrimary") as HTMLButtonElement;
      const formElement = clerkButton?.closest("form");

      if (clerkButton && formElement && !document.getElementById("custom-auth-button")) {
        clerkButton.style.display = "none";

        const buttonContainer = document.createElement("div");
        buttonContainer.id = "custom-auth-button";
        buttonContainer.className = "mt-4";
        formElement.appendChild(buttonContainer);

        const handleClick = () => clerkButton.click();

        const customButton = document.createElement("button");
        customButton.type = "button";
        customButton.className = `
          group relative px-6 py-3 font-semibold text-[#05293C] transition-colors duration-[400ms] hover:text-[#0553BA] w-full bg-white cursor-pointer
          border border-gray-200 outline-none focus:outline-none overflow-hidden
        `;
        customButton.onclick = handleClick;

        // Text
        const textSpan = document.createElement("span");
        textSpan.className = "relative z-10 block w-full text-center";
        textSpan.textContent = "Continue";
        customButton.appendChild(textSpan);

        // Animated border spans (draw-outline effect)
        const borders = [
          "absolute left-0 top-0 h-[2px] w-0 bg-[#0553BA] transition-all duration-300 group-hover:w-full",
          "absolute right-0 top-0 h-0 w-[2px] bg-[#0553BA] transition-all delay-150 duration-300 group-hover:h-full",
          "absolute bottom-0 right-0 h-[2px] w-0 bg-[#0553BA] transition-all delay-300 duration-300 group-hover:w-full",
          "absolute bottom-0 left-0 h-0 w-[2px] bg-[#0553BA] transition-all delay-450 duration-300 group-hover:h-full",
        ];
        borders.forEach((cls) => {
          const span = document.createElement("span");
          span.className = cls;
          customButton.appendChild(span);
        });

        buttonContainer.appendChild(customButton);
      }
    };

    // Retry until Clerk renders
    const attempts = [100, 300, 500, 1000, 2000];
    attempts.forEach((delay) => setTimeout(replaceClerkButton, delay));

    const observer = new MutationObserver(() => replaceClerkButton());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#F5F7FA] to-[#E2E8F0] p-4 font-sans overflow-y-auto">
      {/* Floating background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#0553BA]/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#0254A3]/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* ======= SMOKE OVERLAY ======= */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{ opacity: smokeOpacity, transition: "opacity 0.3s ease" }}
        >
          {/* Base fog layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-200/90 via-white/95 to-gray-100/90" />
          
          {/* Smoke particles */}
          {smokeParticles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: `radial-gradient(circle, rgba(200,210,220,0.8) 0%, rgba(220,230,240,0.4) 40%, transparent 65%)`,
                // Remove expensive blur filter, use natural radial dropoff
                transform: `translate3d(-50%, -50%, 0) scale(${smokeOpacity > 0.5 ? 2.5 : 0.5})`,
                transition: `transform 1s ease-out ${p.delay}s, opacity 0.5s ease`,
                animationDuration: `${2 + Math.random()}s`,
                willChange: "transform, opacity"
              }}
            />
          ))}
        </div>
      )}

      {/* ======= PARKED/DRIVING CAR ======= */}
      <div
        className="fixed z-[101] pointer-events-none"
        style={{
          bottom: "0%",
          right: `${carPosition}%`,
          transition: "right 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
          transform: `translateX(50%)`,
          transformOrigin: "bottom center"
        }}
      >
        {/* Car Image */}
        <div className="relative w-[300px]">
          <Image 
            src={`/${carImage}`} 
            alt="Car" 
            width={300}
            height={150}
            className="w-full h-auto object-contain drop-shadow-2xl" 
          />
        </div>

        {/* Exhaust smoke puffs trailing behind the car (only when driving) */}
        <div 
          className="absolute transition-opacity duration-300 h-full flex flex-col justify-end" 
          style={{ 
            right: carImage === "car_west.png" ? "0px" : "auto", 
            left: carImage === "car_east.png" ? "0px" : "auto", 
            bottom: "30%",
            opacity: isTransitioning ? 1 : 0 
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${30 + i * 15}px`,
                height: `${30 + i * 15}px`,
                right: carImage === "car_west.png" ? `${-i * 25}px` : "auto",
                left: carImage === "car_east.png" ? `${-i * 25}px` : "auto",
                top: `${-i * 8}px`,
                background: `radial-gradient(circle, rgba(180,190,200,${0.6 - i * 0.15}) 0%, transparent 65%)`,
                // Removed filter blur; hardware accelerate transform
                transform: "translateZ(0)",
                willChange: "transform, opacity",
                animation: `puffExpand ${0.8 + i * 0.2}s ease-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Smoke puff keyframe animation */}
      <style>{`
        @keyframes puffExpand {
          0% { transform: scale(0.5); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1000px] overflow-hidden rounded-[24px] flex bg-white text-[#054752] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] min-h-[500px] border border-gray-100/50 my-auto relative z-10"
      >
        {/* Left side - Map */}
        <div className="hidden md:block w-[45%] relative overflow-hidden bg-[#F0F7FF] border-r border-[#E2E8F0]">
          <div className="absolute inset-0">
            <DotMap />
            
            {/* Logo and text overlay — positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-8 pt-16 px-8 z-10 bg-gradient-to-t from-[#F0F7FF] via-[#F0F7FF]/80 to-transparent">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-3xl font-black mb-2 text-center text-[#05293C] tracking-tight"
              >
                Carvaan Go
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-[14px] font-medium text-center text-[#4B6B70] max-w-[260px] leading-relaxed"
              >
                Sign {isSignUp ? "up" : "in"} to access your carpool dashboard and travel together, smarter.
              </motion.p>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth Form */}
        <div className="w-full md:w-[55%] p-6 md:p-8 lg:p-10 flex flex-col justify-center items-center bg-white relative">
          {/* Global overrides to absolutely remove Clerk's card styling that causes double layers */}
          <style>{`
            .cl-rootBox, .cl-cardBox, .cl-card { 
              box-shadow: none !important; 
              background: transparent !important; 
              border: none !important; 
              padding: 0 !important;
              overflow: visible !important;
            }
            .cl-footer, .cl-formButtonPrimary { 
              display: none !important; 
            }
          `}</style>
          {/* Subtle background glow */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[380px] flex flex-col items-center relative z-10"
          >
            {/* Logo */}
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0553BA]/20 via-[#0254A3]/10 to-[#023b8a]/20 blur-xl opacity-40 animate-pulse" />
              <Image src="/logo.jpeg" alt="Carvaan Go" width={50} height={50} className="relative rounded-xl object-contain" />
            </div>

            {/* Heading */}
            <h1 className="text-xl font-bold text-center text-[#05293C] mb-1">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-xs text-[#708C91] text-center mb-5">
              {isSignUp ? "Join the carpooling revolution" : "Sign in to your account"}
            </p>

            {/* Clerk form injected here */}
            <div className="w-full">
              {children}
            </div>

            {/* Toggle link — triggers car animation */}
            <div className="mt-6 text-center text-sm text-[#708C91]">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={handleModeToggle}
                disabled={isTransitioning}
                className="text-[#0553BA] font-semibold hover:text-[#033B85] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
