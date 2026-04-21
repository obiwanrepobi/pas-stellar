"use client";

import { useState } from "react";
import { boats as allBoats, statusConfig } from "../fleet/data";
import type { Boat, BoatStatus } from "../fleet/data";
import PresentBox from "./PresentBox";

interface Props {
  onBoatClick: (boat: Boat) => void;
  presentMode: boolean;
}

interface TooltipState {
  boat: Boat;
  x: number;
  y: number;
}

// Dock A
const dockALeft = allBoats
  .filter((b) => b.dock === "A" && b.dockSide === "left")
  .sort((a, b) => a.dockRow - b.dockRow);
const dockARight = allBoats
  .filter((b) => b.dock === "A" && b.dockSide === "right")
  .sort((a, b) => a.dockRow - b.dockRow);

// Dock B — rental boats (dockSide "right" in data) shown on the LEFT of the pier
// Customer slips shown on the RIGHT
const dockBRentals = allBoats
  .filter((b) => b.dock === "B" && b.dockSide === "right")
  .sort((a, b) => a.dockRow - b.dockRow);

const DOCK_A_ROWS = 13;
const DOCK_B_ROWS = 15;
const CELL_H = 22;
const CELL_W = 58;
const PIER_W = 8;
const ROW_GAP = 2;

export default function CompactDockMap({ onBoatClick, presentMode }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTip = (boat: Boat, e: React.MouseEvent) =>
    setTooltip({ boat, x: e.clientX, y: e.clientY });
  const hideTip = () => setTooltip(null);

  return (
    <div className="relative">
      <PresentBox
        active={presentMode}
        title="Live dock map"
        description="A real-time bird's-eye view of the dock. Color tells the story — green is ready, amber needs attention, red is down. No walking the dock required."
        position="right"
      >
        <div
          className="rounded-2xl overflow-hidden shadow-[rgba(0,0,0,0.08)_0px_4px_16px] border border-black/5"
          style={{
            background: "linear-gradient(180deg, #e4edd8 0%, #e4edd8 40px, #c8e6f5 40px)",
          }}
        >
          {/* Shore strip */}
          <div
            className="h-10 flex items-center px-4 border-b border-black/5"
            style={{ background: "linear-gradient(180deg, #d0e0c4 0%, #e4edd8 100%)" }}
          >
            <span className="text-[#2A5B7D] text-[9px] font-semibold tracking-widest uppercase">
              Shore — Lake Wallenpaupack
            </span>
          </div>

          {/* Docks */}
          <div className="flex gap-5 px-5 py-4 items-start">
            <DockStructure
              label="A"
              leftBoats={dockARight}
              rightBoats={dockALeft}
              totalRows={DOCK_A_ROWS}
              customerSide={null}
              onHover={showTip}
              onLeave={hideTip}
              onClick={onBoatClick}
            />
            <DockStructure
              label="B"
              leftBoats={dockBRentals}
              rightBoats={[]}
              totalRows={DOCK_B_ROWS}
              customerSide="right"
              onHover={showTip}
              onLeave={hideTip}
              onClick={onBoatClick}
            />
          </div>

          {/* Water */}
          <div
            className="flex items-center justify-center py-3"
            style={{ background: "linear-gradient(180deg, #c8e6f5, #9ec8e8)" }}
          >
            <span className="text-[#2A5B7D]/50 text-[8px] font-semibold tracking-[0.3em] uppercase">
              Lake Wallenpaupack
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-t border-black/5 flex-wrap">
            {(
              Object.entries(statusConfig) as [
                BoatStatus,
                (typeof statusConfig)[BoatStatus]
              ][]
            )
              .filter(([k]) => k !== "dry-dock")
              .map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm border flex-shrink-0"
                    style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                  />
                  <span className="text-[9px] text-[#4b4b4b]">{cfg.label}</span>
                </div>
              ))}
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-100 border border-gray-200 flex-shrink-0" />
              <span className="text-[9px] text-[#afafaf]">Customer</span>
            </div>
          </div>
        </div>
      </PresentBox>

      {/* Tooltip */}
      {tooltip && (
        <DockTooltip
          boat={tooltip.boat}
          x={tooltip.x}
          y={tooltip.y}
          presentMode={presentMode}
        />
      )}
    </div>
  );
}

