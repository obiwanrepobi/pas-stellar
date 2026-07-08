"use client";

import { useRef, useState } from "react";
import { statusConfig, type Boat, type BoatStatus } from "../fleet/data";
import {
  reservations,
  reservationsForBoat,
  rentalFleetByCategory,
  openWindows,
  dayCounts,
  turnoverBoatIds,
  fmt,
  fmtRange,
  pctLeft,
  pctWidth,
  DAY_START,
  DAY_END,
  NOW_MIN,
  HALF_MIN,
  FULL_MIN,
  DEMO_DATE,
} from "./data";

const LABEL_W = 132; // px, boat-name column
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => (8 + i) * 60); // 8a → 7p
const groups = rentalFleetByCategory();
const counts = dayCounts();
const turnovers = turnoverBoatIds();
const teal = { bg: "#e1f5ee", border: "#5DCAA5", text: "#0F6E56" };

export default function ReservationsPage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState<{ cat: string; top: number } | null>(null);

  function onLaneEnter(e: React.MouseEvent<HTMLDivElement>, cat: string) {
    const board = boardRef.current;
    if (!board) return;
    const rowRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    setPeek({ cat, top: rowRect.bottom - boardRect.top });
  }

  const nowLeft = `calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${pctLeft(NOW_MIN) / 100})`;

  return (
    <div className="px-8 py-6 max-w-[1800px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
            Pocono Action Sports
          </p>
          <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">
            Reservations
          </h1>
          <p className="text-sm text-[#4b4b4b] mt-1">{DEMO_DATE} · 1:30p</p>
        </div>
        <button className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
          + New booking
        </button>
      </div>

      {/* Counts */}
      <div className="flex gap-3 mb-5">
        <Count label="Out today" value={counts.outToday} />
        <Count label="Still to come back" value={counts.stillOut} color="#10b981" />
        <Count label="Turnovers" value={counts.turnovers} color="#f59e0b" />
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative bg-white rounded-xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden"
        onMouseLeave={() => setPeek(null)}
      >
        {/* Time axis */}
        <div className="flex bg-[#fafafa] border-b border-black/5">
          <div style={{ width: LABEL_W }} className="flex-shrink-0 px-3 py-2">
            <span className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest">
              Boat
            </span>
          </div>
          <div className="relative flex-1 h-8">
            {HOUR_LABELS.map((min) => (
              <span
                key={min}
                className="absolute -translate-x-1/2 top-2 text-[10px] text-[#afafaf]"
                style={{ left: `${pctLeft(min)}%` }}
              >
                {fmt(min)}
              </span>
            ))}
          </div>
        </div>

        {/* Category groups */}
        {groups.map((g) => (
          <div key={g.category}>
            <div className="px-3 py-1.5 bg-[#fafafa] border-b border-black/5">
              <span className="text-[11px] font-semibold text-[#4b4b4b]">
                {g.category}
              </span>
            </div>
            {g.boats.map((b) => (
              <BoatRow
                key={b.id}
                boat={b}
                onEnter={(e) => b.status === "in-service" && onLaneEnter(e, g.category)}
              />
            ))}
          </div>
        ))}

        {/* Now line */}
        <div
          className="absolute pointer-events-none z-10"
          style={{ left: nowLeft, top: 32, bottom: 0, width: 2, background: "#D85A30" }}
        >
          <span className="absolute -top-0.5 -left-3.5 text-[9px] font-semibold text-[#D85A30] bg-white px-1">
            now
          </span>
        </div>

        {/* Availability peek */}
        {peek && <Peek cat={peek.cat} top={peek.top} />}
      </div>

      <p className="text-xs text-[#afafaf] mt-3">
        Hover a boat&apos;s lane to see open windows for that category · showing{" "}
        {reservations.length} bookings across the rental fleet
      </p>
    </div>
  );
}

