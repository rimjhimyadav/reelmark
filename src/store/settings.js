import { create } from "zustand";
import { persist } from "zustand/middleware";

// small app settings, saved in localStorage like the library
export const useSettings = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: "reelmark-settings" }
  )
);
