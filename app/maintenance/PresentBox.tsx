"use client";

import { useState } from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function PresentBox({
  children,
  title,
  description,
  active,
  position = "right",
  className = "",
}: Props) {
  const [visible, setVisible] = useState(false);

  if (!active) return <div className={className}>{children}</div>;

  const popoverPos =
    position === "right" ? "left-full top-0 ml-3" :
    position === "left"  ? "right-full top-0 mr-3" :
    position === "top"   ? "bottom-full left-0 mb-3" :
                           "top-full left-0 mt-3";

  const arrowCls =
    position === "right" ? "absolute left-0 top-5 -translate-x-[5px] border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-[#081731]" :
    position === "left"  ? "absolute right-0 top-5 translate-x-[5px] border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-[#081731]" :
    position === "top"   ? "absolute bottom-0 left-5 translate-y-[5px] border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#081731]" :
                           "absolute top-0 left-5 -translate-y-[5px] border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-[#081731]";

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {/* Dashed ring overlay */}
      <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-dashed border-[#5C9A9E]/50 z-10" />

      {/* Popover */}
      {visible && (
        <div className={`absolute z-[200] w-64 pointer-events-none ${popoverPos}`}>
          <div className="relative bg-[#081731] rounded-xl p-4 shadow-2xl border border-white/10">
            <div className={arrowCls} />
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5C9A9E] flex-shrink-0" />
              <p className="text-[#5C9A9E] text-[9px] font-bold uppercase tracking-widest">How it works</p>
            </div>
            <p className="font-bold text-sm text-white mb-1.5">{title}</p>
            <p className="text-white/65 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
