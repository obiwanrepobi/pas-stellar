"use client";

import { useState, useRef } from "react";
import { boats, statusConfig } from "../fleet/data";
import type { Boat, BoatStatus } from "../fleet/data";
import CompactDockMap from "./CompactDockMap";
import CascadeModal from "./CascadeModal";
import ClearForRentalModal from "./ClearForRentalModal";
import FlagModal from "./FlagModal";
import PresentBox from "./PresentBox";

// Only in-season boats with issues (no dry-dock)
const issueBoats = boats.filter(
  (b) => b.status === "out-of-service" || b.status === "needs-maintenance"
);

const oosCount = boats.filter((b) => b.status === "out-of-service").length;
const maintenanceCount = boats.filter((b) => b.status === "needs-maintenance").length;
const openTasksCount = issueBoats.reduce((n, b) => n + b.outstandingTasks.length, 0);

// How employees first caught each issue
type IssueLogEntry = {
  employee: string;
  timestamp: string;
  source: "customer-return" | "dock-walk" | "morning-check" | "captain-report" | "scheduled";
  note: string;
};
const sourceLabel: Record<IssueLogEntry["source"], string> = {
  "customer-return": "Customer reported on return",
  "dock-walk": "Dock walk",
  "morning-check": "Morning check",
  "captain-report": "Captain inspection post-rental",
  "scheduled": "Scheduled maintenance",
};
const issueLogData: Record<string, IssueLogEntry> = {
  "pp3-bermuda": { employee: "Tyler", timestamp: "Apr 17, 3:45pm", source: "captain-report", note: "Engine overheating on water — pulled back early. Temp gauge spiked past red. Not safe to go out again." },
  "sr3-gilgo": { employee: "Kenny", timestamp: "Apr 16, 8:00am", source: "scheduled", note: "Pulled for scheduled oil change and impeller replacement. Routine service." },
  "pp5-belize": { employee: "Zach", timestamp: "Apr 19, 5:30pm", source: "customer-return", note: "Rental customer mentioned vibration at high RPM when returning the boat. Prop looks nicked — possibly hit something shallow." },
  "pp7-barbados": { employee: "Kenny", timestamp: "Apr 19, 6:00pm", source: "captain-report", note: "Steering resistance noticed during post-rental walkthrough. Still operational but not comfortable sending it out again." },
  "sp3-antigua": { employee: "Zach", timestamp: "Apr 18, 4:15pm", source: "customer-return", note: "Guest pointed out upholstery tear on port side rear bench when returning. Cosmetic but needs repair before next busy weekend." },
};

// Email threads — only actual PAS ↔ service emails, no internal notes
type CorrespondenceEntry = {
  date: string;
  author: string;
  type: "sent" | "received";
  content: string;
};
const correspondence: Record<string, CorrespondenceEntry[]> = {
  "pp3-bermuda": [
    { date: "Apr 18", author: "Tyler → Matt", type: "sent", content: "Submitting service request for PP3 Bermuda — engine overheating, temp gauge spiked. Photos attached. Please advise on timeline." },
    { date: "Apr 19", author: "Matt (Service)", type: "received", content: "Got your request. Looks like thermostat or water pump issue. Parts on order — estimate 5–7 business days." },
  ],
  "sr3-gilgo": [
    { date: "Apr 16", author: "Dave → Matt", type: "sent", content: "Sending SR3 Gilgo in for scheduled oil change and impeller replacement. Target return Apr 23 — let us know if anything else comes up during the service." },
  ],
};

