"use client";

import { createContext, useContext } from "react";
import type { CleaningStage } from "./data";

// Shared, session-live fleet state (cleaning workflow + which boats go out today).
// Provided by the fleet page; consumed by MapView, ListView, BoatModal.
export interface FleetState {
  cleaning: Record<string, CleaningStage>;
  cleanStamp: Record<string, { by: string; date: string }>;
  cycleClean: (id: string) => void;
  outToday: Set<string>;
}

export const FleetCtx = createContext<FleetState | null>(null);
export const useFleet = () => useContext(FleetCtx);
