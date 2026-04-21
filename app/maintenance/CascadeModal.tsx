"use client";

import { useEffect, useState } from "react";
import type { Boat } from "../fleet/data";

const STEPS = [
  "Removing from public website availability",
  "Blocking from reservation calendar",
  "Logging status change with timestamp",
];

interface Props {
  boat: Boat;
  onClose: () => void;
}

export default function CascadeModal({ boat, onClose }: Props) {
  const [completed, setCompleted] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (completed < STEPS.length) {
      const t = setTimeout(() => setCompleted((c) => c + 1), 680);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 350);
      return () => clearTimeout(t);
    }
  }, [completed]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-[440px] shadow-2xl">
        {/* Boat header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-0.5">
              Taking out of service
            </p>
            <p className="font-bold text-xl text-black leading-tight">{boat.name}</p>
            {boat.code && (
              <p className="text-xs font-mono text-[#5C9A9E] font-bold mt-0.5">{boat.code}</p>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                  i < completed ? "bg-black" : "bg-[#efefef]"
                }`}
              >
                {i < completed && (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm transition-colors duration-300 ${
                  i < completed ? "text-black font-medium" : "text-[#afafaf]"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {done ? (
          <button
            onClick={onClose}
            className="w-full bg-black text-white rounded-full py-3 text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
          >
            Done — {boat.name} is now out of service
          </button>
        ) : (
          <div className="h-11 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
