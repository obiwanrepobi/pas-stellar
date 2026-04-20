"use client";

import { useState } from "react";
import { Boat, BoatStatus, statusConfig } from "./data";

interface Props {
  boats: Boat[];
  onBoatClick: (boat: Boat) => void;
}

const filters: { label: string; value: BoatStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "In Service", value: "in-service" },
  { label: "Needs Maintenance", value: "needs-maintenance" },
  { label: "Out of Service", value: "out-of-service" },
  { label: "Dry Dock", value: "dry-dock" },
];

export default function ListView({ boats, onBoatClick }: Props) {
  const [activeFilter, setActiveFilter] = useState<BoatStatus | "all">("all");
  const [search, setSearch] = useState("");

  const rentalBoats = boats.filter(
    (b) => b.category !== "Utility"
  );

  const filtered = rentalBoats.filter((b) => {
    const matchesFilter = activeFilter === "all" || b.status === activeFilter;
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Filter + Search bar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex bg-[#efefef] rounded-full p-1 gap-0.5">
          {filters.map((f) => {
            const count =
              f.value === "all"
                ? rentalBoats.length
                : rentalBoats.filter((b) => b.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeFilter === f.value
                    ? "bg-black text-white shadow-[rgba(0,0,0,0.12)_0px_2px_8px]"
                    : "text-[#4b4b4b] hover:text-black"
                }`}
              >
                {f.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeFilter === f.value ? "bg-white/20 text-white" : "bg-white/80 text-[#4b4b4b]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search boats…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm focus:outline-none focus:border-[#5C9A9E] w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Status", "Boat", "Category", "Dock", "HP", "Cap.", "Last Cleaned", "AM Check", "Next Out", "Tasks"].map(
                (h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((boat, idx) => {
              const sc = statusConfig[boat.status];
              return (
                <tr
                  key={boat.id}
                  onClick={() => onBoatClick(boat)}
                  className={`border-b border-gray-50 cursor-pointer hover:bg-[#f0f7fb] transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  {/* Status dot */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap"
                      style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                      {sc.label}
                    </span>
                  </td>

                  {/* Boat name */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#081731] text-sm">{boat.name}</div>
                    {boat.code && (
                      <div className="text-[10px] font-mono text-[#5C9A9E] font-bold">{boat.code}</div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-500 text-xs">{boat.category}</td>

                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#2A5B7D]">
                      {boat.dock}{boat.slip > 0 ? `·${boat.slip}` : ""}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700 text-xs font-medium">{boat.hp}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-medium">{boat.capacity}</td>

                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-700">{boat.lastCleaned}</div>
                    <div className="text-[10px] text-gray-400">by {boat.lastCleanedBy} · ✓ {boat.cleaningSignedOffBy}</div>
                  </td>

                  <td className="px-4 py-3">
                    {boat.morningCheckDone ? (
                      <span className="text-emerald-600 text-xs font-semibold">✓ {boat.morningCheckBy}</span>
                    ) : (
                      <span className="text-red-500 text-xs font-semibold">✗ Pending</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-600">{boat.nextOut}</td>

                  <td className="px-4 py-3">
                    {boat.outstandingTasks.length > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full text-[10px] font-semibold">
                        ⚠ {boat.outstandingTasks.length}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No boats match your filter.
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">
        Showing {filtered.length} of {rentalBoats.length} vessels
      </p>
    </div>
  );
}
