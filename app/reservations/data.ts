import { boats as fleetBoats, type Boat } from "../fleet/data";

// ─── Frozen demo day ──────────────────────────────────────────────────────────
// Peak-season busy Saturday. "Now" is mid-afternoon so some boats are still out.
export const DEMO_DATE = "Saturday, July 18, 2026";
export const DEMO_DATE_SHORT = "Sat, Jul 18";
export const NOW_MIN = 13 * 60 + 30; // 1:30pm

// ─── Time model ───────────────────────────────────────────────────────────────
export const HALF_MIN = 240; // half day = 4 hours
export const FULL_MIN = 420; // full day = 7 hours
export const BUFFER_MIN = 30; // turnover buffer between a return and the next send-out
export const DAY_START = 8 * 60; // earliest pickup 8:00a
export const DAY_END = 19 * 60 + 30; // latest drop-off 7:30p

// Staggered candidate start times. Full-days launch on the hour/half; half-days
// interleave on the :15/:45 so the dock crew isn't sending everything out at once.
const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};
export const FULL_STARTS = range(8 * 60, 11 * 60 + 30, 30); // 8:00 → 11:30
export const HALF_STARTS = range(8 * 60 + 15, 15 * 60 + 30, 30); // 8:15 → 3:30

// Boat categories that are actually rentable to renters (also = board display order)
export const RENTAL_CATEGORIES = [
  "Premium Pontoon",
  "Premium Slide Pontoon",
  "Standard Slide Pontoon",
  "Standard Pontoon",
  "Standard Runabout",
  "Economy Pontoon",
  "Economy Runabout",
  "Premium Pontoon Fishing Boat",
  "Center Console Fishing Boat",
];

// ─── Rate card (source of truth: PAS/RATE_CARD.md) ────────────────────────────
export const TAX_RATE = 0.06; // PA sales tax, shown INCLUSIVE at quote
export const DEPOSIT = 500; // refundable security deposit, taken at ARRIVAL
export const DAMAGE_WAIVER = 30; // head-on collisions only
export const CANCELLATION_INS = 50; // Tiki $25/ticket (parked)

export const RATES: Record<string, { half: number; full: number }> = {
  "Premium Slide Pontoon": { half: 750, full: 1180 },
  "Standard Slide Pontoon": { half: 605, full: 1035 },
  "Premium Pontoon": { half: 450, full: 685 },
  "Standard Pontoon": { half: 400, full: 610 },
  "Economy Pontoon": { half: 385, full: 485 },
  "Standard Runabout": { half: 400, full: 615 },
  "Economy Runabout": { half: 250, full: 375 },
  "Center Console Fishing Boat": { half: 300, full: 550 },
  "Premium Pontoon Fishing Boat": { half: 450, full: 685 },
};

// ─── Reservation type ───────────────────────────────────────────────────────
// Customer requests a CATEGORY; a specific hull is auto-slotted at booking time,
// so every reservation carries a concrete boatId.
// Rental lifecycle stages (drives the board block color). Colors chosen from
// PAS's old system, with two collisions fixed: Reserved is NOT red (red = OOS
// in this system), and Queued/Finalized no longer share purple.
export type ReservationStage = "reserved" | "queued" | "on-water" | "returned" | "finalized";
export const stageConfig: Record<
  ReservationStage,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  reserved: { label: "Reserved", bg: "#eef1f5", border: "#cbd5e1", text: "#3f4b5b", dot: "#94a3b8" },
  queued: { label: "Queued", bg: "#ede9fe", border: "#c4b5fd", text: "#5b21b6", dot: "#8b5cf6" },
  "on-water": { label: "On the water", bg: "#dbeafe", border: "#93c5fd", text: "#1e3a8a", dot: "#3b82f6" },
  returned: { label: "Returned", bg: "#d1fae5", border: "#6ee7b7", text: "#065f46", dot: "#10b981" },
  finalized: { label: "Finalized", bg: "#047857", border: "#065f46", text: "#ffffff", dot: "#a7f3d0" },
};