// Service history — full record per boat
type ServiceRecord = {
  date: string;
  type: string;
  description: string;
  technician: string;
  duration: string;
  resolved: boolean;
};
const serviceHistoryData: Record<string, ServiceRecord[]> = {
  "pp3-bermuda": [
    { date: "Apr 17, 2026", type: "Engine — Overheating", description: "Temp gauge spiked mid-rental. Thermostat and water pump suspected. Parts on order.", technician: "Matt (Service)", duration: "In progress", resolved: false },
    { date: "Mar 14, 2026", type: "Annual Pre-Season Service", description: "Full tune-up: oil change, fuel filter, impeller, battery check. All systems passed.", technician: "Matt (Service)", duration: "1 day", resolved: true },
    { date: "Aug 22, 2025", type: "Engine — Overheating", description: "Similar overheating reported mid-season. Thermostat replaced. Returned to service following day.", technician: "Matt (Service)", duration: "2 days", resolved: true },
    { date: "May 2, 2025", type: "Pre-Season Detail + Safety", description: "Full exterior detail, cover replacement, life jacket inventory, navigation light check.", technician: "Tyler + Kenny", duration: "1 day", resolved: true },
  ],
  "sr3-gilgo": [
    { date: "Apr 16, 2026", type: "Scheduled — Oil + Impeller", description: "Routine oil change and impeller replacement. In service with Matt.", technician: "Matt (Service)", duration: "In progress", resolved: false },
    { date: "Sep 5, 2025", type: "Prop Replacement", description: "Prop damaged after guest rental. Replaced with matching prop. Back in service same day.", technician: "Matt (Service)", duration: "4 hours", resolved: true },
    { date: "May 3, 2025", type: "Pre-Season Service", description: "Oil change, impeller, fuel filter. Bilge pump tested. All clear.", technician: "Matt (Service)", duration: "1 day", resolved: true },
  ],
  "pp5-belize": [
    { date: "Apr 19, 2026", type: "Prop Damage — Inspection Needed", description: "Nicked prop reported after rental. Vibration at high RPM. Needs inspection before next run.", technician: "Pending", duration: "Pending", resolved: false },
    { date: "Mar 14, 2026", type: "Annual Pre-Season Service", description: "Full tune-up and detail. No issues found.", technician: "Matt (Service)", duration: "1 day", resolved: true },
    { date: "Jul 18, 2025", type: "Upholstery Repair", description: "Stern seat tear repaired. Same-day patch, full replacement scheduled for off-season.", technician: "Dave", duration: "2 hours", resolved: true },
  ],
  "pp7-barbados": [
    { date: "Apr 19, 2026", type: "Steering — Resistance", description: "Stiff steering reported post-rental. Flagged for inspection before next outing.", technician: "Pending", duration: "Pending", resolved: false },
    { date: "Mar 14, 2026", type: "Annual Pre-Season Service", description: "Full service including steering cable lubrication. No issues at time of service.", technician: "Matt (Service)", duration: "1 day", resolved: true },
  ],
  "sp3-antigua": [
    { date: "Apr 18, 2026", type: "Upholstery — Tear", description: "Port side rear bench tear reported by guest. Cosmetic. Repair scheduled.", technician: "Pending", duration: "Pending", resolved: false },
    { date: "Mar 15, 2026", type: "Annual Pre-Season Service", description: "Full tune-up. Interior detail and upholstery inspection — minor wear noted, no tears.", technician: "Matt (Service)", duration: "1 day", resolved: true },
  ],
  "pp1-tortola": [
    { date: "Mar 14, 2026", type: "Annual Pre-Season Service", description: "Oil change, impeller, battery. Full detail. Ready for season.", technician: "Matt (Service)", duration: "1 day", resolved: true },
    { date: "Aug 10, 2025", type: "Bilge Pump Replacement", description: "Bilge pump failed during inspection. Replaced same day.", technician: "Matt (Service)", duration: "3 hours", resolved: true },
  ],
  "pp2-jamaica": [
    { date: "Mar 14, 2026", type: "Annual Pre-Season Service", description: "Full tune-up. No issues found.", technician: "Matt (Service)", duration: "1 day", resolved: true },
  ],
  "sr1-atlantique": [
    { date: "Mar 15, 2026", type: "Annual Pre-Season Service", description: "Oil change, impeller, steering check. All clear.", technician: "Matt (Service)", duration: "1 day", resolved: true },
    { date: "Jun 14, 2025", type: "Battery Replacement", description: "Battery wouldn't hold charge. Replaced with new unit.", technician: "Matt (Service)", duration: "1 hour", resolved: true },
  ],
};

