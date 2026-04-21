"use client";

import { useState } from "react";
import type { Boat } from "../fleet/data";

const PULL_OPTIONS = [
  { value: "mon-apr-27", label: "This Monday", sublabel: "Apr 27" },
  { value: "mon-may-4", label: "Next Monday", sublabel: "May 4" },
  { value: "custom", label: "Custom date", sublabel: "" },
];

interface Props {
  boat: Boat;
  onClose: () => void;
}

export default function ClearForRentalModal({ boat, onClose }: Props) {
  const [pullDate, setPullDate] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    pullDate === "custom" ? customDate.trim().length > 0 : pullDate !== "";

  const pullLabel =
    pullDate === "custom"
      ? customDate
      : PULL_OPTIONS.find((o) => o.value === pullDate)?.label +
        " · " +
        PULL_OPTIONS.find((o) => o.value === pullDate)?.sublabel;

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden">
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="w-4 h-4 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
              Cleared for Rental
            </p>
            <p className="font-bold text-xl text-black mb-1">
              {boat.name} is back in service
            </p>
            {boat.code && (
              <p className="text-xs font-mono text-[#5C9A9E] font-bold mb-4">
                {boat.code}
              </p>
            )}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-1">
                Service pull scheduled
              </p>
              <p className="text-sm font-semibold text-amber-900">{pullLabel}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Boat will automatically move back to Needs Maintenance and be
                blocked from new rentals starting that morning.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-black text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-black/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
                    Clear for rental
                  </p>
                  <p className="font-bold text-lg text-black leading-tight">
                    {boat.name}
                  </p>
                  {boat.code && (
                    <p className="text-xs font-mono text-[#5C9A9E] font-bold mt-0.5">
                      {boat.code}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-[#afafaf] hover:text-black transition-colors mt-0.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Warning */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Known issue:</span>{" "}
                  {boat.maintenanceNote} You're clearing this boat to run through
                  the weekend. Schedule when it should come back off the water for
                  service.
                </p>
              </div>

              {/* Pull date */}
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  Schedule service pull
                </p>
                <div className="flex flex-wrap gap-2">
                  {PULL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPullDate(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        pullDate === opt.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-[#4b4b4b] border-black/15 hover:border-black/40"
                      }`}
                    >
                      {opt.label}
                      {opt.sublabel && (
                        <span
                          className={`text-[9px] ${
                            pullDate === opt.value
                              ? "text-white/60"
                              : "text-[#afafaf]"
                          }`}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {pullDate === "custom" && (
                  <input
                    type="text"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    placeholder="e.g. May 12"
                    className="mt-2.5 w-full text-xs border border-black/10 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#5C9A9E] placeholder-[#c0c0c0] bg-[#fafafa]"
                  />
                )}
              </div>

              {/* Note */}
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  Note (optional)
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Cleared for the holiday weekend — monitor for any worsening and pull immediately if needed."
                  rows={3}
                  className="w-full text-xs border border-black/10 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:border-[#5C9A9E] placeholder-[#c0c0c0] bg-[#fafafa]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-between">
              <button
                onClick={onClose}
                className="text-sm text-[#afafaf] hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className="bg-emerald-600 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear {boat.name} for Rental
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