export interface Reservation {
  id: string;
  boatId: string;
  category: string;
  start: number; // minutes from midnight
  duration: number; // HALF_MIN | FULL_MIN
  renter: string; // reservation name — ALWAYS one individual, never a party/family name
  stage?: ReservationStage; // if absent, derived from time (see deriveStage)
  // Optional booking-screen fields (present on newly-created bookings)
  partySize?: number;
  booker?: string;
  phone?: string;
  email?: string;
  address?: string;
  captain?: string; // "TBD" allowed
  accessories?: string[]; // accessory keys
  damageWaiver?: boolean;
  cancellationInsurance?: boolean;
  total?: number; // tax-inclusive total charged at booking
  cardName?: string;
  cardLast4?: string;
}
export const resEnd = (r: Reservation) => r.start + r.duration;

// If a reservation carries no explicit stage, derive one from the frozen "now":
// upcoming → reserved, spanning now → on the water, past → returned.
export const stageOf = (r: Reservation): ReservationStage =>
  r.stage ?? (r.start > NOW_MIN ? "reserved" : resEnd(r) > NOW_MIN ? "on-water" : "returned");
export const reservationsForBoat = (boatId: string) =>
  reservations.filter((r) => r.boatId === boatId);

const m = (h: number, min = 0) => h * 60 + min;

// ─── Mock reservations for the demo day ───────────────────────────────────────
export const reservations: Reservation[] = [
  // Premium Pontoon
  { id: "R-8801", boatId: "pp1-tortola", category: "Premium Pontoon", start: m(8), duration: FULL_MIN, renter: "Mike Caruso" },
  { id: "R-8802", boatId: "pp2-jamaica", category: "Premium Pontoon", start: m(8, 30), duration: HALF_MIN, renter: "Dana Hewitt", stage: "finalized" },
  { id: "R-8803", boatId: "pp2-jamaica", category: "Premium Pontoon", start: m(14, 30), duration: HALF_MIN, renter: "Samir Patel", stage: "queued" },
  { id: "R-8804", boatId: "pp4-curacao", category: "Premium Pontoon", start: m(9), duration: FULL_MIN, renter: "Alyssa Reed" },
  { id: "R-8805", boatId: "pp6-bahamas", category: "Premium Pontoon", start: m(9, 15), duration: HALF_MIN, renter: "Greg Lin" },
  { id: "R-8806", boatId: "pp6-bahamas", category: "Premium Pontoon", start: m(15), duration: HALF_MIN, renter: "Nina Osei" },
  { id: "R-8807", boatId: "pp10-belle", category: "Premium Pontoon", start: m(8, 30), duration: FULL_MIN, renter: "Priya Shah" },

  // Premium Slide Pontoon
  { id: "R-8810", boatId: "psp1-breaksea", category: "Premium Slide Pontoon", start: m(10), duration: FULL_MIN, renter: "Marcus Delgado" },

  // Standard Slide Pontoon
  { id: "R-8815", boatId: "s1-grand-turk", category: "Standard Slide Pontoon", start: m(8, 15), duration: HALF_MIN, renter: "Kayla Brooks", stage: "finalized" },
  { id: "R-8816", boatId: "s1-grand-turk", category: "Standard Slide Pontoon", start: m(13, 15), duration: HALF_MIN, renter: "Owen Marsh" },
  { id: "R-8817", boatId: "s2-cozumel", category: "Standard Slide Pontoon", start: m(9, 30), duration: FULL_MIN, renter: "Paul Harmon" },

  // Standard Pontoon
  { id: "R-8820", boatId: "sp1-kitts", category: "Standard Pontoon", start: m(9, 15), duration: HALF_MIN, renter: "Rachel Torres" },
  { id: "R-8821", boatId: "sp2-caicos", category: "Standard Pontoon", start: m(11), duration: HALF_MIN, renter: "Dev Anand" },
  { id: "R-8822", boatId: "sp4-costa-rica", category: "Standard Pontoon", start: m(8), duration: FULL_MIN, renter: "Ed Kowalski" },
  { id: "R-8823", boatId: "sp5-tortuga", category: "Standard Pontoon", start: m(8), duration: HALF_MIN, renter: "Liam Fox", stage: "finalized" },
  { id: "R-8824", boatId: "sp5-tortuga", category: "Standard Pontoon", start: m(12, 30), duration: HALF_MIN, renter: "Kim Nguyen" },

  // Standard Runabout
  { id: "R-8830", boatId: "sr1-atlantique", category: "Standard Runabout", start: m(10), duration: FULL_MIN, renter: "Jordan Kline" },
  { id: "R-8831", boatId: "sr2-montauk", category: "Standard Runabout", start: m(8, 45), duration: HALF_MIN, renter: "Chris Vogel" },
  { id: "R-8832", boatId: "sr2-montauk", category: "Standard Runabout", start: m(14), duration: HALF_MIN, renter: "Tara Quinn", stage: "queued" },

  // Economy Pontoon
  { id: "R-8840", boatId: "ep1-eppley", category: "Economy Pontoon", start: m(9), duration: HALF_MIN, renter: "Greg Bauer" },
];

