"use client";

import { useState } from "react";
import { boats, statusConfig } from "./data";
import MapView from "./MapView";
import ListView from "./ListView";
import BoatModal from "./BoatModal";
import type { Boat } from "./data";

const stats = [
  {
    label: "Total Fleet",
    value: boats.filter((b) => b.category !== "Utility").length,
    sub: "rental vessels",
    color: "#081731",
    bg: "#f0f7fb",
  },
  {
    label: "In Service",
    value: boats.filter((b) => b.status === "in-service").length,
    sub: "ready to go",
    color: statusConfig["in-service"].text,
    bg: statusConfig["in-service"].bg,
    dot: statusConfig["in-service"].dot,
  },
  {
    label: "Needs Attention",
    value: boats.filter((b) => b.status === "needs-maintenance").length,
    sub: "flag for review",
    color: statusConfig["needs-maintenance"].text,
    bg: statusConfig["needs-maintenance"].bg,
    dot: statusConfig["needs-maintenance"].dot,
  },
  {
    label: "Out of Service",
    value: boats.filter((b) => b.status === "out-of-service").length,
    sub: "not available",
    color: statusConfig["out-of-service"].text,
    bg: statusConfig["out-of-service"].bg,
    dot: statusConfig["out-of-service"].dot,
  },
  {
    label: "Dry Dock",
    value: boats.filter((b) => b.status === "dry-dock").length,
    sub: "pre-season prep",
    color: statusConfig["dry-dock"].text,
    bg: statusConfig["dry-dock"].bg,
    dot: statusConfig["dry-dock"].dot,
  },
];

const tasksBoats = boats.filter((b) => b.outstandingTasks.length > 0);
const morningPending = boats.filter(
  (b) => !b.morningCheckDone && b.status !== "dry-dock" && b.category !== "Utility"
);

export default function FleetPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#081731]">Fleet Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Dock A &amp; B · Lake Wallenpaupack · Apr 20, 2026
          </p>
        </div>
        <button className="bg-[#081731] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1a3358] transition-colors shadow-sm">
          + Add Task
        </button>
      </div>

      {/* Alert banners */}
      {morningPending.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-amber-500 text-lg">⚠</span>
          <div>
            <p className="text-amber-800 text-sm font-semibold">
              {morningPending.length} boat{morningPending.length > 1 ? "s" : ""} missing morning check
            </p>
            <p className="text-amber-600 text-xs">
              {morningPending.map((b) => b.code || b.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 border border-gray-100 shadow-sm"
            style={{ backgroundColor: s.bg }}
          >
            <div className="flex items-center gap-2 mb-2">
              {s.dot && (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
              )}
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.color }}>
                {s.label}
              </p>
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: s.color, opacity: 0.6 }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Outstanding tasks strip */}
      {tasksBoats.length > 0 && (
        <div className="mb-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400">⚠</span>
            <h3 className="text-sm font-bold text-[#081731]">Outstanding Tasks</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {tasksBoats.reduce((n, b) => n + b.outstandingTasks.length, 0)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasksBoats.map((boat) =>
              boat.outstandingTasks.map((task, i) => (
                <button
                  key={`${boat.id}-${i}`}
                  onClick={() => setSelectedBoat(boat)}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs hover:border-amber-400 transition-colors text-left"
                >
                  <span className="font-bold text-[#081731] flex-shrink-0">
                    {boat.code || boat.name}
                  </span>
                  <span className="text-amber-700 truncate max-w-[200px]">{task}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-0.5">
          <button
            onClick={() => setView("map")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              view === "map"
                ? "bg-[#081731] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🗺 Map View
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              view === "list"
                ? "bg-[#081731] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ☰ List View
          </button>
        </div>
        <span className="text-xs text-gray-400">
          Morning checks: {boats.filter((b) => b.morningCheckDone).length}/{boats.filter((b) => b.status !== "dry-dock" && b.category !== "Utility").length} complete
        </span>
      </div>

      {/* View content */}
      {view === "map" ? (
        <MapView onBoatClick={setSelectedBoat} />
      ) : (
        <ListView boats={boats} onBoatClick={setSelectedBoat} />
      )}

      {/* Boat modal */}
      {selectedBoat && (
        <BoatModal boat={selectedBoat} onClose={() => setSelectedBoat(null)} />
      )}
    </div>
  );
}
