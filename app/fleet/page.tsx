"use client";

import { useState } from "react";
import { boats, statusConfig } from "./data";
import MapView from "./MapView";
import ListView from "./ListView";
import BoatModal from "./BoatModal";
import type { Boat } from "./data";

const rentalBoats = boats.filter((b) => b.category !== "Utility");
const stats = [
  { label: "Total Fleet", value: rentalBoats.length, sub: "rental vessels" },
  { label: "In Service", value: rentalBoats.filter((b) => b.status === "in-service").length, color: "#10b981" },
  { label: "Needs Attention", value: rentalBoats.filter((b) => b.status === "needs-maintenance").length, color: "#f59e0b" },
  { label: "Out of Service", value: rentalBoats.filter((b) => b.status === "out-of-service").length, color: "#ef4444" },
  { label: "Dry Dock", value: rentalBoats.filter((b) => b.status === "dry-dock").length, color: "#94a3b8" },
];

const morningPending = rentalBoats.filter(
  (b) => !b.morningCheckDone && b.status !== "dry-dock"
);

export default function FleetPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  return (
    <div className="px-8 py-6 max-w-[1440px]">
      {/* Page title */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
            Pocono Action Sports
          </p>
          <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">
            Fleet Overview
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Morning check alert */}
          {morningPending.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-700 text-xs font-semibold">
                {morningPending.length} morning check{morningPending.length > 1 ? "s" : ""} pending
              </span>
            </div>
          )}
          <button className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
            Add Task
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-4 shadow-[rgba(0,0,0,0.08)_0px_4px_16px]"
          >
            <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
              {s.label}
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold leading-none text-black">{s.value}</span>
              {s.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full mb-1 flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
              )}
            </div>
            {s.sub && (
              <p className="text-[11px] text-[#afafaf] mt-1">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-[#efefef] rounded-full p-1 gap-0.5">
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                view === v
                  ? "bg-black text-white shadow-[rgba(0,0,0,0.12)_0px_2px_8px]"
                  : "text-[#4b4b4b] hover:text-black"
              }`}
            >
              {v === "map" ? "Map View" : "List View"}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#afafaf]">
          Morning checks: {rentalBoats.filter((b) => b.morningCheckDone && b.status !== "dry-dock").length} / {rentalBoats.filter((b) => b.status !== "dry-dock").length} complete
        </p>
      </div>

      {/* View content */}
      {view === "map" ? (
        <MapView onBoatClick={setSelectedBoat} />
      ) : (
        <ListView boats={boats} onBoatClick={setSelectedBoat} />
      )}

      {selectedBoat && (
        <BoatModal boat={selectedBoat} onClose={() => setSelectedBoat(null)} />
      )}
    </div>
  );
}
