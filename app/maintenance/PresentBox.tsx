"use client";

import { useState } from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  className?: string;
  position?: string; // kept for API compatibility, no longer used
}

const W = 260;
const H = 130;

export default function PresentBox({
  children,
  title,
  description,
  active,
  className = "",
}: Props) {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  if (!active) return <div className={className}>{children}</div>;

  const tipLeft = mouse
    ? Math.min(mouse.x + 16, window.innerWidth - W - 8)
    : 0;
  const tipTop = mouse ? Math.max(8, mouse.y - H - 8) : 0;

  return (
    <div
      className={`relative ${className}`}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setMouse(null)}
    >
      {children}

      {/* Dashed highlight ring */}
      <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-dashed border-[#5C9A9E]/50 z-10" />

      {/* Tooltip follows cursor, always stays in viewport */}
      {mouse && (
        <div
          className="fixed z-[300] pointer-events-none"
          style={{ left: tipLeft, top: tipTop, width: W }}
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
