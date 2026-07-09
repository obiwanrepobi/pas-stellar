"use client";

import { useState } from "react";
import { statusConfig, boats as fleetBoats, type Boat, type BoatStatus } from "../fleet/data";
import {
  Reservation,
  reservationsForBoat,
  rentalFleetByCategory,
  boatOpenWindows,
  typicalWindows,
  liveCounts,
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
  DEMO_DATE_SHORT,
  HALF_MIN,
  FULL_MIN,
  RENTAL_CATEGORIES,
  RATES,
  DEPOSIT,
  DAMAGE_WAIVER,
  CANCELLATION_INS,
  openWindows,
  freeHulls,
  accessoriesForBoat,
  quote,
  addReservation,
  stageConfig,
  stageOf,
} from "./data";

const LABEL_W = 168;
const PEEK_W = 380;
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => (8 + i) * 60);
const groups = rentalFleetByCategory();
const teal = { bg: "#e1f5ee", border: "#5DCAA5", text: "#0F6E56" };
const GRAY = { bg: "#f1f3f5", border: "#dde1e6", text: "#697586" };
const NAVY = "#081731";
const boatById = (id: string) => fleetBoats.find((b) => b.id === id);
const money = (n: number) =>
  "$" + (Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const digits = (s: string) => s.replace(/\D/g, "");
const formatPhone = (v: string) => {
  const d = digits(v).slice(0, 10);
  if (d.length !== 10) return v;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};
const emailOk = (s: string) => /.+@.+\..+/.test(s.trim());
const formatCard = (v: string) => digits(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatExp = (v: string) => { const d = digits(v).slice(0, 4); return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

type Prefill = { category?: string; duration?: number; start?: number; boatId?: string };
type Slot = { boat: Boat; top: number; left: number };

const EMPLOYEES = ["Tyler", "Nate", "Kenny", "Parker", "Zach", "Sam", "Dave", "Sue"];
type Note = { id: number; text: string; who: string; done: boolean };
const SEED_NOTES: Note[] = [
  { id: 1, text: "Power-wash Curacao and Belize before the afternoon rush", who: "Kenny", done: false },
  { id: 2, text: "Replace anchor line on Curacao", who: "Sam", done: false },
  { id: 3, text: "Restock and refill life jackets", who: "Tyler", done: false },
  { id: 4, text: "Full clean on the boats back from yesterday", who: "Kenny", done: false },
];

type HandledItem = { id: number; text: string; done: boolean };
type Incident = { id: number; boat: string; title: string; date: string; summary: string; handled: HandledItem[]; next: string };
const SEED_INCIDENTS: Incident[] = [
  {
    id: 1,
    boat: "Belize · PP5",
    title: "prop damage",
    date: "Fri, Jul 17",
    summary: "Damaged on Friday's afternoon rental. Dave had it pulled that night — service is aware.",
    handled: [
      { id: 1, text: "Rentals Jul 18–20 moved to other boats", done: true },
      { id: 2, text: "Blocked on the calendar through the week", done: true },
      { id: 3, text: "Before/after photos taken — see booking notes", done: true },
    ],
    next: "Get repair estimate from Sue → call the customer",
  },
];

export default function ReservationsPage() {
  const [cardOpen, setCardOpen] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [booking, setBooking] = useState<Prefill | null>(null);
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);
  const [, setTick] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [noteText, setNoteText] = useState("");
  const [noteWho, setNoteWho] = useState(EMPLOYEES[0]);
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, number>>({});

  const addNote = () => {
    const t = noteText.trim();
    if (!t) return;
    setNotes((ns) => [...ns, { id: Date.now(), text: t, who: noteWho, done: false }]);
    setNoteText("");
  };
  const toggleNote = (id: number) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  const deleteNote = (id: number) => setNotes((ns) => ns.filter((n) => n.id !== id));
  const cycleDispatch = (id: string) => setDispatchStatus((s) => ({ ...s, [id]: ((s[id] || 0) + 1) % 3 }));

  // Recomputed each render off the live (mutable) reservations array.
  const live = liveCounts();
  const turnovers = turnoverBoatIds();

  const nowLeft = `calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${pctLeft(NOW_MIN) / 100})`;

  return (
    <div className="px-8 py-6 max-w-[1800px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-[#afafaf] uppercase tracking-widest mb-1">Pocono Action Sports</p>
          <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">Reservations</h1>
          <p className="text-sm text-[#4b4b4b] mt-1">{DEMO_DATE} · 1:30p</p>
        </div>
        <button
          onClick={() => setBooking({})}
          className="bg-black text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
        >
          + New booking
        </button>
      </div>

      {/* Top bar: day summary (left) + typical-slots toggle (right) — one full-width bar */}
      <div className="mb-5 bg-white rounded-xl px-5 py-4 shadow-[rgba(0,0,0,0.08)_0px_4px_16px]">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[13px] text-[#6b6b6b] mb-3">
              <span className="font-semibold text-black tabular-nums">{live.reservationsToday}</span> reservations today
              <span className="text-[#d4d4d4] mx-2">·</span>
              <span className="font-semibold text-black tabular-nums">{live.turnovers}</span> turnovers
            </p>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[44px] font-bold leading-none tabular-nums" style={{ color: stageConfig["on-water"].text }}>{live.onWater}</span>
                <span className="text-[13px] text-[#6b6b6b] mt-1.5">on the water</span>
              </div>
              <div className="self-stretch w-px bg-black/10" />
              <div className="flex flex-col gap-2.5">
                <span className="text-[14px] text-[#1a1a1a] flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ background: "#94a3b8" }} />
                  <span className="font-semibold tabular-nums mr-1">{live.toGoOut}</span> to go out
                </span>
                <span className="text-[14px] text-[#1a1a1a] flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ background: stageConfig.returned.dot }} />
                  <span className="font-semibold tabular-nums mr-1">{live.toFinalize}</span> to finalize
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setCardOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-black hover:text-[#0F6E56] transition-colors self-start"
          >
            <svg className={`w-3.5 h-3.5 text-[#5C9A9E] transition-transform ${cardOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Typical time slots
            <span className="text-[11px] font-normal text-[#afafaf]">reference</span>
          </button>
        </div>
        {cardOpen && (
          <div className="mt-4 pt-4 border-t border-black/5">
            <TypicalSlots />
          </div>
        )}
      </div>

      {/* Notes | Dispatch strip (above the grid) */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <NotesPanel incidents={incidents} setIncidents={setIncidents} notes={notes} onToggle={toggleNote} onDelete={deleteNote} onAdd={addNote} text={noteText} setText={setNoteText} who={noteWho} setWho={setNoteWho} />
        <DispatchPanel status={dispatchStatus} onCycle={cycleDispatch} />
      </div>

      {/* Board */}
      <Board
        turnovers={turnovers}
        onOpenSlot={setSlot}
        onBlockClick={setDetail}
        nowLeft={nowLeft}
        slot={slot}
        onCloseSlot={() => setSlot(null)}
        onPickWindow={(boat, start, duration) => { setSlot(null); setBooking({ category: boat.category, boatId: boat.id, start, duration }); }}
      />

      {/* Stage legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        {(Object.keys(stageConfig) as (keyof typeof stageConfig)[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-[#6b6b6b]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: stageConfig[k].dot }} />
            {stageConfig[k].label}
          </span>
        ))}
        <span className="text-[11px] text-[#afafaf] ml-auto">Click an open lane for start times · click a booking to view it · {reservations.length} bookings today</span>
      </div>

      {detail && <ReservationDetail res={detail} onClose={() => setDetail(null)} />}
      {booking && (
        <BookingScreen prefill={booking} onClose={() => setBooking(null)} onBook={(res) => { setTick((t) => t + 1); setBooking(null); setConfirmed(res); }} />
      )}
      {confirmed && <Confirmation res={confirmed} onDone={() => setConfirmed(null)} />}
    </div>
  );
}

// Compact typical-slots card: 3 labeled sections, each a wrapped grid of pills
// so it fills the width instead of leaving a big blank right side.
function TypicalSlots() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-[rgba(0,0,0,0.08)_0px_4px_16px] grid grid-cols-[1fr_1fr_1fr] gap-x-6 gap-y-1">
      <SlotSection title="Full day · 7h" wins={typicalWindows.full} />
      <SlotSection title="Half day · morning" wins={typicalWindows.halfMorning} />
      <SlotSection title="Half day · afternoon" wins={typicalWindows.halfAfternoon} />
    </div>
  );
}
function SlotSection({ title, wins }: { title: string; wins: { start: number; end: number }[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-wrap gap-1">
        {wins.map((w) => (
          <span key={w.start} className="text-[11px] font-medium text-[#3f4b5b] bg-[#f4f6f8] rounded-md px-2 py-1 whitespace-nowrap tabular-nums">
            {fmtRange(w.start, w.end)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Board({
  turnovers,
  onOpenSlot,
  onBlockClick,
  nowLeft,
  slot,
  onCloseSlot,
  onPickWindow,
}: {
  turnovers: Set<string>;
  onOpenSlot: (s: Slot) => void;
  onBlockClick: (r: Reservation) => void;
  nowLeft: string;
  slot: Slot | null;
  onCloseSlot: () => void;
  onPickWindow: (boat: Boat, start: number, duration: number) => void;
}) {
  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);

  function laneClick(e: React.MouseEvent<HTMLDivElement>, boat: Boat) {
    if (boat.status !== "in-service" || !boardEl) return;
    const boardRect = boardEl.getBoundingClientRect();
    const rowRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const rawLeft = e.clientX - boardRect.left;
    const maxLeft = Math.max(LABEL_W + 8, boardRect.width - PEEK_W - 8);
    const left = Math.min(Math.max(rawLeft - 30, LABEL_W + 8), maxLeft);
    onOpenSlot({ boat, top: rowRect.bottom - boardRect.top, left });
  }

  return (
    <div ref={setBoardEl} className="relative bg-white rounded-xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden">
      {/* Time axis */}
      <div className="flex bg-[#fafafa] border-b border-black/5">
        <div style={{ width: LABEL_W }} className="flex-shrink-0 px-3 py-2">
          <span className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest">Boat</span>
        </div>
        <div className="relative flex-1 h-8">
          {HOUR_LABELS.map((min) => (
            <span key={min} className="absolute -translate-x-1/2 top-2 text-[10px] text-[#afafaf] tabular-nums" style={{ left: `${pctLeft(min)}%` }}>
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
            <BoatRow key={b.id} boat={b} isTurnover={turnovers.has(b.id)} onLaneClick={(e) => laneClick(e, b)} onBlockClick={onBlockClick} />
          ))}
        </div>
      ))}

      {/* Now line */}
      <div className="absolute pointer-events-none z-10" style={{ left: nowLeft, top: 32, bottom: 0, width: 2, background: "#D85A30" }}>
        <span className="absolute -top-0.5 -left-3.5 text-[9px] font-semibold text-[#D85A30] bg-white px-1">now</span>
      </div>

      {slot && <SlotPeek boat={slot.boat} top={slot.top} left={slot.left} onClose={onCloseSlot} onPick={onPickWindow} />}
    </div>
  );
}

function BoatRow({
  boat,
  isTurnover,
  onLaneClick,
  onBlockClick,
}: {
  boat: Boat;
  isTurnover: boolean;
  onLaneClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onBlockClick: (r: Reservation) => void;
}) {
  const res = reservationsForBoat(boat.id);
  const inService = boat.status === "in-service";
  const sc = statusConfig[boat.status as BoatStatus];

  const g = (60 / (DAY_END - DAY_START)) * 100;
  const hourGrid =
    `repeating-linear-gradient(to right, transparent 0, transparent calc(${g}% - 1px), rgba(0,0,0,0.05) calc(${g}% - 1px), rgba(0,0,0,0.05) ${g}%)`;

  return (
    <div className="flex items-stretch border-b border-black/5">
      <div style={{ width: LABEL_W, opacity: inService ? 1 : 0.5 }} className="flex-shrink-0 px-3 py-2 border-r border-black/5 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-black leading-tight truncate">{boat.name}</span>
          {isTurnover && <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 rounded-full flex-shrink-0">turn</span>}
        </div>
        {boat.code && <span className="text-[10px] font-mono text-[#5C9A9E] font-semibold">{boat.code}</span>}
      </div>

      <div
        className="relative flex-1 min-h-[46px]"
        style={{ backgroundImage: hourGrid, cursor: inService ? "pointer" : "default" }}
        onClick={inService ? onLaneClick : undefined}
      >
        {!inService ? (
          <div className="absolute inset-1.5 rounded-md flex items-center px-3 text-[12px]" style={{ background: GRAY.bg, border: `1px solid ${GRAY.border}`, color: GRAY.text }}>
            {sc.label}
            {boat.maintenanceNote ? ` · ${boat.maintenanceNote.split(".")[0]}` : ""}
          </div>
        ) : (
          res.map((r) => {
            const st = stageConfig[stageOf(r)];
            return (
              <div
                key={r.id}
                onClick={(e) => { e.stopPropagation(); onBlockClick(r); }}
                className="absolute top-[7px] bottom-[7px] rounded-md flex items-center px-2 text-[12px] overflow-hidden whitespace-nowrap cursor-pointer hover:brightness-95"
                style={{ left: `${pctLeft(r.start)}%`, width: `${pctWidth(r.duration)}%`, background: st.bg, border: `1px solid ${st.border}`, color: st.text }}
                title={`${r.renter} · ${fmtRange(r.start, resEnd(r))} · ${st.label}`}
              >
                <span className="truncate tabular-nums">{r.renter} · {fmtRange(r.start, resEnd(r))}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SlotPeek({ boat, top, left, onClose, onPick }: { boat: Boat; top: number; left: number; onClose: () => void; onPick: (boat: Boat, start: number, duration: number) => void }) {
  const { half, full } = boatOpenWindows(boat.id);
  const amWins = half.filter((w) => w.start < 12 * 60);
  const pmWins = half.filter((w) => w.start >= 12 * 60);
  return (
    <div className="absolute z-20 bg-white rounded-xl border border-black/10 shadow-[rgba(0,0,0,0.16)_0px_8px_28px] p-3.5" style={{ top, left, width: PEEK_W }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-black">Open start times · {boat.name}</span>
        <button onClick={onClose} className="text-[#afafaf] hover:text-black text-sm leading-none">×</button>
      </div>
      <p className="text-[10px] text-[#afafaf] mb-2">Tap a time to start the booking.</p>

      <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1.5">Half day · 4h</p>
      <PeekGroup sublabel="Morning" wins={amWins} onPick={(s) => onPick(boat, s, HALF_MIN)} />
      <div className="mt-1.5" />
      <PeekGroup sublabel="Afternoon" wins={pmWins} onPick={(s) => onPick(boat, s, HALF_MIN)} />

      <div className="border-t border-black/8 my-2.5" />
      <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-1.5">Full day · 7h</p>
      <Chips wins={full} onPick={(s) => onPick(boat, s, FULL_MIN)} />
    </div>
  );
}
function PeekGroup({ sublabel, wins, onPick }: { sublabel: string; wins: { start: number; end: number }[]; onPick: (start: number) => void }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-[#afafaf] w-14 flex-shrink-0 pt-1.5">{sublabel}</span>
      <div className="flex-1"><Chips wins={wins} onPick={onPick} /></div>
    </div>
  );
}
function Chips({ wins, onPick }: { wins: { start: number; end: number }[]; onPick: (start: number) => void }) {
  if (wins.length === 0) return <p className="text-[11px] text-[#afafaf] italic pt-1">None open</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {wins.map((w) => (
        <button key={w.start} onClick={() => onPick(w.start)} className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer whitespace-nowrap hover:brightness-95 tabular-nums" style={{ background: teal.bg, border: `1px solid ${teal.border}`, color: teal.text }}>
          {fmtRange(w.start, w.end)}
        </button>
      ))}
    </div>
  );
}

// ─── Booking screen (Module 1) ────────────────────────────────────────────────
function BookingScreen({ prefill, onClose, onBook }: { prefill: Prefill; onClose: () => void; onBook: (res: Reservation) => void }) {
  const [category, setCategory] = useState(prefill.category ?? "Premium Pontoon");
  const [duration, setDuration] = useState<number>(prefill.duration ?? FULL_MIN);
  const [start, setStart] = useState<number | null>(prefill.start ?? null);
  const [boatOverride, setBoatOverride] = useState<string | null>(prefill.boatId ?? null);
  // Who
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [driver, setDriver] = useState<"same" | "separate" | "tbd">("same");
  const [capFirst, setCapFirst] = useState("");
  const [capLast, setCapLast] = useState("");
  const [capPhone, setCapPhone] = useState("");
  const [capEmail, setCapEmail] = useState("");
  const [eligibility, setEligibility] = useState<"license" | "senior" | null>(null);
  // Add-ons
  const [accessoryKeys, setAccessoryKeys] = useState<string[]>([]);
  const [damageWaiver, setDamageWaiver] = useState(false);
  const [cancellationInsurance, setCancellationInsurance] = useState(false);
  // Pay
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [billingSame, setBillingSame] = useState(true);
  const [billStreet, setBillStreet] = useState("");
  const [billCity, setBillCity] = useState("");
  const [billStateAbbr, setBillStateAbbr] = useState("");
  const [billZip, setBillZip] = useState("");

  // Derived
  const windows = openWindows(category, duration);
  const effStart = start != null && windows.some((w) => w.start === start) ? start : windows[0]?.start ?? null;
  const hulls = effStart != null ? freeHulls(category, effStart, duration) : [];
  const assignedBoat: Boat | null = (boatOverride && hulls.find((h) => h.id === boatOverride)) || hulls[0] || null;
  const accessories = accessoriesForBoat(assignedBoat);
  const validKeys = accessoryKeys.filter((k) => accessories.some((a) => a.key === k));
  const q = quote({ category, duration, boat: assignedBoat, accessoryKeys: validKeys, damageWaiver, cancellationInsurance });
  const cap = assignedBoat?.capacity ?? 0;
  const overCap = partySize > cap;
  const rate = RATES[category];

  const missing: string[] = [];
  if (effStart == null || !assignedBoat) missing.push("an open time slot");
  if (!firstName.trim() || !lastName.trim()) missing.push("reservation name");
  if (!phone.trim()) missing.push("phone");
  if (!emailOk(email)) missing.push("email");
  if (partySize < 1) missing.push("party size");
  if (overCap) missing.push("party over capacity");
  if (!eligibility) missing.push("driver eligibility");
  if (driver === "separate" && (!capFirst.trim() || !capLast.trim() || !capPhone.trim() || !emailOk(capEmail))) missing.push("captain details");
  if (!cardName.trim() || digits(cardNumber).length < 15 || !cardExp.trim() || digits(cardCvv).length < 3) missing.push("card details");
  const canBook = missing.length === 0;

  const toggleAccessory = (key: string) => setAccessoryKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  function book() {
    if (!canBook || !assignedBoat || effStart == null) return;
    const renter = `${firstName.trim()} ${lastName.trim()}`.trim();
    const captainLabel = driver === "tbd" ? "TBD" : driver === "separate" ? `${capFirst.trim()} ${capLast.trim()}`.trim() : renter;
    const composedAddress = [street.trim(), [city.trim(), stateAbbr.trim(), zip.trim()].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const created = addReservation({
      boatId: assignedBoat.id, category, start: effStart, duration, renter, stage: "reserved",
      partySize, booker: renter, phone: phone.trim(), email: email.trim(), address: composedAddress,
      captain: captainLabel, accessories: validKeys, damageWaiver, cancellationInsurance,
      total: q.total, cardName: cardName.trim(), cardLast4: digits(cardNumber).slice(-4),
    });
    onBook(created);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-6 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[900px] shadow-2xl overflow-hidden my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header with live tax-inclusive total */}
        <div className="flex items-center justify-between px-6 py-4 text-white sticky top-0 z-10" style={{ background: NAVY }}>
          <div>
            <p className="text-[#5C9A9E] text-[11px] font-semibold uppercase tracking-widest">New booking</p>
            <p className="text-lg font-bold leading-tight">{DEMO_DATE_SHORT}, 2026 <span className="text-white/40 font-normal text-sm">· today</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold leading-none tabular-nums">{money(q.total)}</p>
              <p className="text-white/50 text-[11px] mt-0.5">incl. {money(q.tax)} tax · {money(DEPOSIT)} deposit at arrival</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Zone 1 — What & when */}
          <Zone label="What & when">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select value={category} onChange={(e) => { setCategory(e.target.value); setBoatOverride(null); setStart(null); }} className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white">
                  {RENTAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Duration">
                <div className="flex gap-2">
                  <DurBtn active={duration === FULL_MIN} onClick={() => { setDuration(FULL_MIN); setStart(null); }} title="Full day · 7h" price={rate ? money(rate.full) : "—"} />
                  <DurBtn active={duration === HALF_MIN} onClick={() => { setDuration(HALF_MIN); setStart(null); }} title="Half day · 4h" price={rate ? money(rate.half) : "—"} />
                </div>
              </Field>
              <Field label="Start window">
                {windows.length === 0 ? (
                  <div className="text-sm text-[#b23b3b] bg-[#fdecec] border border-[#f5c6c6] rounded-lg px-3 py-2">No open windows for this category · duration today.</div>
                ) : (
                  <select value={effStart ?? ""} onChange={(e) => { setStart(Number(e.target.value)); setBoatOverride(null); }} className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-white tabular-nums">
                    {windows.map((w) => <option key={w.start} value={w.start}>{fmtRange(w.start, w.end)}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Boat assigned">
                {assignedBoat ? (
                  <div className="flex items-center gap-2">
                    <select value={assignedBoat.id} onChange={(e) => setBoatOverride(e.target.value)} className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm bg-white">
                      {hulls.map((h) => <option key={h.id} value={h.id}>{h.name}{h.code ? ` (${h.code})` : ""}</option>)}
                    </select>
                    <span className="text-[11px] text-[#afafaf] whitespace-nowrap">auto-slotted</span>
                  </div>
                ) : (
                  <div className="text-sm text-[#b23b3b] bg-[#fdecec] border border-[#f5c6c6] rounded-lg px-3 py-2">No boat open for this window.</div>
                )}
              </Field>
            </div>
          </Zone>

          {/* Zone 2 — Who */}
          <Zone label="Who">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Reservation name — first">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Last">
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhone((p) => formatPhone(p))} placeholder="(570) 493-9096" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" />
              </Field>
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Party size">
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={partySize} onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))} className="w-20 border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" />
                  <span className={`text-sm font-medium ${overCap ? "text-[#b23b3b]" : "text-[#0F6E56]"}`}>{overCap ? `over capacity (max ${cap})` : assignedBoat ? `of ${cap} ✓` : ""}</span>
                </div>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Address (optional)">
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street address" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" />
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div className="col-span-2">
                <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" /></Field>
              </div>
              <Field label="State"><input value={stateAbbr} onChange={(e) => setStateAbbr(e.target.value.toUpperCase().slice(0, 2))} placeholder="PA" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm uppercase" /></Field>
              <Field label="ZIP"><input value={zip} onChange={(e) => setZip(digits(e.target.value).slice(0, 5))} placeholder="18428" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" /></Field>
            </div>

            {/* Who's driving sub-flow */}
            <div className="mt-4 pt-4 border-t border-black/8">
              <p className="text-[12px] font-medium text-[#4b4b4b] mb-1.5">Who&apos;s driving?</p>
              <div className="flex gap-2 flex-wrap">
                <PillBtn active={driver === "same"} onClick={() => setDriver("same")}>Same as reservation name</PillBtn>
                <PillBtn active={driver === "separate"} onClick={() => setDriver("separate")}>Separate captain</PillBtn>
                <PillBtn active={driver === "tbd"} onClick={() => setDriver("tbd")}>TBD</PillBtn>
              </div>
              {driver === "separate" && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Field label="Captain — first"><input value={capFirst} onChange={(e) => setCapFirst(e.target.value)} placeholder="First" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" /></Field>
                  <Field label="Last"><input value={capLast} onChange={(e) => setCapLast(e.target.value)} placeholder="Last" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" /></Field>
                  <Field label="Captain phone"><input value={capPhone} onChange={(e) => setCapPhone(e.target.value)} onBlur={() => setCapPhone((p) => formatPhone(p))} placeholder="(570) …" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" /></Field>
                  <Field label="Captain email (for the waiver)"><input value={capEmail} onChange={(e) => setCapEmail(e.target.value)} placeholder="name@email.com" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" /></Field>
                </div>
              )}
              <div className="mt-3">
                <Field label={driver === "tbd" ? "Driver eligible? (confirm whoever drives qualifies — PA law)" : "Driver eligible (PA law)"}>
                  <div className="flex gap-2">
                    <PillBtn active={eligibility === "license"} onClick={() => setEligibility("license")}>Boater&apos;s license</PillBtn>
                    <PillBtn active={eligibility === "senior"} onClick={() => setEligibility("senior")}>Born before 1982</PillBtn>
                  </div>
                </Field>
              </div>
            </div>
          </Zone>

          {/* Zone 3 — Add-ons */}
          <Zone label="Add-ons">
            <Field label={assignedBoat ? `Accessories (what ${assignedBoat.name} can pull)` : "Accessories"}>
              {accessories.length === 0 ? (
                <p className="text-[13px] text-[#afafaf]">No accessories available on this boat.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accessories.map((a) => (
                    <PillBtn key={a.key} active={validKeys.includes(a.key)} onClick={() => toggleAccessory(a.key)}>
                      {a.label} <span className="opacity-60">+{money(a.price)}</span>
                    </PillBtn>
                  ))}
                </div>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <ToggleCard active={damageWaiver} onClick={() => setDamageWaiver((v) => !v)} title={`Damage waiver +${money(DAMAGE_WAIVER)}`} desc="Covers head-on collisions only." />
              <ToggleCard active={cancellationInsurance} onClick={() => setCancellationInsurance((v) => !v)} title={`Cancellation insurance +${money(CANCELLATION_INS)}`} desc={cancellationInsurance ? "Cancel up to 2 days before (9am) for a full refund." : "Declined — standard cancellation policy applies."} />
            </div>
          </Zone>

          {/* Zone 4 — Pay */}
          <Zone label="Pay">
            <div className="bg-[#fafafa] rounded-xl p-4 text-sm">
              <Line label={`${category} · ${duration === FULL_MIN ? "Full day (7h)" : "Half day (4h)"}`} value={money(q.base)} />
              {validKeys.map((k) => { const a = accessories.find((x) => x.key === k)!; return <Line key={k} label={a.label} value={money(a.price)} muted />; })}
              {damageWaiver && <Line label="Damage waiver" value={money(DAMAGE_WAIVER)} muted />}
              {cancellationInsurance && <Line label="Cancellation insurance" value={money(CANCELLATION_INS)} muted />}
              <div className="border-t border-black/10 my-2" />
              <Line label="Subtotal" value={money(q.subtotal)} muted />
              <Line label="Tax (6%)" value={money(q.tax)} muted />
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-[#081731]">Total (tax incl.)</span>
                <span className="font-bold text-[#081731] text-lg tabular-nums">{money(q.total)}</span>
              </div>
              <p className="text-[11px] text-[#afafaf] mt-2">{money(DEPOSIT)} refundable security deposit collected at arrival — not now.</p>
            </div>

            {/* Card entry (represented — fake data only) */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Name on card"><input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Cardholder name" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" /></Field>
              <Field label="Card number">
                <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} inputMode="numeric" placeholder="4242 4242 4242 4242" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums tracking-wider" />
                <p className="text-[10px] text-[#afafaf] mt-1 tabular-nums">{digits(cardNumber).length}/16 digits</p>
              </Field>
              <Field label="Expiry (MM/YY)"><input value={cardExp} onChange={(e) => setCardExp(formatExp(e.target.value))} inputMode="numeric" placeholder="08/28" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" /></Field>
              <Field label="CVV"><input value={cardCvv} onChange={(e) => setCardCvv(digits(e.target.value).slice(0, 4))} inputMode="numeric" placeholder="123" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" /></Field>
            </div>
            <label className="flex items-center gap-2 mt-3 text-[13px] text-[#4b4b4b] cursor-pointer">
              <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="accent-[#0F6E56]" />
              Billing address same as booking address
            </label>
            {billingSame ? (
              <p className="text-[11px] text-[#afafaf] mt-2">Using the booking address above.</p>
            ) : (
              <div className="mt-3">
                <Field label="Billing address">
                  <input value={billStreet} onChange={(e) => setBillStreet(e.target.value)} placeholder="Street address" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" />
                </Field>
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div className="col-span-2"><Field label="City"><input value={billCity} onChange={(e) => setBillCity(e.target.value)} placeholder="City" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm" /></Field></div>
                  <Field label="State"><input value={billStateAbbr} onChange={(e) => setBillStateAbbr(e.target.value.toUpperCase().slice(0, 2))} placeholder="PA" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm uppercase" /></Field>
                  <Field label="ZIP"><input value={billZip} onChange={(e) => setBillZip(digits(e.target.value).slice(0, 5))} placeholder="18428" className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm tabular-nums" /></Field>
                </div>
              </div>
            )}
          </Zone>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[12px] text-[#afafaf]">{canBook ? "Charge card to confirm." : `Still needed: ${missing.join(", ")}.`}</p>
            <button onClick={book} disabled={!canBook} className="text-sm font-semibold px-6 py-2.5 rounded-full text-white transition-colors tabular-nums" style={{ background: canBook ? NAVY : "#c9ccd2", cursor: canBook ? "pointer" : "not-allowed" }}>
              Book it · {money(q.total)} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Zone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-black/8 rounded-xl p-4">
      <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#4b4b4b] mb-1.5">{label}</p>
      {children}
    </div>
  );
}
function DurBtn({ active, onClick, title, price }: { active: boolean; onClick: () => void; title: string; price: string }) {
  return (
    <button onClick={onClick} className="flex-1 rounded-lg border px-3 py-2 text-left transition-colors" style={{ background: active ? teal.bg : "#fff", borderColor: active ? teal.border : "rgba(0,0,0,0.15)" }}>
      <span className="block text-[12px] font-semibold" style={{ color: active ? teal.text : "#000" }}>{title}</span>
      <span className="block text-[12px] tabular-nums" style={{ color: active ? teal.text : "#afafaf" }}>{price}</span>
    </button>
  );
}
function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors" style={{ background: active ? teal.bg : "#fff", borderColor: active ? teal.border : "rgba(0,0,0,0.15)", color: active ? teal.text : "#4b4b4b" }}>
      {children}
    </button>
  );
}
function ToggleCard({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className="text-left rounded-lg border px-3 py-2.5 transition-colors" style={{ background: active ? teal.bg : "#fff", borderColor: active ? teal.border : "rgba(0,0,0,0.15)" }}>
      <span className="block text-[13px] font-semibold" style={{ color: active ? teal.text : "#000" }}>{title}</span>
      <span className="block text-[11px] mt-0.5" style={{ color: active ? teal.text : "#afafaf" }}>{desc}</span>
    </button>
  );
}
function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={muted ? "text-[#6b6b6b]" : "text-black font-medium"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-[#6b6b6b]" : "text-black font-medium"}`}>{value}</span>
    </div>
  );
}

function Confirmation({ res, onDone }: { res: Reservation; onDone: () => void }) {
  const boat = boatById(res.boatId);
  const accLabels = (res.accessories ?? []).map((k) => accessoriesForBoat(boat).find((a) => a.key === k)?.label ?? k);
  const [checks, setChecks] = useState<Record<string, boolean>>({ arrive: false, waiver: false, deposit: false });
  const toggle = (k: string) => setChecks((c) => ({ ...c, [k]: !c[k] }));
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4 py-6 overflow-y-auto" onClick={onDone}>
      <div className="bg-white rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 text-white" style={{ background: NAVY }}>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: teal.border }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#5C9A9E]">{res.id}</p>
              <h2 className="text-xl font-bold leading-tight">Booking confirmed</h2>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-2.5 text-sm">
          <Line label="Name" value={res.renter} muted />
          <Line label="Date" value={DEMO_DATE} muted />
          <Line label="Boat" value={boat ? `${boat.name}${boat.code ? ` (${boat.code})` : ""}` : "—"} muted />
          <Line label="Time" value={fmtRange(res.start, resEnd(res))} muted />
          <Line label="Party" value={`${res.partySize} of ${boat?.capacity ?? "—"}`} muted />
          <Line label="Accessories" value={accLabels.length ? accLabels.join(", ") : "None"} muted />
          <Line label="Charged" value={`${money(res.total ?? 0)}${res.cardLast4 ? ` · Card •••• ${res.cardLast4}` : ""}`} />

          {/* Say-and-confirm checklist (tick as you talk; does NOT block Done) */}
          <div className="bg-[#f0f7fb] border border-[#d0e8f5] rounded-xl p-3 mt-2 space-y-2">
            <p className="text-[11px] font-semibold text-[#2A5B7D] uppercase tracking-widest">Tell them on the phone</p>
            <CheckLine on={checks.arrive} onClick={() => toggle("arrive")} label="Arrive 45 minutes early" />
            <CheckLine on={checks.waiver} onClick={() => toggle("waiver")} label="Sign the waiver ahead (or in person)" />
            <CheckLine on={checks.deposit} onClick={() => toggle("deposit")} label={`${money(DEPOSIT)} security deposit at arrival`} />
          </div>

          <button onClick={onDone} className="w-full mt-2 text-sm font-semibold px-6 py-2.5 rounded-full text-white" style={{ background: NAVY }}>Done</button>
        </div>
      </div>
    </div>
  );
}
function CheckLine({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-left w-full">
      <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border" style={{ background: on ? teal.border : "#fff", borderColor: on ? teal.border : "#cbd5e1" }}>
        {on && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </span>
      <span className={`text-[12px] ${on ? "text-[#2A5B7D] line-through opacity-70" : "text-[#2A5B7D]"}`}>{label}</span>
    </button>
  );
}

const edCls = "bg-transparent rounded px-1 -mx-1 outline-none hover:bg-black/[0.03] focus:bg-white/70 focus:ring-1 focus:ring-[#e0b84a]";

function HeadsUp({ incidents, setIncidents }: { incidents: Incident[]; setIncidents: React.Dispatch<React.SetStateAction<Incident[]>> }) {
  const upd = (id: number, p: Partial<Incident>) => setIncidents((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const updH = (id: number, itemId: number, p: Partial<HandledItem>) => setIncidents((xs) => xs.map((x) => (x.id === id ? { ...x, handled: x.handled.map((h) => (h.id === itemId ? { ...h, ...p } : h)) } : x)));
  const addH = (id: number) => setIncidents((xs) => xs.map((x) => (x.id === id ? { ...x, handled: [...x.handled, { id: Date.now(), text: "", done: true }] } : x)));
  const removeH = (id: number, itemId: number) => setIncidents((xs) => xs.map((x) => (x.id === id ? { ...x, handled: x.handled.filter((h) => h.id !== itemId) } : x)));
  const dismiss = (id: number) => setIncidents((xs) => xs.filter((x) => x.id !== id));
  const add = () => setIncidents((xs) => [...xs, { id: Date.now(), boat: "", title: "", date: "", summary: "", handled: [], next: "" }]);

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-[#afafaf]">Heads up · from last night</p>
        <button onClick={add} className="text-[11px] font-medium text-[#5C9A9E] hover:text-[#0F6E56]">+ Add</button>
      </div>
      {incidents.length === 0 ? (
        <p className="text-[12px] text-[#c9ccd2] italic pb-1">Nothing flagged.</p>
      ) : (
        incidents.map((inc) => (
          <div key={inc.id} className="rounded-[10px] p-3 mb-2" style={{ background: "#fef3c7", border: "1px solid #fcd34d" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A1 1 0 002.67 20h18.66a1 1 0 00.86-1.44l-8.48-14.7a1 1 0 00-1.72 0z" /></svg>
              <input value={inc.boat} onChange={(e) => upd(inc.id, { boat: e.target.value })} placeholder="Boat" className={`text-[13px] font-semibold text-[#78350f] w-32 ${edCls}`} />
              <input value={inc.title} onChange={(e) => upd(inc.id, { title: e.target.value })} placeholder="what happened" className={`text-[12px] text-[#92600f] flex-1 min-w-0 ${edCls}`} />
              <input value={inc.date} onChange={(e) => upd(inc.id, { date: e.target.value })} placeholder="date" className={`text-[11px] text-[#b07d1a] w-24 text-right ${edCls}`} />
              <button onClick={() => dismiss(inc.id)} title="Dismiss" className="text-[#d4a72c] hover:text-[#b23b3b] text-base leading-none flex-shrink-0">×</button>
            </div>
            <textarea value={inc.summary} onChange={(e) => upd(inc.id, { summary: e.target.value })} rows={2} placeholder="What happened…" className={`text-[13px] text-[#5a4300] w-full resize-none leading-snug mb-2 ${edCls}`} />
            <div className="flex flex-col gap-1 mb-2">
              {inc.handled.map((h) => (
                <div key={h.id} className="group/h flex items-center gap-1.5">
                  <button onClick={() => updH(inc.id, h.id, { done: !h.done })} className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: h.done ? "#10b981" : "transparent", border: h.done ? "none" : "1px solid #d4a72c" }}>
                    {h.done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <input value={h.text} onChange={(e) => updH(inc.id, h.id, { text: e.target.value })} placeholder="handled item" className={`text-[12px] text-[#6b5320] flex-1 min-w-0 ${edCls}`} />
                  <button onClick={() => removeH(inc.id, h.id)} className="opacity-0 group-hover/h:opacity-100 text-[#d4a72c] hover:text-[#b23b3b] text-sm leading-none flex-shrink-0 transition-opacity">×</button>
                </div>
              ))}
              <button onClick={() => addH(inc.id)} className="text-[11px] text-[#b07d1a] hover:text-[#78350f] self-start ml-5">+ handled item</button>
            </div>
            <div className="flex items-center gap-1.5 pt-2 border-t border-[#fcd34d]">
              <span className="text-[12px] font-semibold text-[#78350f] flex-shrink-0">Next:</span>
              <input value={inc.next} onChange={(e) => upd(inc.id, { next: e.target.value })} placeholder="follow-up…" className={`text-[12px] text-[#78350f] flex-1 min-w-0 ${edCls}`} />
              <span className="text-[11px] text-[#5C9A9E] whitespace-nowrap flex-shrink-0 cursor-pointer">View booking →</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function NotesPanel({ incidents, setIncidents, notes, onToggle, onDelete, onAdd, text, setText, who, setWho }: {
  incidents: Incident[]; setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  notes: Note[]; onToggle: (id: number) => void; onDelete: (id: number) => void; onAdd: () => void;
  text: string; setText: (v: string) => void; who: string; setWho: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] flex flex-col h-[560px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
        <span className="text-[13px] font-semibold text-black">Notes &amp; to-dos</span>
        <span className="text-[11px] text-[#afafaf]">ongoing</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <HeadsUp incidents={incidents} setIncidents={setIncidents} />
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] font-medium text-[#afafaf] mb-1">To-dos</p>
          {notes.map((n) => (
            <div key={n.id} className="group flex items-start gap-2.5 py-2 border-b border-black/5 last:border-0">
              <button onClick={() => onToggle(n.id)} className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border" style={{ background: n.done ? teal.border : "#fff", borderColor: n.done ? teal.border : "#cbd5e1" }}>
                {n.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </button>
              <p className="flex-1 text-[13px] leading-snug">
                <span className={n.done ? "text-[#afafaf] line-through" : "text-[#1a1a1a]"}>{n.text}</span>
                <span className="text-[11px] text-[#5C9A9E] font-medium ml-1.5 whitespace-nowrap">— {n.who}</span>
              </p>
              <button onClick={() => onDelete(n.id)} className="opacity-0 group-hover:opacity-100 text-[#c9ccd2] hover:text-[#e05252] text-base leading-none flex-shrink-0 transition-opacity" title="Delete note" aria-label="Delete note">×</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-black/5">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }} placeholder="Add a to-do…" className="flex-1 text-[13px] border border-black/15 rounded-lg px-2.5 py-1.5" />
        <select value={who} onChange={(e) => setWho(e.target.value)} className="text-[12px] border border-black/15 rounded-lg px-2 py-1.5 bg-white">
          {EMPLOYEES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={onAdd} className="text-[13px] font-medium text-white bg-black rounded-full px-3.5 py-1.5 hover:bg-[#1a1a1a]">Add</button>
      </div>
    </div>
  );
}

function DispatchPanel({ status, onCycle }: { status: Record<string, number>; onCycle: (id: string) => void }) {
  const rows = [...reservations].sort((a, b) => a.start - b.start);
  return (
    <div className="bg-white rounded-xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] flex flex-col h-[560px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
        <span className="text-[13px] font-semibold text-black">Today&apos;s dispatch <span className="text-[11px] font-normal text-[#afafaf]">· {rows.length} going out</span></span>
        <button disabled title="Prints / sends the crew sheet to the dock (disabled in the demo)" className="text-[12px] font-medium text-[#9aa0a6] border border-black/10 rounded-full px-3 py-1 cursor-default">Print / Send</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.map((r) => {
          const boat = boatById(r.boatId);
          const st = status[r.id] || 0;
          const dim = st === 1 ? "line-through text-[#afafaf]" : "";
          const acc = (r.accessories ?? []).map((k) => accessoriesForBoat(boat).find((a) => a.key === k)?.label).filter(Boolean);
          return (
            <button
              key={r.id}
              onClick={() => onCycle(r.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-2 border-b border-black/5 last:border-0 hover:bg-[#fafafa]"
              style={{ background: st === 2 ? "#eaf6ef" : undefined }}
              title="Click: out on the water → back / done → reset"
            >
              <span className="w-[118px] flex-shrink-0 text-[12px] truncate">
                <span className={`font-mono font-semibold ${st === 1 ? "text-[#afafaf]" : "text-[#5C9A9E]"}`}>{boat?.code || "—"}</span>
                <span className={`ml-1.5 ${st === 1 ? dim : "text-[#1a1a1a]"}`}>{boat?.name}</span>
              </span>
              <span className={`w-[104px] flex-shrink-0 text-[12px] tabular-nums ${st === 1 ? dim : "text-[#6b6b6b]"}`}>{fmtRange(r.start, resEnd(r))}</span>
              <span className={`text-[13px] font-medium flex-shrink-0 ${st === 1 ? dim : st === 2 ? "text-[#0F6E56]" : "text-[#1a1a1a]"}`}>{r.renter}</span>
              {acc.length > 0 && <span className={`text-[11px] flex-shrink-0 ${st === 1 ? "text-[#afafaf] line-through" : "text-[#9aa0a6]"}`}>· {acc.join(", ")}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReservationDetail({ res, onClose }: { res: Reservation; onClose: () => void }) {
  const boat = boatById(res.boatId);
  const st = stageConfig[stageOf(res)];
  const dur = res.duration >= 420 ? "Full day (7h)" : "Half day (4h)";
  const accLabels = (res.accessories ?? []).map((k) => accessoriesForBoat(boat).find((a) => a.key === k)?.label ?? k);

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mt-3" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          <DRow label="Date" value={DEMO_DATE} />
          <DRow label="Time" value={fmtRange(res.start, resEnd(res))} />
          <DRow label="Length" value={dur} />
          <DRow label="Boat assigned" value={boat ? `${boat.name}${boat.code ? ` (${boat.code})` : ""}` : "—"} />
          <DRow label="Category" value={res.category} />
          {res.partySize != null && <DRow label="Party size" value={`${res.partySize}${boat ? ` of ${boat.capacity}` : ""}`} />}
          <DRow label="Captain" value={res.captain ?? res.renter} />
          {res.accessories != null && <DRow label="Accessories" value={accLabels.length ? accLabels.join(", ") : "None"} />}
          {res.total != null && <DRow label="Charged" value={`${money(res.total)}${res.cardLast4 ? ` · •••• ${res.cardLast4}` : ""}`} />}

          <div className="bg-[#f0f7fb] border border-[#d0e8f5] rounded-xl p-3 mt-2">
            <p className="text-[11px] text-[#2A5B7D] leading-relaxed">
              View only for now. The full booking record — waiver, damage photos, and actions like reassigning or flagging damage — comes once we design how a reservation weaves into booking and maintenance.
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
