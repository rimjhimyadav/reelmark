// everything that talks to TMDB lives in this file
// docs: https://developer.themoviedb.org/docs

const API_KEY = import.meta.env.VITE_TMDB_KEY;
// api.tmdb.org is the same api, but some indian internet providers (like jio) block api.themoviedb.org
const BASE_URL = "https://api.tmdb.org/3";

async function get(path, params = {}) {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("api_key", API_KEY);
  for (const key in params) {
    url.searchParams.set(key, params[key]);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("TMDB request failed: " + response.status);
  }
  return response.json();
}

// TMDB only gives the end of the image link, like "/abc.jpg"
// size can be w185, w342, w500, w780, w1280 or original
export function imageUrl(path, size = "w500") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getTrending() {
  return get("/trending/all/week");
}