// Last rental per boat
type LastRenter = {
  name: string;
  date: string;
  returned: string;
  email: string;
  phone: string;
  bookingId: string;
};
const lastRenterData: Record<string, LastRenter> = {
  "pp3-bermuda": { name: "Mike Caruso", date: "Apr 17, 10:00am – 3:00pm", returned: "Apr 17, 3:12pm", email: "mcaruso@gmail.com", phone: "(908) 555-0142", bookingId: "BK-20418" },
  "sr3-gilgo": { name: "Dana & Tom Hewitt", date: "Apr 16, 8:00am – 1:00pm", returned: "Apr 16, 12:58pm", email: "dana.hewitt@yahoo.com", phone: "(570) 555-0287", bookingId: "BK-20391" },
  "pp5-belize": { name: "Jordan Kline", date: "Apr 19, 8:00am – 1:00pm", returned: "Apr 19, 1:05pm", email: "jordankline22@gmail.com", phone: "(484) 555-0319", bookingId: "BK-20502" },
  "pp7-barbados": { name: "Samir Patel", date: "Apr 19, 9:00am – 2:00pm", returned: "Apr 19, 2:03pm", email: "sampatel@outlook.com", phone: "(201) 555-0455", bookingId: "BK-20508" },
  "sp3-antigua": { name: "Rachel Torres", date: "Apr 18, 10:00am – 3:00pm", returned: "Apr 18, 2:55pm", email: "rtorres.family@gmail.com", phone: "(973) 555-0612", bookingId: "BK-20477" },
};

// Expected return dates for calendar
const expectedReturn: Record<string, { label: string; daysOut: number }> = {
  "pp3-bermuda": { label: "May 3", daysOut: 13 },
  "sr3-gilgo": { label: "Apr 23", daysOut: 3 },
  "pp5-belize": { label: "Apr 21", daysOut: 1 },
  "pp7-barbados": { label: "Apr 22", daysOut: 2 },
  "sp3-antigua": { label: "Apr 25", daysOut: 5 },
};

function generateEmail(boat: Boat, hasReply: boolean): string {
  if (hasReply) {
    return `Hi Matt,

Just following up on ${boat.name}${boat.code ? ` (${boat.code})` : ""} — wanted to check on the status.

Last update we had was that parts were on order with an estimate of 5–7 business days. We're starting to get rental inquiries and want to plan around the return date.

Any update on where things stand? Let us know if you need anything from our end.

Thanks,
Tyler
PAS Rental Operations
(570) 226-9229`;
  }

  const tasks = boat.outstandingTasks.filter(
    (t) => !t.toLowerCase().includes("dave") && !t.toLowerCase().includes("sue")
  );
  return `Hi Matt,

Service request for ${boat.name}${boat.code ? ` (${boat.code})` : ""}.

Make/Model: ${boat.make}
Last out: ${boat.lastOut}
Dock: ${boat.dock} · Slip ${boat.slip}

Issue:
${boat.maintenanceNote}${
    tasks.length > 0
      ? `\n\nAdditional notes:\n${tasks.map((t) => `• ${t}`).join("\n")}`
      : ""
  }

3 photos attached.

Please advise on timeline for diagnosis and repair. Boat is currently unavailable for rentals.

Thanks,
Tyler
PAS Rental Operations
(570) 226-9229`;
}