function Count({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-[rgba(0,0,0,0.08)_0px_4px_16px] min-w-[130px]">
      <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
        {label}
      </p>
      <span
        className="text-2xl font-bold leading-none"
        style={{ color: color ?? "#000" }}
      >
        {value}
      </span>
    </div>
  );
}

function BoatRow({
  boat,
  onEnter,
}: {
  boat: Boat;
  onEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const res = reservationsForBoat(boat.id);
  const inService = boat.status === "in-service";
  const sc = statusConfig[boat.status as BoatStatus];
  const isTurnover = turnovers.has(boat.id);

  const hourGrid =
    "repeating-linear-gradient(to right, transparent 0, transparent calc(" +
    (60 / (DAY_END - DAY_START)) * 100 +
    "% - 1px), rgba(0,0,0,0.05) calc(" +
    (60 / (DAY_END - DAY_START)) * 100 +
    "% - 1px), rgba(0,0,0,0.05) " +
    (60 / (DAY_END - DAY_START)) * 100 +
    "%)";

  return (
    <div
      className="flex items-stretch border-b border-black/5"
      onMouseEnter={onEnter}
      style={{ cursor: inService ? "crosshair" : "default" }}
    >
      {/* Label */}
      <div
        style={{ width: LABEL_W, opacity: inService ? 1 : 0.5 }}
        className="flex-shrink-0 px-3 py-2 border-r border-black/5 flex flex-col justify-center"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-black">{boat.name}</span>
          {isTurnover && (
            <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 rounded-full">
              turn
            </span>
          )}
        </div>
        {boat.code && (
          <span className="text-[10px] font-mono text-[#5C9A9E] font-semibold">
            {boat.code}
          </span>
        )}
      </div>

      {/* Lane */}
      <div className="relative flex-1 min-h-[46px]" style={{ backgroundImage: hourGrid }}>
        {!inService ? (
          <div
            className="absolute inset-1.5 rounded-md flex items-center px-3 text-[12px]"
            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
          >
            {sc.label}
            {boat.maintenanceNote ? ` · ${boat.maintenanceNote.split(".")[0]}` : ""}
          </div>
        ) : (
          res.map((r) => (
            <div
              key={r.id}
              className="absolute top-[7px] bottom-[7px] rounded-md flex items-center px-2 text-[12px] overflow-hidden whitespace-nowrap"
              style={{
                left: `${pctLeft(r.start)}%`,
                width: `${pctWidth(r.duration)}%`,
                background: teal.bg,
                border: `1px solid ${teal.border}`,
                color: teal.text,
              }}
              title={`${r.renter} · ${fmtRange(r.start, r.start + r.duration)}`}
            >
              <span className="truncate">
                {r.renter} · {fmtRange(r.start, r.start + r.duration)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Peek({ cat, top }: { cat: string; top: number }) {
  const half = openWindows(cat, HALF_MIN);
  const full = openWindows(cat, FULL_MIN);
  return (
    <div
      className="absolute z-20 bg-white rounded-xl border border-black/10 shadow-[rgba(0,0,0,0.16)_0px_8px_28px] p-3.5"
      style={{ top, left: LABEL_W + 8, width: 360 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-black">
          Open windows · {cat}
        </span>
        <span className="text-[10px] text-[#afafaf]">tap to book</span>
      </div>
      <WindowRow label="Half day · 4h" wins={half} />
      <div className="mt-2">
        <WindowRow label="Full day · 7h" wins={full} />
      </div>
    </div>
  );
}

function WindowRow({
  label,
  wins,
}: {
  label: string;
  wins: { start: number; end: number }[];
}) {
  return (
    <div>
      <p className="text-[10px] text-[#afafaf] mb-1">{label}</p>
      {wins.length === 0 ? (
        <p className="text-[11px] text-[#afafaf] italic">None open</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {wins.map((w) => (
            <span
              key={w.start}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer whitespace-nowrap"
              style={{ background: teal.bg, border: `0.5px solid ${teal.border}`, color: teal.text }}
            >
              {fmtRange(w.start, w.end)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