function DockStructure({
  label,
  leftBoats,
  rightBoats,
  totalRows,
  customerSide,
  onHover,
  onLeave,
  onClick,
}: {
  label: string;
  leftBoats: Boat[];
  rightBoats: Boat[];
  totalRows: number;
  customerSide: "left" | "right" | null;
  onHover: (boat: Boat, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (boat: Boat) => void;
}) {
  const leftByRow: Record<number, Boat> = {};
  const rightByRow: Record<number, Boat> = {};
  leftBoats.forEach((b) => (leftByRow[b.dockRow] = b));
  rightBoats.forEach((b) => (rightByRow[b.dockRow] = b));

  return (
    <div className="flex flex-col items-center">
      <span className="text-black text-[9px] font-bold mb-1.5 tracking-widest uppercase">
        Dock {label}
      </span>
      <div className="flex items-start gap-0.5">
        {/* Left column */}
        <div className="flex flex-col gap-[2px]">
          {Array.from({ length: totalRows }, (_, i) => i + 1).map((row) => (
            <SlipCell
              key={row}
              boat={leftByRow[row]}
              isCustomer={customerSide === "left"}
              onHover={onHover}
              onLeave={onLeave}
              onClick={onClick}
            />
          ))}
        </div>

        {/* Pier */}
        <div
          className="rounded-sm mx-0.5"
          style={{
            width: PIER_W,
            height: totalRows * (CELL_H + ROW_GAP) - ROW_GAP,
            background: "linear-gradient(180deg, #5C9A9E 0%, #2A5B7D 100%)",
          }}
        />

        {/* Right column */}
        <div className="flex flex-col gap-[2px]">
          {Array.from({ length: totalRows }, (_, i) => i + 1).map((row) => (
            <SlipCell
              key={row}
              boat={rightByRow[row]}
              isCustomer={customerSide === "right"}
              onHover={onHover}
              onLeave={onLeave}
              onClick={onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlipCell({
  boat,
  isCustomer,
  onHover,
  onLeave,
  onClick,
}: {
  boat?: Boat;
  isCustomer: boolean;
  onHover: (boat: Boat, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (boat: Boat) => void;
}) {
  if (isCustomer) {
    return (
      <div
        style={{ width: CELL_W, height: CELL_H }}
        className="rounded-sm flex items-center justify-center text-[7px] text-gray-300 bg-gray-100 border border-gray-200"
      >
        CX
      </div>
    );
  }

  if (!boat) {
    return (
      <div
        style={{ width: CELL_W, height: CELL_H }}
        className="rounded-sm border border-dashed border-[#B5D4E8]/50 bg-[#c8e6f5]/20"
      />
    );
  }

  const sc = statusConfig[boat.status];
  const label = boat.code || boat.name.split(" ")[0];

  return (
    <div
      style={{
        width: CELL_W,
        height: CELL_H,
        backgroundColor: sc.bg,
        borderColor: sc.border,
        color: sc.text,
      }}
      className="rounded-sm border cursor-pointer flex items-center justify-center hover:scale-105 hover:shadow-md hover:z-10 relative transition-all"
      onMouseEnter={(e) => onHover(boat, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick(boat)}
    >
      <span className="text-[8px] font-bold truncate px-1 text-center leading-tight">
        {label}
      </span>
      {boat.outstandingTasks.length > 0 && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 border border-white" />
      )}
    </div>
  );
}

function DockTooltip({
  boat,
  x,
  y,
  presentMode,
}: {
  boat: Boat;
  x: number;
  y: number;
  presentMode: boolean;
}) {
  const sc = statusConfig[boat.status];

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-3.5 pointer-events-none"
      style={{ left: x + 14, top: Math.max(8, y - 90), width: 230 }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          {boat.code && (
            <span className="text-[9px] font-mono font-bold text-[#5C9A9E]">
              {boat.code} ·{" "}
            </span>
          )}
          <span className="font-bold text-[#081731] text-xs">{boat.name}</span>
          <p className="text-gray-400 text-[9px] mt-0.5">{boat.category}</p>
        </div>
        <span
          className="text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
          style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
        >
          {sc.label}
        </span>
      </div>

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-400">Last service</span>
          <span className="text-gray-700 font-medium">{boat.lastCleaned}</span>
        </div>
        {boat.maintenanceNote && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 flex-shrink-0">Issue</span>
            <span className="text-amber-600 font-medium text-right leading-tight">
              {boat.maintenanceNote.split(".")[0]}
            </span>
          </div>
        )}
        {boat.outstandingTasks.length > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Open tasks</span>
            <span className="text-amber-600 font-semibold">{boat.outstandingTasks.length}</span>
          </div>
        )}
      </div>

      <p className="text-[8px] mt-2.5 font-medium text-[#5C9A9E]">
        {presentMode
          ? "Click to jump to maintenance record →"
          : boat.status === "in-service"
          ? "Click to flag for maintenance →"
          : "Click for details →"}
      </p>
    </div>
  );
}