// ─── Availability engine ──────────────────────────────────────────────────────
// A hull is bookable only if it's in service. Category availability is the rollup
// of individual hull timelines (+ the turnover buffer).
export const bookableBoats = (category: string): Boat[] =>
  fleetBoats.filter((b) => b.category === category && b.status === "in-service");

const boatFree = (boatId: string, s: number, e: number): boolean =>
  reservationsForBoat(boatId).every(
    (r) => resEnd(r) + BUFFER_MIN <= s || e + BUFFER_MIN <= r.start
  );

// The open start windows for a category + duration, as {start, end} in minutes.
export function openWindows(
  category: string,
  duration: number
): { start: number; end: number }[] {
  const starts = duration === FULL_MIN ? FULL_STARTS : HALF_STARTS;
  const cboats = bookableBoats(category);
  return starts
    .filter((s) => s + duration <= DAY_END)
    .filter((s) => cboats.some((b) => boatFree(b.id, s, s + duration)))
    .map((s) => ({ start: s, end: s + duration }));
}

// ─── Headline counts (computed, so they never disagree with the board) ─────────
export function dayCounts() {
  const perBoat: Record<string, number> = {};
  reservations.forEach((r) => {
    perBoat[r.boatId] = (perBoat[r.boatId] || 0) + 1;
  });
  const outToday = Object.keys(perBoat).length;
  const turnovers = Object.values(perBoat).filter((n) => n >= 2).length;
  const stillOut = new Set(
    reservations
      .filter((r) => r.start <= NOW_MIN && resEnd(r) > NOW_MIN)
      .map((r) => r.boatId)
  ).size;
  return { outToday, turnovers, stillOut };
}

export const turnoverBoatIds = (): Set<string> => {
  const perBoat: Record<string, number> = {};
  reservations.forEach((r) => {
    perBoat[r.boatId] = (perBoat[r.boatId] || 0) + 1;
  });
  return new Set(Object.keys(perBoat).filter((id) => perBoat[id] >= 2));
};

// Rentable fleet grouped by category (in display order), including OOS/flagged
// boats so they show greyed on the board.
export function rentalFleetByCategory() {
  return RENTAL_CATEGORIES.map((category) => ({
    category,
    boats: fleetBoats.filter((b) => b.category === category),
  })).filter((g) => g.boats.length > 0);
}

// ─── Formatting + positioning helpers ─────────────────────────────────────────
export function fmt(min: number): string {
  let h = Math.floor(min / 60);
  const mm = min % 60;
  const ap = h < 12 ? "a" : "p";
  h = h % 12;
  if (h === 0) h = 12;
  // Always zero-pad the minutes so times line up (8:00a, not 8a).
  return h + ":" + String(mm).padStart(2, "0") + ap;
}
export const fmtRange = (s: number, e: number) => `${fmt(s)} – ${fmt(e)}`;
export const pctLeft = (min: number) =>
  ((min - DAY_START) / (DAY_END - DAY_START)) * 100;
export const pctWidth = (dur: number) => (dur / (DAY_END - DAY_START)) * 100;

