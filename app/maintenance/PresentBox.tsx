"use client";

import { useState, useRef } from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  className?: string;
  // position is now a hint only; auto-calculated from viewport space
  position?: "top" | "bottom" | "left" | "right";
}

const POPOVER_W = 264;
const POPOVER_H = 130;
const GAP = 12;

export default function PresentBox({
  children,
  title,
  description,
  active,
  className = "",
}: Props) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (!active) return <div className={className}>{children}</div>;

  const handleMouseEnter = () => {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x: number;
    let y: number;

    const spaceRight = vw - r.right;
    const spaceLeft = r.left;
    const spaceBelow = vh - r.bottom;

    if (spaceRight >= POPOVER_W + GAP) {
      // Preferred: right of element
      x = r.right + GAP;
      y = r.top;
    } else if (spaceLeft >= POPOVER_W + GAP) {
      // Left of element
      x = r.left - POPOVER_W - GAP;
      y = r.top;
    } else if (spaceBelow >= POPOVER_H + GAP) {
      // Below element
      x = r.left;
      y = r.bottom + GAP;
    } else {
      // Above element
      x = r.left;
      y = r.top - POPOVER_H - GAP;
    }

    // Clamp to viewport
    x = Math.max(8, Math.min(x, vw - POPOVER_W - 8));
    y = Math.max(8, Math.min(y, vh - POPOVER_H - 8));

    setCoords({ x, y });
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setCoords(null)}
    >
      {children}

      {/* Dashed highlight ring */}
      <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-dashed border-[#5C9A9E]/50 z-10" />

      {/* Fixed-position popover — always stays in viewport */}
      {coords && (
        <div
          className="fixed z-[300] pointer-events-none"
          style={{ left: coords.x, top: coords.y, width: POPOVER_W }}
        >
          <div className="bg-[#081731] rounded-xl p-4 shadow-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5C9A9E] flex-shrink-0" />
              <p className="text-[#5C9A9E] text-[9px] font-bold uppercase tracking-widest">
                How it works
              </p>
            </div>
            <p className="font-bold text-sm text-white mb-1.5">{title}</p>
            <p className="text-white/65 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
