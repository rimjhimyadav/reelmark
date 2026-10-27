// everything that talks to TMDB lives in this file
// docs: https://developer.themoviedb.org/docs

const API_KEY = import.meta.env.VITE_TMDB_KEY;
// api.tmdb.org is the same api, but some indian internet providers (like jio) block api.themoviedb.org
const BASE_URL = "https://api.tmdb.org/3";

// genre ids we need for anime. TMDB has no "anime" type,
// so anime = japanese animation shows (without kids shows)
const ANIMATION = 16;
const KIDS = 10762;

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

export async function getPopularAnime() {
  const data = await get("/discover/tv", {
    with_genres: ANIMATION,
    with_original_language: "ja",
    without_genres: KIDS,
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

// sort options for the explore page
const SORT_PARAMS = {
  popular: { sort_by: "popularity.desc" },
  // without a minimum vote count, a movie with one 10/10 vote would be on top
  top: { sort_by: "vote_average.desc", "vote_count.gte": 300 },
  new: { sort_by: "date.desc", "vote_count.gte": 20 },
};

// used by the explore "see all" page: one page of movies, shows or anime
// genre can be one id ("35") or a few ("35,10751" = has all of them)
// provider is a streaming service id, decade is like 1990
export async function discover({ type, sort, genre, provider, decade, page }) {
  const apiType = type === "movie" ? "movie" : "tv";
  const dateField = apiType === "movie" ? "primary_release_date" : "first_air_date";
  const today = new Date().toISOString().slice(0, 10);

  const params = { ...SORT_PARAMS[sort], page };
  if (params.sort_by === "date.desc") {
    params.sort_by = dateField + ".desc";
    params[dateField + ".lte"] = today; // only things that are already out
  }

  const genres = [];
  if (type === "anime") {
    genres.push(ANIMATION);
    params.with_original_language = "ja";
    params.without_genres = KIDS;
  }
  if (genre) genres.push(genre);
  if (genres.length > 0) params.with_genres = genres.join(",");

  if (provider) {
    params.with_watch_providers = provider;
    params.watch_region = "IN";
    params.with_watch_monetization_types = "flatrate"; // part of the subscription, not rent or buy
  }

  if (decade) {
    params[dateField + ".gte"] = `${decade}-01-01`;
    params[dateField + ".lte"] = `${Number(decade) + 9}-12-31`;
  }

  const data = await get(`/discover/${apiType}`, params);
  return {
    items: toItems(data, apiType),
    // TMDB never gives more than 500 pages
    hasMore: page < Math.min(data.total_pages, 500),
  };
}

// streaming services we show on explore, in the order we want them
const PROVIDER_IDS = [8, 119, 2336, 350, 283, 232, 237, 11]; // netflix, prime, jiohotstar, apple tv, crunchyroll, zee5, sony liv, mubi

export async function getProviders() {
  const data = await get("/watch/providers/movie", { watch_region: "IN" });
  const providers = [];
  for (const id of PROVIDER_IDS) {
    const provider = data.results.find((p) => p.provider_id === id);
    if (provider) providers.push({ id, name: provider.provider_name, logo: provider.logo_path });
  }
  return providers;
}

// well rated movies that not many people have voted on
export async function getHiddenGems() {
  const data = await get("/discover/movie", {
    sort_by: "vote_average.desc",
    "vote_average.gte": 7.5,
    "vote_count.gte": 300,
    "vote_count.lte": 2000,
    // brand new movies get a lot of 10/10 votes from fans in the first weeks, so skip the last year
    "primary_release_date.lte": `${new Date().getFullYear() - 1}-01-01`,
  });
  return toItems(data, "movie");
}

export async function getTopTen() {
  const data = await get("/trending/all/day");
  return toItems(data).slice(0, 10);
}

export async function getGenres(type) {
  const apiType = type === "movie" ? "movie" : "tv";
  const data = await get(`/genre/${apiType}/list`);
  if (type === "anime") {
    // every anime is animation already, kids shows are hidden,
    // and genres like news or talk show have no anime at all
    const skip = ["Animation", "Kids", "News", "Reality", "Talk", "Soap", "Documentary"];
    return data.genres.filter((genre) => !skip.includes(genre.name));
  }
  return data.genres;
}

// one search for movies, shows and anime together
export async function search(query) {
  const data = await get("/search/multi", { query, include_adult: false });
  return toItems(data);
}

// the parts of a show we need for episode tracking
function showInfo(data) {
  const last = data.last_episode_to_air;
  const next = data.next_episode_to_air;

  return {
    // season 0 is "specials", we skip it
    seasons: data.seasons
      .filter((season) => season.season_number > 0)
      .map((season) => ({
        number: season.season_number,
        name: season.name,
        episodes: season.episode_count,
        poster: season.poster_path,
        airDate: season.air_date,
      })),
    lastAired: last ? { season: last.season_number, episode: last.episode_number } : null,
    nextAir: next ? { season: next.season_number, episode: next.episode_number, date: next.air_date } : null,
    ended: data.status === "Ended" || data.status === "Canceled",
  };
}

// fresh episode info for a show you already track (used by up next)
export async function getShowInfo(id) {
  const data = await get(`/tv/${id}`);
  return showInfo(data);
}

// all episodes of one season
export async function getSeason(showId, seasonNumber) {
  const data = await get(`/tv/${showId}/season/${seasonNumber}`);
  return data.episodes.map((episode) => ({
    number: episode.episode_number,
    name: episode.name,
    airDate: episode.air_date,
    runtime: episode.runtime,
    still: episode.still_path,
    overview: episode.overview,
  }));
}

// everything for the details page in one request
// (append_to_response lets us get cast, videos etc. together with the main info)
export async function getDetails(type, id) {
  // for shows, "credits" only has the latest season, "aggregate_credits" has everyone
  const creditsName = type === "movie" ? "credits" : "aggregate_credits";
  const data = await get(`/${type}/${id}`, {
    append_to_response: `${creditsName},videos,watch/providers,recommendations`,
  });

  const item = toItem(data, type);

  // youtube trailer, prefer the official one
  const youtubeVideos = data.videos.results.filter((video) => video.site === "YouTube");
  const trailer =
    youtubeVideos.find((video) => video.type === "Trailer" && video.official) ||
    youtubeVideos.find((video) => video.type === "Trailer") ||
    youtubeVideos[0];

  // where to watch in india. the data comes from JustWatch
  const providersInIndia = data["watch/providers"].results.IN;

  return {
    ...item,
    tagline: data.tagline,
    genres: data.genres.map((genre) => genre.name),
    // same rule as the anime rows: japanese animation
    isAnime: data.original_language === "ja" && data.genres.some((genre) => genre.id === ANIMATION),
    // movies have one runtime, shows have a runtime per episode
    runtime: type === "movie" ? data.runtime : data.episode_run_time[0],
    status: data.status,
    episodeCount: type === "tv" ? data.number_of_episodes : 0,
    ...(type === "tv" ? showInfo(data) : { seasons: [] }),
    cast: data[creditsName].cast.slice(0, 15).map((person) => ({
      id: person.id,
      name: person.name,
      // in aggregate_credits one person can play many roles, we show the first
      character: type === "movie" ? person.character : person.roles[0].character,
      photo: person.profile_path,
    })),
    trailerKey: trailer ? trailer.key : null,
    streaming: providersInIndia && providersInIndia.flatrate ? providersInIndia.flatrate : [],
    watchLink: providersInIndia ? providersInIndia.link : null,
    recommendations: toItems(data.recommendations, type),
  };
}
