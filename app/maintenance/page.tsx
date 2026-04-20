"use client";

import { useState } from "react";
import { boats, statusConfig } from "../fleet/data";
import BoatModal from "../fleet/BoatModal";
import type { Boat, BoatStatus } from "../fleet/data";

const maintenanceBoats = boats.filter(
  (b) => b.status === "out-of-service" || b.status === "needs-maintenance"
);
const dryDockBoats = boats.filter((b) => b.status === "dry-dock");
const allTaskBoats = boats.filter((b) => b.outstandingTasks.length > 0);

type Tab = "status" | "dry-dock" | "tasks";

export default function MaintenancePage() {
  const [tab, setTab] = useState<Tab>("status");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  return (
    <div className="px-8 py-6 max-w-[1440px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
            Pocono Action Sports
          </p>
          <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">
            Maintenance
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-red-700 text-xs font-semibold">
              {maintenanceBoats.length} boat{maintenanceBoats.length !== 1 ? "s" : ""} need attention
            </span>
          </div>
          <button className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
            Log Work
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Out of Service", value: boats.filter((b) => b.status === "out-of-service").length, color: "#ef4444" },
          { label: "Needs Maintenance", value: boats.filter((b) => b.status === "needs-maintenance").length, color: "#f59e0b" },
          { label: "Dry Dock", value: dryDockBoats.length, color: "#94a3b8" },
          { label: "Open Tasks", value: allTaskBoats.reduce((n, b) => n + b.outstandingTasks.length, 0), color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-[rgba(0,0,0,0.08)_0px_4px_16px]">
            <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">{s.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold leading-none text-black">{s.value}</span>
              <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-[#efefef] rounded-full p-1 gap-0.5 w-fit mb-5">
        {([
          { value: "status", label: "Active Issues" },
          { value: "dry-dock", label: "Dry Dock" },
          { value: "tasks", label: "All Tasks" },
        ] as { value: Tab; label: string }[]).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t.value
                ? "bg-black text-white shadow-[rgba(0,0,0,0.12)_0px_2px_8px]"
                : "text-[#4b4b4b] hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Issues */}
      {tab === "status" && (
        <div className="space-y-3">
          {maintenanceBoats.length === 0 ? (
            <EmptyState message="No active maintenance issues." />
          ) : (
            maintenanceBoats.map((boat) => (
              <MaintenanceCard key={boat.id} boat={boat} onClick={() => setSelectedBoat(boat)} />
            ))
          )}
        </div>
      )}

      {/* Dry Dock */}
      {tab === "dry-dock" && (
        <div className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-black">Pre-Season Dry Dock</h2>
            <span className="text-xs text-[#afafaf]">Target launch: May 1, 2026</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#f5f5f5]/50">
                {["Vessel", "Category", "Dock / Slip", "Last Cleaned", "Tasks", "Target Launch"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dryDockBoats.map((boat, i) => (
                <tr
                  key={boat.id}
                  onClick={() => setSelectedBoat(boat)}
                  className={`border-b border-black/5 cursor-pointer hover:bg-[#f5f5f5] transition-colors ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-black text-sm">{boat.name}</div>
                    {boat.code && <div className="text-[10px] font-mono text-[#5C9A9E] font-bold mt-0.5">{boat.code}</div>}
                  </td>
                  <td className="px-6 py-4 text-[#4b4b4b] text-xs">{boat.category}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-black">Dock {boat.dock} · {boat.slip}</td>
                  <td className="px-6 py-4 text-xs text-[#4b4b4b]">{boat.lastCleaned}</td>
                  <td className="px-6 py-4">
                    {boat.outstandingTasks.length > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        {boat.outstandingTasks.length} open
                      </span>
                    ) : (
                      <span className="text-[#afafaf] text-xs">Clear</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-[#4b4b4b]">{boat.nextOut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Tasks */}
      {tab === "tasks" && (
        <div className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5">
            <h2 className="font-semibold text-sm text-black">
              Outstanding Tasks
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {allTaskBoats.reduce((n, b) => n + b.outstandingTasks.length, 0)}
              </span>
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#f5f5f5]/50">
                {["Vessel", "Task", "Status", "Assigned"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTaskBoats.flatMap((boat) =>
                boat.outstandingTasks.map((task, i) => {
                  const sc = statusConfig[boat.status as BoatStatus];
                  return (
                    <tr
                      key={`${boat.id}-${i}`}
                      onClick={() => setSelectedBoat(boat)}
                      className="border-b border-black/5 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-black text-sm">{boat.name}</div>
                        {boat.code && <div className="text-[10px] font-mono text-[#5C9A9E] font-bold">{boat.code}</div>}
                      </td>
                      <td className="px-6 py-4 text-[#4b4b4b] text-xs max-w-xs">{task}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                          style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4b4b4b]">
                        {task.includes("Dave") ? "Dave" : task.includes("Sue") ? "Sue" : "Unassigned"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedBoat && (
        <BoatModal boat={selectedBoat} onClose={() => setSelectedBoat(null)} />
      )}
    </div>
  );
}

function MaintenanceCard({ boat, onClick }: { boat: Boat; onClick: () => void }) {
  const sc = statusConfig[boat.status];
  const isOut = boat.status === "out-of-service";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] p-5 cursor-pointer hover:shadow-[rgba(0,0,0,0.14)_0px_4px_20px] transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: boat info */}
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sc.dot }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {boat.code && (
                <span className="text-[10px] font-mono font-bold text-[#5C9A9E] tracking-widest">{boat.code}</span>
              )}
              <span className="text-black font-bold text-base">{boat.name}</span>
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
              >
                {sc.label}
              </span>
            </div>
            <p className="text-[#4b4b4b] text-xs mb-2">
              {boat.category} · Dock {boat.dock} · Slip {boat.slip}
            </p>
            {boat.maintenanceNote && (
              <p className="text-[#4b4b4b] text-xs leading-relaxed max-w-2xl">{boat.maintenanceNote}</p>
            )}
          </div>
        </div>

        {/* Right: last out + next */}
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-[#afafaf] uppercase tracking-wider mb-0.5">Last Out</p>
          <p className="text-xs font-semibold text-black">{boat.lastOut}</p>
          <p className="text-[10px] text-[#afafaf] uppercase tracking-wider mt-2 mb-0.5">Next Out</p>
          <p className="text-xs font-semibold text-black">{boat.nextOut}</p>
        </div>
      </div>

      {/* Tasks */}
      {boat.outstandingTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-black/5">
          <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
            Outstanding Tasks
          </p>
          <div className="space-y-1.5">
            {boat.outstandingTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded flex-shrink-0 bg-amber-100 border border-amber-200 flex items-center justify-center mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </span>
                <span className="text-xs text-[#4b4b4b]">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] p-12 text-center">
      <p className="text-[#afafaf] text-sm">{message}</p>
    </div>
  );
}
