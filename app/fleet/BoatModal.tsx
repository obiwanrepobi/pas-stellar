"use client";

import { Boat, statusConfig } from "./data";

interface Props {
  boat: Boat;
  onClose: () => void;
}

export default function BoatModal({ boat, onClose }: Props) {
  const sc = statusConfig[boat.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={onClose}
    >
      <div
        className="h-full w-[420px] bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#081731] p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {boat.code && (
                  <span className="text-[#5C9A9E] text-xs font-mono font-bold uppercase tracking-widest">
                    {boat.code}
                  </span>
                )}
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/60 text-xs">{boat.category}</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight">{boat.name}</h2>
              {boat.slip > 0 && (
                <p className="text-white/50 text-xs mt-1">
                  Dock {boat.dock} · Slip {boat.slip}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-2xl leading-none mt-1"
            >
              ×
            </button>
          </div>

          {/* Status badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mt-3"
            style={{ backgroundColor: sc.bg, color: sc.text }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: sc.dot }}
            />
            {sc.label}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Quick specs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Horsepower", value: `${boat.hp} HP` },
              { label: "Capacity", value: `${boat.capacity} people` },
              { label: "Make", value: boat.make },
            ].map((s) => (
              <div key={s.label} className="bg-[#f0f7fb] rounded-xl p-3 text-center">
                <p className="text-[#5C9A9E] text-xs font-medium uppercase tracking-wide mb-1">
                  {s.label}
                </p>
                <p className="text-[#081731] font-bold text-sm">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Accessories */}
          <Section title="Accessories">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Single Tube", ok: boat.canPullTube },
                { label: "Double Tube", ok: boat.canPullDouble },
                { label: "Kneeboard", ok: boat.canPullKneeboard },
                { label: "Water Mat", ok: boat.hasWaterMat },
              ].map((a) => (
                <span
                  key={a.label}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    a.ok
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-400 line-through"
                  }`}
                >
                  {a.ok ? "✓" : "✗"} {a.label}
                </span>
              ))}
            </div>
            {boat.notes && (
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">{boat.notes}</p>
            )}
          </Section>

          {/* Maintenance */}
          {(boat.maintenanceNote || boat.outstandingTasks.length > 0) && (
            <Section title="Maintenance">
              {boat.maintenanceNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-amber-800 text-xs leading-relaxed">{boat.maintenanceNote}</p>
                </div>
              )}
              {boat.outstandingTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Outstanding Tasks
                  </p>
                  {boat.outstandingTasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-white border border-gray-200 rounded-lg p-2.5"
                    >
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
                      <span className="text-gray-700 text-xs">{task}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Daily Upkeep */}
          <Section title="Daily Upkeep">
            <div className="space-y-2.5">
              <Row
                label="Morning Check"
                value={
                  boat.morningCheckDone
                    ? `✓ Done — ${boat.morningCheckBy}`
                    : "✗ Not completed"
                }
                ok={boat.morningCheckDone}
              />
              <Row
                label="Last Cleaned"
                value={`${boat.lastCleaned} · by ${boat.lastCleanedBy}`}
                ok={true}
              />
              <Row
                label="Signed Off By"
                value={boat.cleaningSignedOffBy}
                ok={true}
              />
            </div>
          </Section>

          {/* Schedule */}
          <Section title="Schedule">
            <div className="space-y-2.5">
              <Row label="Last Out" value={boat.lastOut} ok={true} />
              <Row label="Next Out" value={boat.nextOut} ok={true} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-gray-100" />
        {title}
        <span className="flex-1 h-px bg-gray-100" />
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={ok ? "text-gray-800 font-medium" : "text-red-500 font-medium"}>
        {value}
      </span>
    </div>
  );
}
