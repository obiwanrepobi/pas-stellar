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
];

// ─── Reservation type ───────────────────────────────────────────────────────
// Customer requests a CATEGORY; a specific hull is auto-slotted at booking time,
// so every reservation carries a concrete boatId.
export interface Reservation {
  id: string;
  boatId: string;
  category: string;
  start: number; // minutes from midnight
  duration: number; // HALF_MIN | FULL_MIN
  renter: string; // captain / renter of record
}
export const resEnd = (r: Reservation) => r.start + r.duration;
export const reservationsForBoat = (boatId: string) =>
  reservations.filter((r) => r.boatId === boatId);

const m = (h: number, min = 0) => h * 60 + min;

// ─── Mock reservations for the demo day ───────────────────────────────────────
export const reservations: Reservation[] = [
  // Premium Pontoon
  { id: "R-8801", boatId: "pp1-tortola", category: "Premium Pontoon", start: m(8), duration: FULL_MIN, renter: "Mike Caruso" },
  { id: "R-8802", boatId: "pp2-jamaica", category: "Premium Pontoon", start: m(8, 30), duration: HALF_MIN, renter: "Dana Hewitt" },
  { id: "R-8803", boatId: "pp2-jamaica", category: "Premium Pontoon", start: m(14, 30), duration: HALF_MIN, renter: "Samir Patel" },
  { id: "R-8804", boatId: "pp4-curacao", category: "Premium Pontoon", start: m(9), duration: FULL_MIN, renter: "Alyssa Reed" },
  { id: "R-8805", boatId: "pp6-bahamas", category: "Premium Pontoon", start: m(9, 15), duration: HALF_MIN, renter: "Greg Lin" },
  { id: "R-8806", boatId: "pp6-bahamas", category: "Premium Pontoon", start: m(15), duration: HALF_MIN, renter: "Nina Osei" },
  { id: "R-8807", boatId: "pp10-belle", category: "Premium Pontoon", start: m(8, 30), duration: FULL_MIN, renter: "Priya Shah" },

  // Premium Slide Pontoon
  { id: "R-8810", boatId: "psp1-breaksea", category: "Premium Slide Pontoon", start: m(10), duration: FULL_MIN, renter: "The Delgado Party" },

  // Standard Slide Pontoon
  { id: "R-8815", boatId: "s1-grand-turk", category: "Standard Slide Pontoon", start: m(8, 15), duration: HALF_MIN, renter: "Kayla Brooks" },
  { id: "R-8816", boatId: "s1-grand-turk", category: "Standard Slide Pontoon", start: m(13, 15), duration: HALF_MIN, renter: "Owen Marsh" },
  { id: "R-8817", boatId: "s2-cozumel", category: "Standard Slide Pontoon", start: m(9, 30), duration: FULL_MIN, renter: "The Harmon Family" },

  // Standard Pontoon
  { id: "R-8820", boatId: "sp1-kitts", category: "Standard Pontoon", start: m(9, 15), duration: HALF_MIN, renter: "Rachel Torres" },
  { id: "R-8821", boatId: "sp2-caicos", category: "Standard Pontoon", start: m(11), duration: HALF_MIN, renter: "Dev Anand" },
  { id: "R-8822", boatId: "sp4-costa-rica", category: "Standard Pontoon", start: m(8), duration: FULL_MIN, renter: "The Kowalskis" },
  { id: "R-8823", boatId: "sp5-tortuga", category: "Standard Pontoon", start: m(8), duration: HALF_MIN, renter: "Liam Fox" },
  { id: "R-8824", boatId: "sp5-tortuga", category: "Standard Pontoon", start: m(12, 30), duration: HALF_MIN, renter: "The Nguyens" },

  // Standard Runabout
  { id: "R-8830", boatId: "sr1-atlantique", category: "Standard Runabout", start: m(10), duration: FULL_MIN, renter: "Jordan Kline" },
  { id: "R-8831", boatId: "sr2-montauk", category: "Standard Runabout", start: m(8, 45), duration: HALF_MIN, renter: "Chris Vogel" },
  { id: "R-8832", boatId: "sr2-montauk", category: "Standard Runabout", start: m(14), duration: HALF_MIN, renter: "Tara Quinn" },

  // Economy Pontoon
  { id: "R-8840", boatId: "ep1-eppley", category: "Economy Pontoon", start: m(9), duration: HALF_MIN, renter: "The Bauer Family" },
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
  return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap;
}
export const fmtRange = (s: number, e: number) => `${fmt(s)} – ${fmt(e)}`;
export const pctLeft = (min: number) =>
  ((min - DAY_START) / (DAY_END - DAY_START)) * 100;
export const pctWidth = (dur: number) => (dur / (DAY_END - DAY_START)) * 100;
