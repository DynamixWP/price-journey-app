import { create } from "zustand";

interface JourneyMapState {
  selectedExpeditionId: string | null;
  setSelectedExpeditionId: (expeditionId: string | null) => void;
}

export const useJourneyMapStore = create<JourneyMapState>((set) => ({
  selectedExpeditionId: null,
  setSelectedExpeditionId: (expeditionId) => set({ selectedExpeditionId: expeditionId }),
}));