export default function MaintenancePage() {
  const [presentMode, setPresentMode] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [cascadeBoat, setCascadeBoat] = useState<Boat | null>(null);
  const [flagBoat, setFlagBoat] = useState<Boat | null>(null);
  const [clearBoat, setClearBoat] = useState<Boat | null>(null);
  const [emailOpen, setEmailOpen] = useState<Record<string, boolean>>({});
  const [renterOpen, setRenterOpen] = useState<Record<string, boolean>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [selectedHistoryBoat, setSelectedHistoryBoat] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDockBoatClick = (boat: Boat) => {
    const isIssue =
      boat.status === "out-of-service" || boat.status === "needs-maintenance";
    if (isIssue) {
      setExpandedCard(boat.id);
      setTimeout(() => {
        cardRefs.current[boat.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    } else {
      setFlagBoat(boat);
    }
  };

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-[#afafaf] uppercase tracking-widest mb-1">
            Pocono Action Sports
          </p>
          <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">
            Boat Maintenance
          </h1>
        </div>

        {/* Present mode toggle */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[#efefef] rounded-full p-1 gap-0.5">
            <button
              onClick={() => setPresentMode(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                !presentMode
                  ? "bg-black text-white shadow-[rgba(0,0,0,0.12)_0px_2px_8px]"
                  : "text-[#4b4b4b] hover:text-black"
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Explore
            </button>
            <button
              onClick={() => setPresentMode(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                presentMode
                  ? "bg-black text-white shadow-[rgba(0,0,0,0.12)_0px_2px_8px]"
                  : "text-[#4b4b4b] hover:text-black"
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m10 2V2M3 10h18M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Present
            </button>
          </div>
        </div>
      </div>

      {/* Present mode banner */}
      {presentMode && (
        <div className="bg-[#081731] text-white rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#5C9A9E] flex-shrink-0" />
          <p className="text-xs text-white/80">
            <span className="text-white font-semibold">Presentation mode on.</span> Hover over any section to see how it works.
          </p>
        </div>
      )}

      {/* Summary pills */}
      <PresentBox
        active={presentMode}
        title="At-a-glance fleet health"
        description="At a glance, the manager sees the fleet's health before touching anything. No app to open, no dock walk needed."
        className="w-fit mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-full px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-red-700 text-xs font-semibold">
              {oosCount} Out of Service
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-full px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-amber-700 text-xs font-semibold">
              {maintenanceCount} Needs Attention
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-black/10 rounded-full px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-black/30 flex-shrink-0" />
            <span className="text-black text-xs font-semibold">
              {openTasksCount} Open Tasks
            </span>
          </div>
        </div>
      </PresentBox>

      {/* Main content: dock map + issue tracker */}
      <div className="grid grid-cols-[minmax(0,400px)_1fr] gap-6 items-start mb-6">
        {/* Left: compact dock map (sticky) */}
        <div className="sticky top-4">
          <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
            Dock Overview
          </p>
          <CompactDockMap
            onBoatClick={handleDockBoatClick}
            presentMode={presentMode}
          />
        </div>

        {/* Right: issue tracker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#afafaf] uppercase tracking-widest">
              Active Issues
            </p>
            <span className="text-[10px] text-[#afafaf]">
              Click a dock slip to jump to its record
            </span>
          </div>

          <div className="space-y-3">
            {issueBoats.map((boat) => (
              <IssueCard
                key={boat.id}
                boat={boat}
                expanded={expandedCard === boat.id}
                onToggle={() =>
                  setExpandedCard((prev) => (prev === boat.id ? null : boat.id))
                }
                onTakeOOS={() => setCascadeBoat(boat)}
                onClearForRental={() => setClearBoat(boat)}
                emailOpen={emailOpen[boat.id] ?? false}
                onToggleEmail={() =>
                  setEmailOpen((prev) => ({ ...prev, [boat.id]: !prev[boat.id] }))
                }
                renterOpen={renterOpen[boat.id] ?? false}
                onToggleRenter={() =>
                  setRenterOpen((prev) => ({ ...prev, [boat.id]: !prev[boat.id] }))
                }
                lastRenter={lastRenterData[boat.id] ?? null}
                noteValue={noteValues[boat.id] ?? ""}
                onNoteChange={(v) =>
                  setNoteValues((prev) => ({ ...prev, [boat.id]: v }))
                }
                correspondence={correspondence[boat.id] ?? []}
                issueLog={issueLogData[boat.id] ?? null}
                presentMode={presentMode}
                ref={(el) => { cardRefs.current[boat.id] = el; }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Calendar strip */}
      <PresentBox
        active={presentMode}
        title="Return timeline"
        description="Expected return dates in one view. Plan reservations around maintenance windows — no more scheduling conflicts or surprise shortfalls."
        position="top"
      >
        <div className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5">
            <h2 className="font-semibold text-sm text-black">
              Expected Return Timeline
              <span className="ml-2 text-[10px] text-[#afafaf] font-normal">Apr 20 — May 10, 2026</span>
            </h2>
          </div>
          <div className="px-6 py-4 overflow-x-auto">
            <CalendarStrip boats={issueBoats} expectedReturn={expectedReturn} />
          </div>
        </div>
      </PresentBox>

      {/* Service History */}
      <div id="service-history" className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-black/5">
          <h2 className="font-semibold text-sm text-black">Service History</h2>
          <p className="text-xs text-[#afafaf] mt-0.5">Select any boat to view its full maintenance record</p>
        </div>
        <div className="px-6 py-4">
          {/* Boat selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {boats
              .filter((b) => b.category !== "Utility" && serviceHistoryData[b.id])
              .map((b) => {
                const sc = statusConfig[b.status as BoatStatus];
                const active = selectedHistoryBoat === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedHistoryBoat(active ? null : b.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#4b4b4b] border-black/10 hover:border-black/30"
                    }`}
                  >
                    {b.code || b.name.split(" ")[0]}
                    {b.status !== "in-service" && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: active ? "white" : sc.dot }}
                      />
                    )}
                  </button>
                );
              })}
          </div>

          {/* History table */}
          {selectedHistoryBoat ? (
            <ServiceHistoryTable records={serviceHistoryData[selectedHistoryBoat] ?? []} />
          ) : (
            <div className="text-center py-8 text-[#afafaf] text-sm">
              Select a boat above to view its service record
            </div>
          )}
        </div>
      </div>

      {/* Cascade modal */}
      {cascadeBoat && (
        <CascadeModal boat={cascadeBoat} onClose={() => setCascadeBoat(null)} />
      )}

      {/* Flag for maintenance modal */}
      {flagBoat && (
        <FlagModal boat={flagBoat} onClose={() => setFlagBoat(null)} />
      )}

      {/* Clear for rental modal */}
      {clearBoat && (
        <ClearForRentalModal boat={clearBoat} onClose={() => setClearBoat(null)} />
      )}
    </div>
  );
}

// ─── Issue Card ──────────────────────────────────────────────────────────────

import React from "react";

interface IssueCardProps {
  boat: Boat;
  expanded: boolean;
  onToggle: () => void;
  onTakeOOS: () => void;
  onClearForRental: () => void;
  emailOpen: boolean;
  onToggleEmail: () => void;
  renterOpen: boolean;
  onToggleRenter: () => void;
  lastRenter: LastRenter | null;
  noteValue: string;
  onNoteChange: (v: string) => void;
  correspondence: CorrespondenceEntry[];
  issueLog: IssueLogEntry | null;
  presentMode: boolean;
}

const IssueCard = React.forwardRef<HTMLDivElement, IssueCardProps>(
  (
    {
      boat,
      expanded,
      onToggle,
      onTakeOOS,
      onClearForRental,
      emailOpen,
      onToggleEmail,
      renterOpen,
      onToggleRenter,
      lastRenter,
      noteValue,
      onNoteChange,
      correspondence,
      issueLog,
      presentMode,
    },
    ref
  ) => {
    const sc = statusConfig[boat.status as BoatStatus];
    const isOOS = boat.status === "out-of-service";

    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl shadow-[rgba(0,0,0,0.08)_0px_4px_16px] overflow-hidden transition-all ${
          expanded ? "ring-1 ring-black/10" : ""
        }`}
      >
        {/* Collapsed header */}
        <div
          className="flex items-start gap-4 p-5 cursor-pointer hover:bg-[#fafafa] transition-colors"
          onClick={onToggle}
        >
          {/* Status icon */}
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
            style={{ backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sc.dot }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {boat.code && (
                <span className="text-[10px] font-mono font-bold text-[#5C9A9E] tracking-widest">
                  {boat.code}
                </span>
              )}
              <span className="font-bold text-base text-black">{boat.name}</span>
              <PresentBox
                active={presentMode}
                title="Status badge"
                description="Status syncs across the entire system. Changing it here updates the reservation calendar, the public website, and the staff view — simultaneously."
                position="bottom"
                className="inline-flex"
              >
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{ backgroundColor: sc.bg, borderColor: sc.border, color: sc.text }}
                >
                  {sc.label}
                </span>
              </PresentBox>
            </div>
            <p className="text-xs text-[#4b4b4b] mb-1">
              {boat.category} · Dock {boat.dock} · Slip {boat.slip}
            </p>
            {boat.maintenanceNote && (
              <p className="text-xs text-[#4b4b4b] leading-relaxed line-clamp-1">
                {boat.maintenanceNote}
              </p>
            )}
          </div>

          {/* Right: task count + OOS button + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {boat.outstandingTasks.length > 0 && (
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                {boat.outstandingTasks.length} task{boat.outstandingTasks.length !== 1 ? "s" : ""}
              </span>
            )}
            {boat.status === "needs-maintenance" && (
              <PresentBox
                active={presentMode}
                title="Clear for rental"
                description="Override the maintenance flag for a busy weekend. Boat goes green immediately. You pick a date to automatically pull it back for service — no one has to remember."
                position="left"
                className="inline-flex"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onClearForRental(); }}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Clear for Rental
                </button>
              </PresentBox>
            )}
            {!isOOS && (
              <PresentBox
                active={presentMode}
                title="Take out of service"
                description="One click removes this boat from public availability, blocks it from the reservation calendar, and logs the event with a timestamp and the employee who triggered it."
                position="left"
                className="inline-flex"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeOOS();
                  }}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                >
                  Take Out of Service
                </button>
              </PresentBox>
            )}
            <svg
              className={`w-4 h-4 text-[#afafaf] transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-black/5 px-5 pb-5 pt-4 space-y-5">
            {/* Issue log — how the problem was caught */}
            {issueLog && (
              <PresentBox
                active={presentMode}
                title="Issue log"
                description="Every problem starts with someone catching it — a guest returning a boat, a captain's inspection, a morning check. This log records exactly who flagged it, when, and how it was discovered."
                position="left"
              >
                <div className="bg-[#fafafa] rounded-xl border border-black/8 p-4">
                  <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-3">
                    Issue Logged
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {issueLog.employee.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-black">{issueLog.employee}</span>
                        <span className="text-[10px] text-[#afafaf]">{issueLog.timestamp}</span>
                        <span className="text-[9px] font-semibold bg-black/8 text-[#4b4b4b] px-2 py-0.5 rounded-full">
                          {sourceLabel[issueLog.source]}
                        </span>
                      </div>
                      <p className="text-xs text-[#4b4b4b] leading-relaxed">{issueLog.note}</p>
                    </div>
                  </div>
                </div>
              </PresentBox>
            )}

            {/* Last renter */}
            {lastRenter && (
              <PresentBox
                active={presentMode}
                title="Last rental lookup"
                description="The last person who rented the boat is one click away. If a guest caused damage, you can reach out directly without digging through booking records."
                position="left"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest">
                      Last Rental
                    </p>
                    <button
                      onClick={onToggleRenter}
                      className="text-[10px] font-semibold text-[#5C9A9E] hover:underline"
                    >
                      {renterOpen ? "Collapse" : "View Renter →"}
                    </button>
                  </div>
                  {renterOpen && (
                    <div className="bg-[#fafafa] rounded-xl border border-black/8 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-sm text-black mb-0.5">{lastRenter.name}</p>
                          <p className="text-[10px] text-[#afafaf] mb-3">{lastRenter.date}</p>
                          <div className="space-y-1 text-xs text-[#4b4b4b]">
                            <p><span className="font-semibold text-black">Returned:</span> {lastRenter.returned}</p>
                            <p><span className="font-semibold text-black">Email:</span> {lastRenter.email}</p>
                            <p><span className="font-semibold text-black">Phone:</span> {lastRenter.phone}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[9px] font-mono font-bold text-[#5C9A9E]">{lastRenter.bookingId}</p>
                          <button className="mt-2 text-[10px] font-semibold text-white bg-black px-3 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors">
                            View Booking →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </PresentBox>
            )}

            {/* Outstanding tasks */}
            {boat.outstandingTasks.length > 0 && (
              <PresentBox
                active={presentMode}
                title="Outstanding tasks"
                description="Tasks like 'Talk to Sue by 4/26' stay on the boat record until resolved. They don't get buried in Slack or forgotten."
                position="left"
              >
                <div>
                  <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                    Outstanding Tasks
                  </p>
                  <div className="space-y-2">
                    {boat.outstandingTasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded border-2 border-amber-300 bg-amber-50 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-[#4b4b4b] leading-relaxed">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PresentBox>
            )}

            {/* Manager notes */}
            <PresentBox
              active={presentMode}
              title="Manager notes"
              description="Notes are timestamped and tied to the logged-in employee. No more Slack messages that disappear into a channel."
              position="left"
            >
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  Manager Notes
                </p>
                <textarea
                  value={noteValue}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Add a note — what's been tried, who was contacted, what's next…"
                  rows={3}
                  className="w-full text-xs border border-black/10 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:border-[#5C9A9E] placeholder-[#c0c0c0] bg-[#fafafa]"
                />
              </div>
            </PresentBox>

            {/* Photo upload */}
            <PresentBox
              active={presentMode}
              title="Photo documentation"
              description="Photos attach directly to the service record and are included automatically in the email to Matt — no forwarding or copying."
              position="left"
            >
              <div>
                <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-2">
                  Photos
                </p>
                <div className="flex items-center gap-2">
                  {/* Fake uploaded photos */}
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="w-16 h-16 rounded-lg bg-[#f0f7fb] border border-[#d0e8f5] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 text-[#5C9A9E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18A2.25 2.25 0 0023.25 18V6a2.25 2.25 0 00-2.25-2.25H3A2.25 2.25 0 00.75 6v12A2.25 2.25 0 003 20.25z" />
                      </svg>
                    </div>
                  ))}
                  <button className="w-16 h-16 rounded-lg border-2 border-dashed border-black/15 flex items-center justify-center hover:border-[#5C9A9E]/50 hover:bg-[#f0f7fb]/50 transition-colors">
                    <svg className="w-4 h-4 text-[#afafaf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </PresentBox>

            {/* Draft email */}
            <PresentBox
              active={presentMode}
              title="Auto-draft email to service"
              description="The system writes the service email from the info above. Manager reviews, edits if needed, and sends — all from this screen. No copy-pasting."
              position="left"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest">
                    Email to Matt (Service)
                  </p>
                  <button
                    onClick={onToggleEmail}
                    className="text-[10px] font-semibold text-[#5C9A9E] hover:underline"
                  >
                    {emailOpen ? "Collapse" : "View Draft →"}
                  </button>
                </div>
                {emailOpen && (
                  <div className="rounded-xl border border-black/10 overflow-hidden">
                    <div className="bg-[#f5f5f5] px-4 py-2.5 border-b border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] text-[#4b4b4b]">
                        <span>
                          <span className="font-semibold text-black">To:</span> matt@passervice.com
                        </span>
                        <span>
                          <span className="font-semibold text-black">Subject:</span>{" "}
                          {correspondence.some((e) => e.type === "received")
                            ? `Re: Service Request — ${boat.name}${boat.code ? ` (${boat.code})` : ""}`
                            : `Service Request — ${boat.name}${boat.code ? ` (${boat.code})` : ""}`}
                        </span>
                      </div>
                      <button className="bg-black text-white text-[10px] font-semibold px-3 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors">
                        Send Email
                      </button>
                    </div>
                    <pre className="text-[11px] text-[#4b4b4b] leading-relaxed px-4 py-3 whitespace-pre-wrap font-sans bg-white">
                      {generateEmail(boat, correspondence.some((e) => e.type === "received"))}
                    </pre>
                  </div>
                )}
              </div>
            </PresentBox>

            {/* Correspondence thread */}
            {correspondence.length > 0 && (
              <PresentBox
                active={presentMode}
                title="Correspondence timeline"
                description="Every reply from the service department is logged here in order. The full timeline lives on the boat record — not in someone's personal inbox."
                position="left"
              >
                <div>
                  <p className="text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest mb-3">
                    Emails Sent &amp; Received
                  </p>
                  <div className="space-y-3">
                    {correspondence.map((entry, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold ${
                              entry.type === "received"
                                ? "bg-[#5C9A9E]/15 text-[#5C9A9E]"
                                : "bg-black text-white"
                            }`}
                          >
                            {entry.author.charAt(0)}
                          </div>
                          {i < correspondence.length - 1 && (
                            <div className="w-px flex-1 bg-black/5 min-h-[12px]" />
                          )}
                        </div>
                        <div className="pb-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-black">{entry.author}</span>
                            <span className="text-[9px] text-[#afafaf]">{entry.date}</span>
                            <span
                              className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                                entry.type === "received"
                                  ? "bg-[#5C9A9E]/10 text-[#5C9A9E]"
                                  : "bg-black/10 text-black"
                              }`}
                            >
                              {entry.type === "received" ? "Reply from Matt" : "Sent"}
                            </span>
                          </div>
                          <p className="text-xs text-[#4b4b4b] leading-relaxed">{entry.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PresentBox>
            )}
          </div>
        )}
      </div>
    );
  }
);
IssueCard.displayName = "IssueCard";

// ─── Calendar Strip ───────────────────────────────────────────────────────────

function CalendarStrip({
  boats,
  expectedReturn,
}: {
  boats: Boat[];
  expectedReturn: Record<string, { label: string; daysOut: number }>;
}) {
  const DAYS = 21;
  const DAY_W = 36;

  const labels = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(2026, 3, 20 + i); // April 20 + i
    return {
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
    };
  });

  return (
    <div className="min-w-0" style={{ width: `${80 + DAYS * DAY_W}px` }}>
      {/* Date headers */}
      <div className="flex mb-2">
        <div style={{ width: 80 }} className="flex-shrink-0" />
        {labels.map((l, i) => (
          <div
            key={i}
            style={{ width: DAY_W }}
            className={`flex-shrink-0 text-center text-[9px] font-semibold ${
              l.isToday ? "text-black" : "text-[#afafaf]"
            }`}
          >
            {l.day === 1 || l.isToday ? l.month : ""}
            <div className={l.isToday ? "text-black font-bold" : ""}>{l.day}</div>
          </div>
        ))}
      </div>

      {/* Boat rows */}
      <div className="space-y-2">
        {boats.map((boat) => {
          const ret = expectedReturn[boat.id];
          const daysOut = ret?.daysOut ?? 7;
          const sc = statusConfig[boat.status as BoatStatus];
          const barWidth = Math.min(daysOut, DAYS) * DAY_W;

          return (
            <div key={boat.id} className="flex items-center">
              <div style={{ width: 80 }} className="flex-shrink-0 pr-2">
                <p className="text-xs font-semibold text-black truncate">{boat.name}</p>
                {boat.code && (
                  <p className="text-[9px] font-mono text-[#5C9A9E] font-bold">{boat.code}</p>
                )}
              </div>
              <div className="relative flex-1 h-7 flex items-center">
                {/* Background grid */}
                <div className="absolute inset-0 flex">
                  {labels.map((_, i) => (
                    <div
                      key={i}
                      style={{ width: DAY_W }}
                      className={`flex-shrink-0 h-full border-r border-black/5 ${
                        i === 0 ? "bg-black/3" : ""
                      }`}
                    />
                  ))}
                </div>
                {/* Bar + label outside */}
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: barWidth,
                      backgroundColor: sc.bg,
                      borderColor: sc.border,
                    }}
                    className="h-5 rounded-full border flex-shrink-0"
                  />
                  <span
                    className="text-[10px] font-semibold whitespace-nowrap"
                    style={{ color: sc.text }}
                  >
                    {ret?.label ?? "TBD"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Service History Table ────────────────────────────────────────────────────

function ServiceHistoryTable({ records }: { records: ServiceRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-[#afafaf] py-4">No service records found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/8">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#f5f5f5] border-b border-black/5">
            {["Date", "Service Type", "Description", "Technician", "Duration", "Status"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#afafaf] uppercase tracking-widest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} className={`border-b border-black/5 ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
              <td className="px-4 py-3 text-xs text-[#4b4b4b] whitespace-nowrap">{r.date}</td>
              <td className="px-4 py-3 text-xs font-semibold text-black">{r.type}</td>
              <td className="px-4 py-3 text-xs text-[#4b4b4b] max-w-xs">{r.description}</td>
              <td className="px-4 py-3 text-xs text-[#4b4b4b]">{r.technician}</td>
              <td className="px-4 py-3 text-xs text-[#4b4b4b]">{r.duration}</td>
              <td className="px-4 py-3">
                {r.resolved ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-semibold px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Resolved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-semibold px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    In Progress
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