// Open start windows for ONE specific boat (used when you click that boat's open
// lane to answer "what can I start on this one?").
export function boatOpenWindows(boatId: string): {
  half: { start: number; end: number }[];
  full: { start: number; end: number }[];
} {
  const free = (s: number, e: number) =>
    reservationsForBoat(boatId).every(
      (r) => resEnd(r) + BUFFER_MIN <= s || e + BUFFER_MIN <= r.start
    );
  const build = (starts: number[], dur: number) =>
    starts.filter((s) => s + dur <= DAY_END && free(s, s + dur)).map((s) => ({ start: s, end: s + dur }));
  return { half: build(HALF_STARTS, HALF_MIN), full: build(FULL_STARTS, FULL_MIN) };
}

// The TYPICAL standard schedule (the laminated desk card) — same across categories,
// split morning / afternoon. Reference only; not tied to today's bookings.
export const typicalWindows = {
  full: FULL_STARTS.map((s) => ({ start: s, end: s + FULL_MIN })),
  halfMorning: HALF_STARTS.filter((s) => s < 12 * 60).map((s) => ({ start: s, end: s + HALF_MIN })),
  halfAfternoon: HALF_STARTS.filter((s) => s >= 12 * 60).map((s) => ({ start: s, end: s + HALF_MIN })),
};

// ─── Booking: auto-slot, accessories, quote, create ───────────────────────────

// Every hull of a category that's free for a given window (buffer included).
// The board auto-slots the first; the manager can override to any of these.
export function freeHulls(category: string, start: number, duration: number): Boat[] {
  const end = start + duration;
  return bookableBoats(category).filter((b) => boatFree(b.id, start, end));
}

// Accessories are gated by the ASSIGNED boat's capability, and priced per-boat
// (water mat is $60 on the fishing pontoon, $50 elsewhere; hot dog tube is
// fishing-pontoon only). Source: PAS/RATE_CARD.md.
export interface Accessory {
  key: string;
  label: string;
  price: number;
}
export function accessoriesForBoat(boat: Boat | null | undefined): Accessory[] {
  if (!boat) return [];
  const isFishingPontoon = boat.category === "Premium Pontoon Fishing Boat";
  const list: Accessory[] = [];
  if (boat.canPullTube) list.push({ key: "single-tube", label: "Single tube", price: 30 });
  if (boat.canPullDouble) list.push({ key: "double-tube", label: "Double tube", price: 60 });
  if (isFishingPontoon) list.push({ key: "hotdog-tube", label: "Hot dog tube", price: 60 });
  if (boat.canPullKneeboard) list.push({ key: "kneeboard", label: "Kneeboard", price: 30 });
  if (boat.hasWaterMat) list.push({ key: "water-mat", label: "Water mat", price: isFishingPontoon ? 60 : 50 });
  return list;
}

export interface Quote {
  base: number;
  addOns: number;
  subtotal: number;
  tax: number;
  total: number; // tax-inclusive
}
export function quote(opts: {
  category: string;
  duration: number;
  boat?: Boat | null;
  accessoryKeys: string[];
  damageWaiver: boolean;
  cancellationInsurance: boolean;
}): Quote {
  const rate = RATES[opts.category];
  const base = rate ? (opts.duration === FULL_MIN ? rate.full : rate.half) : 0;
  let addOns = 0;
  const avail = accessoriesForBoat(opts.boat);
  opts.accessoryKeys.forEach((k) => {
    const a = avail.find((x) => x.key === k);
    if (a) addOns += a.price;
  });
  if (opts.damageWaiver) addOns += DAMAGE_WAIVER;
  if (opts.cancellationInsurance) addOns += CANCELLATION_INS;
  const subtotal = base + addOns;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { base, addOns, subtotal, tax, total };
}

// Session-live: push a new booking onto the in-memory reservations so it appears
// on the board immediately (resets on refresh, like the rest of the demo).
let resSeq = 8900;
export function addReservation(r: Omit<Reservation, "id">): Reservation {
  const created: Reservation = { ...r, id: `R-${resSeq++}`, stage: r.stage ?? "reserved" };
  reservations.push(created);
  return created;
}
