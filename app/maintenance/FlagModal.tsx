"use client";

import { useState } from "react";
import type { Boat } from "../fleet/data";

const SOURCES = [
  { value: "customer-return", label: "Customer reported on return" },
  { value: "dock-walk", label: "Dock walk" },
  { value: "morning-check", label: "Morning check" },
  { value: "captain-report", label: "Captain inspection post-rental" },
  { value: "scheduled", label: "Scheduled maintenance" },
];

interface Props {
  boat: Boat;
  onClose: () => void;
}

export default function FlagModal({ boat, onClose }: Props) {
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!source || !note.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden">
        {submitted ? (
          /* Confirmation */
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
              <span className="w-4 h-4 rounded-full bg-amber-400" />
            </div>
            <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1">Flagged</p>
            <p className="font-bold text-xl text-black mb-1">{boat.name} needs attention</p>
            {boat.code && <p className="text-xs font-mono text-[#5C9A9E] font-bold mb-4">{boat.code}</p>}
            <p className="text-xs text-[#4b4b4b] mb-6">
              The boat has been moved to <span className="font-semibold text-amber-700">Needs Maintenance</span>.
              It will appear in the active issues list and is still available for rentals until taken out of service.
            </p>
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
                    Flag for maintenance
                  </p>
                  <p className="font-bold text-lg text-black leading-tight">{boat.name}</p>
                  {boat.code && (
                    <p className="text-xs font-mono text-[#5C9A9E] font-bold mt-0.5">{boat.code}</p>
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
            <div className="px-6 py-5 space-y-4">
              {/* How was it found */}
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  How was it found?
                </p>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSource(s.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        source === s.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-[#4b4b4b] border-black/15 hover:border-black/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  What's the issue?
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe what was found — be specific. This becomes the official log entry."
                  rows={4}
                  className="w-full text-xs border border-black/10 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:border-[#5C9A9E] placeholder-[#c0c0c0] bg-[#fafafa]"
                />
              </div>

              {/* Photos */}
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  Photos
                </p>
                <div className="flex items-center gap-2">
                  <button className="w-16 h-16 rounded-xl border-2 border-dashed border-black/15 flex items-center justify-center hover:border-[#5C9A9E]/60 hover:bg-[#f0f7fb]/50 transition-colors">
                    <svg className="w-4 h-4 text-[#afafaf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <p className="text-xs text-[#afafaf]">Add photos from the dock or rental return</p>
                </div>
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
                disabled={!source || !note.trim()}
                className="bg-black text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Flag {boat.name} for Maintenance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
