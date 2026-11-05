import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ACCENT } from "../accents";

// small app settings, saved in localStorage like the library
interface SettingsState {
  accent: string;
  setAccent: (accent: string) => void;
  hideSpoilers: boolean;
  toggleSpoilers: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      accent: DEFAULT_ACCENT,
      setAccent: (accent) => set({ accent }),

      // blur names and pictures of episodes you haven't watched yet
      hideSpoilers: false,
      toggleSpoilers: () => set((state) => ({ hideSpoilers: !state.hideSpoilers })),
    }),
    { name: "reelmark-settings" }
  )
);
