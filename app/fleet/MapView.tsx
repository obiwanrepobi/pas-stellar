"use client";

import { useState, useRef } from "react";
import { Boat, boats as allBoats, statusConfig, BoatStatus } from "./data";

interface Props {
  onBoatClick: (boat: Boat) => void;
}

interface TooltipState {
  boat: Boat;
  x: number;
  y: number;
}

// Dock A: left side rows 1–13 (shore→water), right side rows 1–8
const dockALeft = allBoats
  .filter((b) => b.dock === "A" && b.dockSide === "left")
  .sort((a, b) => a.dockRow - b.dockRow);

const dockARight = allBoats
  .filter((b) => b.dock === "A" && b.dockSide === "right")
  .sort((a, b) => a.dockRow - b.dockRow);

// Dock B: right side rows 1–15
const dockBRight = allBoats
  .filter((b) => b.dock === "B" && b.dockSide === "right")
  .sort((a, b) => a.dockRow - b.dockRow);

const DOCK_A_ROWS = 13;
const DOCK_B_ROWS = 15;
const CELL_H = 30;
const CELL_W = 76;
const PIER_W = 10;
const ROW_GAP = 3;

export default function MapView({ onBoatClick }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const showTooltip = (boat: Boat, e: React.MouseEvent) => {
    setTooltip({ boat, x: e.clientX, y: e.clientY });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <div className="relative" ref={mapRef}>
      {/* Map container */}
      <div
        className="rounded-2xl overflow-hidden border border-[#B5D4E8] shadow-sm"
        style={{ background: "linear-gradient(180deg, #e8f0e4 0%, #e8f0e4 48px, #c8e6f5 48px)" }}
      >
        {/* Shore strip */}
        <div className="h-12 flex items-center px-6 border-b border-[#B5D4E8]/60"
          style={{ background: "linear-gradient(180deg, #d4e8cc 0%, #e8f0e4 100%)" }}>
          <span className="text-[#2A5B7D] text-xs font-semibold tracking-wider uppercase">
            🌲 Shore — Lake Wallenpaupack
          </span>
        </div>

        {/* Docks row */}
        <div className="flex gap-8 px-8 py-6 items-start">

          {/* Gas Dock (decorative) */}
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-[#081731] text-[10px] font-semibold mb-1 tracking-wide uppercase">Gas Dock</span>
            <div style={{ width: 40, height: (DOCK_A_ROWS * (CELL_H + ROW_GAP)) }} className="rounded-lg bg-[#5C9A9E]/30 border-2 border-[#5C9A9E]/40 flex items-center justify-center">
              ⛽
            </div>
          </div>

          {/* Dock A */}
          <DockStructure
            label="Dock A"
            leftBoats={dockALeft}
            rightBoats={dockARight}
            totalRows={DOCK_A_ROWS}
            customerSide={null}
            onHover={showTooltip}
            onLeave={hideTooltip}
            onBoatClick={onBoatClick}
          />

          {/* Dock B */}
          <DockStructure
            label="Dock B"
            leftBoats={[]}
            rightBoats={dockBRight}
            totalRows={DOCK_B_ROWS}
            customerSide="left"
            onHover={showTooltip}
            onLeave={hideTooltip}
            onBoatClick={onBoatClick}
          />

          {/* Docks C–E (decorative) */}
          {["C", "D", "E"].map((label) => (
            <div key={label} className="flex flex-col items-center gap-1 opacity-25">
              <span className="text-[#081731] text-[10px] font-semibold mb-1 uppercase tracking-wide">Dock {label}</span>
              <div style={{ width: 40, height: (DOCK_B_ROWS * (CELL_H + ROW_GAP)) }} className="rounded-lg bg-gray-300 border-2 border-gray-400" />
            </div>
          ))}
        </div>

        {/* Water */}
        <div className="flex items-center justify-center py-5"
          style={{ background: "linear-gradient(180deg, #c8e6f5, #9ec8e8)" }}>
          <span className="text-[#2A5B7D]/60 text-sm font-medium tracking-widest">
            ~ ~ ~ LAKE WALLENPAUPACK ~ ~ ~
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-6 py-3 bg-white border-t border-gray-100">
          {(Object.entries(statusConfig) as [BoatStatus, typeof statusConfig[BoatStatus]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border flex-shrink-0"
                style={{ backgroundColor: cfg.bg, borderColor: cfg.border }} />
              <span className="text-xs text-gray-500">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400">Customer Slip</span>
          </div>
          <span className="text-xs text-gray-400 ml-auto">Click any boat for details</span>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <BoatTooltip boat={tooltip.boat} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}

interface DockStructureProps {
  label: string;
  leftBoats: Boat[];
  rightBoats: Boat[];
  totalRows: number;
  customerSide: "left" | "right" | null;
  onHover: (boat: Boat, e: React.MouseEvent) => void;
  onLeave: () => void;
  onBoatClick: (boat: Boat) => void;
}

function DockStructure({ label, leftBoats, rightBoats, totalRows, customerSide, onHover, onLeave, onBoatClick }: DockStructureProps) {
  const leftByRow: Record<number, Boat> = {};
  const rightByRow: Record<number, Boat> = {};
  leftBoats.forEach((b) => (leftByRow[b.dockRow] = b));
  rightBoats.forEach((b) => (rightByRow[b.dockRow] = b));

  return (
    <div className="flex flex-col items-center">
      <span className="text-[#081731] text-[11px] font-bold mb-2 tracking-wide uppercase">{label}</span>
      <div className="flex items-start gap-0.5">
        {/* Left column */}
        <div className="flex flex-col gap-[3px]">
          {Array.from({ length: totalRows }, (_, i) => i + 1).map((row) => {
            const boat = leftByRow[row];
            return (
              <SlipCell
                key={row}
                boat={boat}
                isCustomer={customerSide === "left"}
                onHover={onHover}
                onLeave={onLeave}
                onClick={onBoatClick}
              />
            );
          })}
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
        <div className="flex flex-col gap-[3px]">
          {Array.from({ length: totalRows }, (_, i) => i + 1).map((row) => {
            const boat = rightByRow[row];
            return (
              <SlipCell
                key={row}
                boat={boat}
                isCustomer={customerSide === "right"}
                onHover={onHover}
                onLeave={onLeave}
                onClick={onBoatClick}
              />
            );
          })}
        </div>
      </div>

      {/* Dock label at water end */}
      <span className="text-[#2A5B7D]/50 text-[9px] mt-1.5 tracking-widest uppercase">
        {label} Dock
      </span>
    </div>
  );
}

interface SlipCellProps {
  boat?: Boat;
  isCustomer: boolean;
  onHover: (boat: Boat, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (boat: Boat) => void;
}

function SlipCell({ boat, isCustomer, onHover, onLeave, onClick }: SlipCellProps) {
  if (isCustomer) {
    return (
      <div
        style={{ width: CELL_W, height: CELL_H }}
        className="rounded-sm flex items-center justify-center text-[9px] text-gray-300 bg-gray-100 border border-gray-200 font-medium"
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
  const displayLabel = boat.code || boat.name.split(" ")[0];

  return (
    <div
      style={{
        width: CELL_W,
        height: CELL_H,
        backgroundColor: sc.bg,
        borderColor: sc.border,
        color: sc.text,
      }}
      className="rounded-sm border cursor-pointer flex items-center justify-center transition-all hover:scale-105 hover:shadow-md hover:z-10 relative"
      onMouseEnter={(e) => onHover(boat, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick(boat)}
    >
      <span className="text-[10px] font-bold truncate px-1 leading-tight text-center">
        {displayLabel}
      </span>
      {boat.outstandingTasks.length > 0 && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
      )}
    </div>
  );
}

function BoatTooltip({ boat, x, y }: { boat: Boat; x: number; y: number }) {
  const sc = statusConfig[boat.status];

  const left = x + 16;
  const top = Math.max(8, y - 120);

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 pointer-events-none"
      style={{ left, top, width: 260, maxHeight: "80vh", overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {boat.code && (
            <span className="text-[10px] font-mono font-bold text-[#5C9A9E] tracking-widest uppercase">
              {boat.code} ·{" "}
            </span>
          )}
          <span className="font-bold text-[#081731] text-sm">{boat.name}</span>
          <p className="text-gray-400 text-[10px] mt-0.5">{boat.category}</p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full border flex-shrink-0"
          style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
        >
          {sc.label}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { l: "HP", v: boat.hp },
          { l: "Cap.", v: `${boat.capacity}p` },
          { l: "Slip", v: boat.slip > 0 ? boat.slip : "—" },
        ].map((s) => (
          <div key={s.l} className="bg-[#f0f7fb] rounded-lg p-1.5 text-center">
            <p className="text-[9px] text-[#5C9A9E] uppercase font-semibold">{s.l}</p>
            <p className="text-[#081731] font-bold text-xs">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <TRow
          label="AM Check"
          value={boat.morningCheckDone ? `✓ ${boat.morningCheckBy}` : "✗ Not done"}
          warn={!boat.morningCheckDone}
        />
        <TRow label="Last Cleaned" value={`${boat.lastCleaned} · ${boat.lastCleanedBy}`} />
        <TRow label="Next Out" value={boat.nextOut} />
        {boat.outstandingTasks.length > 0 && (
          <TRow
            label={`Tasks (${boat.outstandingTasks.length})`}
            value={boat.outstandingTasks[0]}
            warn
          />
        )}
      </div>

      <p className="text-[9px] text-gray-300 mt-3 text-center">Click for full details</p>
    </div>
  );
}

function TRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 text-[10px] w-20 flex-shrink-0 font-medium">{label}</span>
      <span className={`text-[10px] leading-tight ${warn ? "text-amber-600 font-semibold" : "text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}
