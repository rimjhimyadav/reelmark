import { create } from "zustand";
import { persist } from "zustand/middleware";
import { airedEpisodes, episodeKey, getProgress } from "../progress";

// "movie-550" or "tv-1399". movies and shows can have the same id, so we add the type
export function itemKey(type, id) {
  return `${type}-${id}`;
}

// what we save when you add a title. we keep a small copy of the TMDB info,
// so the library and stats pages work without loading anything
function newLibraryItem(item, status) {
  const now = new Date().toISOString();
  return {
    id: item.id,
    type: item.type,
    isAnime: item.isAnime,
    title: item.title,
    poster: item.poster,
    backdrop: item.backdrop,
    year: item.year,
    releaseDate: item.date, // for the calendar
    genres: item.genres,
    tmdbRating: item.rating, // the TMDB score. "rating" below is your own stars
    runtime: item.runtime, // for shows this is one episode
    // only for shows
    seasons: item.seasons,
    lastAired: item.lastAired,
    nextAir: item.nextAir,
    ended: item.ended,
    watched: {},
    // only for movies
    watchedAt: null,
    status,
    rating: 0,
    addedAt: now,
    updatedAt: now,
  };
}

// after ticking episodes, move the show to the status that makes sense
function fixStatus(item) {
  if (item.type !== "tv") return item;
  const progress = getProgress(item);

  if (progress.aired > 0 && progress.watched === progress.aired && item.ended) {
    return { ...item, status: "completed" };
  }
  if (progress.watched > 0 && ["plan", "on_hold", "dropped"].includes(item.status)) {
    return { ...item, status: "watching" };
  }
  if (progress.watched < progress.aired && item.status === "completed") {
    return { ...item, status: "watching" };
  }
  return item;
}

// your library, saved in localStorage so it's still there after a refresh
// "items" looks like { "tv-1399": { title, status, watched, ... }, "movie-550": {...} }
export const useLibrary = create(
  persist(
    (set) => ({
      items: {},

      // adds the title if it's new, otherwise just changes the status
      setStatus: (item, status) =>
        set((state) => {
          const key = itemKey(item.type, item.id);
          const now = new Date().toISOString();
          const oldItem = state.items[key] || newLibraryItem(item, status);
          const newItem = { ...oldItem, status, updatedAt: now };

          // "completed" means you've seen everything that is out
          if (status === "completed" && item.type === "movie" && !newItem.watchedAt) {
            newItem.watchedAt = now;
          }
          if (status === "completed" && item.type === "tv") {
            const watched = { ...newItem.watched };
            for (const ep of airedEpisodes(newItem)) {
              const epKey = episodeKey(ep.season, ep.episode);
              if (!watched[epKey]) watched[epKey] = now;
            }
            newItem.watched = watched;
          }

          return { items: { ...state.items, [key]: newItem } };
        }),

      // tick or untick a list of episodes of one season
      // if the show isn't in the library yet, it gets added as "watching"
      setEpisodes: (item, season, episodes, isWatched) =>
        set((state) => {
          const key = itemKey(item.type, item.id);
          const now = new Date().toISOString();
          const oldItem = state.items[key] || newLibraryItem(item, "watching");
          const watched = { ...oldItem.watched };

          for (const episode of episodes) {
            const epKey = episodeKey(season, episode);
            if (isWatched && !watched[epKey]) watched[epKey] = now;
            if (!isWatched) delete watched[epKey];
          }

          const newItem = fixStatus({ ...oldItem, watched, updatedAt: now });
          return { items: { ...state.items, [key]: newItem } };
        }),

      // new seasons come out and scores change, so we refresh the saved info sometimes
      updateShowInfo: (key, info) =>
        set((state) => {
          if (!state.items[key]) return state;
          const newItem = fixStatus({ ...state.items[key], ...info });
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

      // used by settings for import and "delete everything"
      replaceAll: (items) => set({ items }),
    }),
    { name: "reelmark-library" } // the localStorage key
  )
);
