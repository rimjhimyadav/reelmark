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

// movies and shows come back with different field names (title vs name),
// so we turn both into the same simple shape that the rest of the app uses
function toItem(result, type) {
  const mediaType = type || result.media_type;
  const date = mediaType === "movie" ? result.release_date : result.first_air_date;

  return {
    id: result.id,
    type: mediaType,
    title: mediaType === "movie" ? result.title : result.name,
    year: date ? date.slice(0, 4) : "",
    date: date || "",
    rating: result.vote_average ? result.vote_average.toFixed(1) : null,
    overview: result.overview,
    poster: result.poster_path,
    backdrop: result.backdrop_path,
    genreIds: result.genre_ids || [],
  };
}

function toItems(data, type) {
  return data.results.filter((result) => result.media_type !== "person").map((result) => toItem(result, type));
}

export async function getTrending() {
  const data = await get("/trending/all/day");
  return toItems(data);
}

export async function getTrendingMovies() {
  const data = await get("/trending/movie/week");
  return toItems(data, "movie");
}

export async function getTrendingShows() {
  const data = await get("/trending/tv/day");
  return toItems(data, "tv");
}

// TMDB has no "anime" category, so we ask for japanese animation (genre 16)
export async function getPopularAnime() {
  const data = await get("/discover/tv", {
    with_genres: 16,
    with_original_language: "ja",
    without_genres: 10762, // skip kids shows like doraemon
    sort_by: "popularity.desc",
  });
  return toItems(data, "tv");
}

export async function getUpcomingMovies() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await get("/discover/movie", {
    "release_date.gte": today,
    sort_by: "popularity.desc",
    region: "IN",
    with_release_type: "2|3", // 2 = in theaters, 3 = wide release
  });
  return toItems(data, "movie");
}
