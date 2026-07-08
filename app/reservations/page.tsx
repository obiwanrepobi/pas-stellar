"use client";

import { useRef, useState } from "react";
import { statusConfig, boats as fleetBoats, type Boat, type BoatStatus } from "../fleet/data";
import {
  Reservation,
  reservationsForBoat,
  rentalFleetByCategory,
  boatOpenWindows,
  typicalWindows,
  dayCounts,
  turnoverBoatIds,
  fmt,
  fmtRange,
  pctLeft,
  pctWidth,
  DAY_START,
  DAY_END,
  NOW_MIN,
  resEnd,
  reservations,
  DEMO_DATE,
} from "./data";

const LABEL_W = 132;
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => (8 + i) * 60);
const groups = rentalFleetByCategory();
const counts = dayCounts();
const turnovers = turnoverBoatIds();
const teal = { bg: "#e1f5ee", border: "#5DCAA5", text: "#0F6E56" };
const boatById = (id: string) => fleetBoats.find((b) => b.id === id);

export default function ReservationsPage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [slot, setSlot] = useState<{ boat: Boat; top: number } | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);

  function openSlot(e: React.MouseEvent<HTMLDivElement>, boat: Boat) {
    if (boat.status !== "in-service") return;
    const board = boardRef.current;
    if (!board) return;
    const rowRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSlot({ boat, top: rowRect.bottom - board.getBoundingClientRect().top });
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
          <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">Reservations</h1>
          <p className="text-sm text-[#4b4b4b] mt-1">{DEMO_DATE} · 1:30p</p>
        </div>
        <button className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
          + New booking
        </button>
      </div>

      {/* Counts */}
      <div className="flex gap-3 mb-4">
        <Count label="Out today" value={counts.outToday} />
        <Count label="Still to come back" value={counts.stillOut} color="#10b981" />
        <Count label="Turnovers" value={counts.turnovers} color="#f59e0b" />
      </div>

      {/* Typical time-slots reference card (the laminated desk card) */}
      <div className="mb-5">
        <button
          onClick={() => setCardOpen((v) => !v)}
          className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-[rgba(0,0,0,0.08)_0px_4px_16px] text-sm font-semibold text-black hover:bg-[#fafafa] transition-colors"
        >
          <svg className={`w-3.5 h-3.5 text-[#5C9A9E] transition-transform ${cardOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Typical time slots
          <span className="text-[11px] font-normal text-[#afafaf]">reference · same for every boat type</span>
        </button>

        {cardOpen && (
          <div className="mt-2 bg-white rounded-xl p-5 shadow-[rgba(0,0,0,0.08)_0px_4px_16px] grid grid-cols-3 gap-6">
            <SlotColumn title="Full day · 7h" wins={typicalWindows.full} />
            <SlotColumn title="Half day · morning" wins={typicalWindows.halfMorning} />
            <SlotColumn title="Half day · afternoon" wins={typicalWindows.halfAfternoon} />
          </div>
        )}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative bg-white rounded-xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden"
      >
        {/* Time axis */}
        <div className="flex bg-[#fafafa] border-b border-black/5">
          <div style={{ width: LABEL_W }} className="flex-shrink-0 px-3 py-2">
            <span className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest">Boat</span>
          </div>
          <div className="relative flex-1 h-8">
            {HOUR_LABELS.map((min) => (
              <span key={min} className="absolute -translate-x-1/2 top-2 text-[10px] text-[#afafaf]" style={{ left: `${pctLeft(min)}%` }}>
                {fmt(min)}
              </span>
            ))}
          </div>
        </div>

        {/* Category groups */}
        {groups.map((g) => (
          <div key={g.category}>
            <div className="px-3 py-1.5 bg-[#fafafa] border-b border-black/5">
              <span className="text-[11px] font-semibold text-[#4b4b4b]">{g.category}</span>
            </div>
            {g.boats.map((b) => (
              <BoatRow key={b.id} boat={b} onLaneClick={(e) => openSlot(e, b)} onBlockClick={setDetail} />
            ))}
          </div>
        ))}

        {/* Now line */}
        <div className="absolute pointer-events-none z-10" style={{ left: nowLeft, top: 32, bottom: 0, width: 2, background: "#D85A30" }}>
          <span className="absolute -top-0.5 -left-3.5 text-[9px] font-semibold text-[#D85A30] bg-white px-1">now</span>
        </div>

        {/* Click-a-gap: this boat's open start times */}
        {slot && (
          <SlotPeek boat={slot.boat} top={slot.top} onClose={() => setSlot(null)} />
        )}
      </div>

      <p className="text-xs text-[#afafaf] mt-3">
        Click an open stretch of a boat&apos;s lane to see its open start times · click a booking to view it ·{" "}
        {reservations.length} bookings today
      </p>

      {detail && <ReservationDetail res={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function Count({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-[rgba(0,0,0,0.08)_0px_4px_16px] min-w-[130px]">
      <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1">{label}</p>
      <span className="text-2xl font-bold leading-none" style={{ color: color ?? "#000" }}>{value}</span>
    </div>
  );
}

function SlotColumn({ title, wins }: { title: string; wins: { start: number; end: number }[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-col gap-1">
        {wins.map((w) => (
          <span key={w.start} className="text-xs text-[#4b4b4b]">{fmtRange(w.start, w.end)}</span>
        ))}
      </div>
    </div>
  );
}

function BoatRow({
  boat,
  onLaneClick,
  onBlockClick,
}: {
  boat: Boat;
  onLaneClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onBlockClick: (r: Reservation) => void;
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
    <div className="flex items-stretch border-b border-black/5">
      {/* Label */}
      <div style={{ width: LABEL_W, opacity: inService ? 1 : 0.5 }} className="flex-shrink-0 px-3 py-2 border-r border-black/5 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-black">{boat.name}</span>
          {isTurnover && (
            <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 rounded-full">turn</span>
          )}
        </div>
        {boat.code && <span className="text-[10px] font-mono text-[#5C9A9E] font-semibold">{boat.code}</span>}
      </div>

      {/* Lane — click empty area to see open times */}
      <div
        className="relative flex-1 min-h-[46px]"
        style={{ backgroundImage: hourGrid, cursor: inService ? "pointer" : "default" }}
        onClick={inService ? onLaneClick : undefined}
      >
        {!inService ? (
          <div className="absolute inset-1.5 rounded-md flex items-center px-3 text-[12px]" style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
            {sc.label}
            {boat.maintenanceNote ? ` · ${boat.maintenanceNote.split(".")[0]}` : ""}
          </div>
        ) : (
          res.map((r) => (
            <div
              key={r.id}
              onClick={(e) => { e.stopPropagation(); onBlockClick(r); }}
              className="absolute top-[7px] bottom-[7px] rounded-md flex items-center px-2 text-[12px] overflow-hidden whitespace-nowrap cursor-pointer hover:brightness-95"
              style={{ left: `${pctLeft(r.start)}%`, width: `${pctWidth(r.duration)}%`, background: teal.bg, border: `1px solid ${teal.border}`, color: teal.text }}
              title={`${r.renter} · ${fmtRange(r.start, resEnd(r))}`}
            >
              <span className="truncate">{r.renter} · {fmtRange(r.start, resEnd(r))}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SlotPeek({ boat, top, onClose }: { boat: Boat; top: number; onClose: () => void }) {
  const { half, full } = boatOpenWindows(boat.id);
  return (
    <div
      className="absolute z-20 bg-white rounded-xl border border-black/10 shadow-[rgba(0,0,0,0.16)_0px_8px_28px] p-3.5"
      style={{ top, left: LABEL_W + 8, width: 380 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-black">
          Open start times · {boat.name}
        </span>
        <button onClick={onClose} className="text-[#afafaf] hover:text-black text-sm leading-none">×</button>
      </div>
      <p className="text-[10px] text-[#afafaf] mb-2">Tap a time to start the booking (booking screen coming next).</p>
      <PeekRow label="Half day · 4h" wins={half} />
      <div className="mt-2">
        <PeekRow label="Full day · 7h" wins={full} />
      </div>
    </div>
  );
}

function PeekRow({ label, wins }: { label: string; wins: { start: number; end: number }[] }) {
  return (
    <div>
      <p className="text-[10px] text-[#afafaf] mb-1">{label}</p>
      {wins.length === 0 ? (
        <p className="text-[11px] text-[#afafaf] italic">None open</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {wins.map((w) => (
            <span key={w.start} className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer whitespace-nowrap hover:brightness-95" style={{ background: teal.bg, border: `1px solid ${teal.border}`, color: teal.text }}>
              {fmtRange(w.start, w.end)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationDetail({ res, onClose }: { res: Reservation; onClose: () => void }) {
  const boat = boatById(res.boatId);
  const status =
    res.start > NOW_MIN ? "Reserved · upcoming" : resEnd(res) > NOW_MIN ? "On the water" : "Returned";
  const dur = res.duration >= 420 ? "Full day (7h)" : "Half day (4h)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={onClose}>
      <div className="h-full w-[420px] bg-white shadow-2xl overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#081731] p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#5C9A9E] text-xs font-mono font-bold uppercase tracking-widest mb-1">{res.id}</p>
              <h2 className="text-2xl font-bold leading-tight">{res.renter}</h2>
              <p className="text-white/50 text-xs mt-1">{res.category}</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none mt-1">×</button>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mt-3 bg-white/10">
            {status}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          <DRow label="Date" value={DEMO_DATE} />
          <DRow label="Time" value={fmtRange(res.start, resEnd(res))} />
          <DRow label="Length" value={dur} />
          <DRow label="Boat assigned" value={boat ? `${boat.name}${boat.code ? ` (${boat.code})` : ""}` : "—"} />
          <DRow label="Category" value={res.category} />
          <DRow label="Captain" value={res.renter} />

          <div className="bg-[#f0f7fb] border border-[#d0e8f5] rounded-xl p-3 mt-2">
            <p className="text-[11px] text-[#2A5B7D] leading-relaxed">
              View only for now. The full booking record — payment, deposit, waiver, accessories, damage photos, and actions like reassigning or flagging damage — comes once we design how a reservation weaves into booking and maintenance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-black/5 pb-2.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#081731] text-right">{value}</span>
    </div>
  );
}
