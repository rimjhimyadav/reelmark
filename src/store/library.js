import { create } from "zustand";
import { persist } from "zustand/middleware";

// "movie-550" or "tv-1399". movies and shows can have the same id, so we add the type
export function itemKey(type, id) {
  return `${type}-${id}`;
}

// your library, saved in localStorage so it's still there after a refresh
// "items" looks like { "tv-1399": { title, poster, status, ... }, "movie-550": {...} }
export const useLibrary = create(
  persist(
    (set) => ({
      items: {},

      // adds the title if it's new, otherwise just changes the status
      setStatus: (item, status) =>
        set((state) => {
          const key = itemKey(item.type, item.id);
          const oldItem = state.items[key];
          const now = new Date().toISOString();

          const newItem = oldItem
            ? { ...oldItem, status, updatedAt: now }
            : {
                id: item.id,
                type: item.type,
                isAnime: item.isAnime,
                title: item.title,
                poster: item.poster,
                year: item.year,
                genres: item.genres,
                runtime: item.runtime,
                status,
                rating: 0,
                addedAt: now,
                updatedAt: now,
              };

          return { items: { ...state.items, [key]: newItem } };
        }),

      remove: (key) =>
        set((state) => {
          const items = { ...state.items };
          delete items[key];
          return { items };
        }),

      setRating: (key, rating) =>
        set((state) => ({
          items: { ...state.items, [key]: { ...state.items[key], rating, updatedAt: new Date().toISOString() } },
        })),
    }),
    { name: "reelmark-library" } // the localStorage key
  )
);
