// everything that talks to TMDB lives in this file
// docs: https://developer.themoviedb.org/docs
import type { BrowseType, CastMember, Details, Episode, Item, MediaType, Provider, Season, ShowInfo } from "../types";

// the parts of TMDB's answers we use (TMDB sends a lot more)
interface RawResult {
  id: number;
  media_type?: MediaType | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
}

interface RawList {
  results: RawResult[];
  total_pages: number;
}

interface RawVideo {
  site: string;
  type: string;
  official: boolean;
  key: string;
}

interface RawEpisodeRef {
  season_number: number;
  episode_number: number;
  air_date: string;
}

interface RawShow {
  seasons: { season_number: number; name: string; episode_count: number; poster_path: string | null; air_date: string | null }[];
  last_episode_to_air: RawEpisodeRef | null;
  next_episode_to_air: RawEpisodeRef | null;
  status: string;
}

interface RawPerson {
  id: number;
  name: string;
  character?: string;
  roles?: { character: string }[];
  profile_path: string | null;
}

interface RawDetails extends RawResult, RawShow {
  tagline: string;
  genres: { id: number; name: string }[];
  original_language: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  credits?: { cast: RawPerson[] };
  aggregate_credits?: { cast: RawPerson[] };
  videos: { results: RawVideo[] };
  "watch/providers": { results: Record<string, { link: string; flatrate?: Provider[] } | undefined> };
  recommendations: RawList;
  reviews: {
    results: { id: string; author: string; author_details: { rating: number | null }; content: string; created_at: string }[];
  };
  external_ids: ExternalIds;
}

export interface ExternalIds {
  imdb_id: string | null;
  tvdb_id: number | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface StreamingService {
  id: number;
  name: string;
  logo: string;
}

type Params = Record<string, string | number | boolean | undefined>;

const API_KEY = import.meta.env.VITE_TMDB_KEY;
// api.tmdb.org is the same api, but some indian internet providers (like jio) block api.themoviedb.org
const BASE_URL = "https://api.tmdb.org/3";

// genre ids we need for anime. TMDB has no "anime" type,
// so anime = japanese animation shows (without kids shows)
const ANIMATION = 16;
const KIDS = 10762;

// answers we already got, so two parts of a page asking for the same thing only load it once
// (like the explore tiles and the rows under them). it's cleared when you refresh the page
const cache: Record<string, Promise<unknown>> = {};

function get<T>(path: string, params: Params = {}): Promise<T> {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("api_key", API_KEY);
  for (const key in params) {
    const value = params[key];
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const key = url.toString();
  if (!cache[key]) {
    cache[key] = fetch(url).then((response) => {
      if (!response.ok) {
        delete cache[key]; // don't keep errors, so it can try again later
        throw new Error("TMDB request failed: " + response.status);
      }
      return response.json();
    });
  }
  return cache[key] as Promise<T>;
}

// for the big edge-to-edge pictures: lets the browser pick the smallest size that still looks sharp
// (a phone loads the 780px one, ~100 KB, instead of the original, which can be 2-3 MB)
export function backdropSrcSet(path: string | null | undefined) {
  if (!path) return undefined;
  return `${imageUrl(path, "w780")} 780w, ${imageUrl(path, "w1280")} 1280w, ${imageUrl(path, "original")} 2560w`;
}

// TMDB only gives the end of the image link, like "/abc.jpg"
// size can be w185, w342, w500, w780, w1280 or original
export function imageUrl(path: string | null | undefined, size = "w500") {
  if (!path) return undefined;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// movies and shows come back with different field names (title vs name),
// so we turn both into the same simple shape that the rest of the app uses
function toItem(result: RawResult, type?: MediaType): Item {
  const mediaType = type || (result.media_type as MediaType);
  const date = mediaType === "movie" ? result.release_date : result.first_air_date;

  return {
    id: result.id,
    type: mediaType,
    title: (mediaType === "movie" ? result.title : result.name) || "",
    year: date ? date.slice(0, 4) : "",
    date: date || "",
    rating: result.vote_average ? result.vote_average.toFixed(1) : null,
    overview: result.overview,
    poster: result.poster_path,
    backdrop: result.backdrop_path,
    genreIds: result.genre_ids || [],
  };
}

function toItems(data: RawList, type?: MediaType): Item[] {
  return data.results.filter((result) => result.media_type !== "person").map((result) => toItem(result, type));
}

export async function getTrending() {
  const data = await get<RawList>("/trending/all/day");
  return toItems(data);
}

export async function getTrendingMovies() {
  const data = await get<RawList>("/trending/movie/week");
  return toItems(data, "movie");
}

export async function getTrendingShows() {
  const data = await get<RawList>("/trending/tv/day");
  return toItems(data, "tv");
}

export async function getPopularAnime() {
  const data = await get<RawList>("/discover/tv", {
    with_genres: ANIMATION,
    with_original_language: "ja",
    without_genres: KIDS,
    sort_by: "popularity.desc",
  });
  return toItems(data, "tv");
}

export async function getUpcomingMovies() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await get<RawList>("/discover/movie", {
    "release_date.gte": today,
    sort_by: "popularity.desc",
    region: "IN",
    with_release_type: "2|3", // 2 = in theaters, 3 = wide release
  });
  return toItems(data, "movie");
}

// youtube trailer from a list of videos, prefer the official one
function pickTrailer(videos: RawVideo[]) {
  const youtubeVideos = videos.filter((video) => video.site === "YouTube");
  return (
    youtubeVideos.find((video) => video.type === "Trailer" && video.official) ||
    youtubeVideos.find((video) => video.type === "Trailer") ||
    youtubeVideos[0]
  );
}

// TMDB has no "new trailers" list, so we take upcoming movies and ask for each one's videos
export async function getLatestTrailers() {
  const movies = await getUpcomingMovies();
  const withTrailers = await Promise.all(
    movies.slice(0, 12).map(async (movie) => {
      const data = await get<{ results: RawVideo[] }>(`/movie/${movie.id}/videos`, { include_video_language: "en,hi" });
      const trailer = pickTrailer(data.results);
      return trailer ? { ...movie, trailerKey: trailer.key } : null;
    }),
  );
  return withTrailers.filter((movie) => movie !== null);
}

// the "this month" row on explore, params come from seasons.ts
export async function getSeasonalMovies(params: Params) {
  // only decent movies, popular ones can still have a 4/10 score
  const data = await get<RawList>("/discover/movie", { "vote_count.gte": 500, "vote_average.gte": 6.5, ...params });
  return toItems(data, "movie");
}

// "because you watched", TMDB picks titles that are similar
export async function getRecommendations(type: MediaType, id: number) {
  const data = await get<RawList>(`/${type}/${id}/recommendations`);
  return toItems(data, type);
}

// sort options for the explore page
export type SortKey = "popular" | "top" | "new";

const SORT_PARAMS: Record<SortKey, Params> = {
  popular: { sort_by: "popularity.desc" },
  // without a minimum vote count, a movie with one 10/10 vote would be on top
  top: { sort_by: "vote_average.desc", "vote_count.gte": 300 },
  new: { sort_by: "date.desc", "vote_count.gte": 20 },
};

// used by the explore "see all" page: one page of movies, shows or anime
// genre can be one id ("35") or a few ("35,10751" = has all of them)
// provider is a streaming service id, decade is like 1990
export interface DiscoverOptions {
  type: BrowseType;
  sort: SortKey;
  genre?: string | null;
  provider?: string | null;
  decade?: string | null;
  page: number;
}

export async function discover({ type, sort, genre, provider, decade, page }: DiscoverOptions) {
  const apiType = type === "movie" ? "movie" : "tv";
  const dateField = apiType === "movie" ? "primary_release_date" : "first_air_date";
  const today = new Date().toISOString().slice(0, 10);

  const params: Params = { ...SORT_PARAMS[sort], page };
  if (params.sort_by === "date.desc") {
    params.sort_by = dateField + ".desc";
    params[dateField + ".lte"] = today; // only things that are already out
  }

  const genres: (string | number)[] = [];
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

  const data = await get<RawList>(`/discover/${apiType}`, params);
  return {
    items: toItems(data, apiType),
    // TMDB never gives more than 500 pages
    hasMore: page < Math.min(data.total_pages, 500),
  };
}

// streaming services we show on explore, in the order we want them
const PROVIDER_IDS = [8, 119, 2336, 350, 283, 232, 237, 11]; // netflix, prime, jiohotstar, apple tv, crunchyroll, zee5, sony liv, mubi

export async function getProviders() {
  const data = await get<{ results: Provider[] }>("/watch/providers/movie", { watch_region: "IN" });
  const providers: StreamingService[] = [];
  for (const id of PROVIDER_IDS) {
    const provider = data.results.find((p) => p.provider_id === id);
    if (provider) providers.push({ id, name: provider.provider_name, logo: provider.logo_path });
  }
  return providers;
}

// well rated movies that not many people have voted on
export async function getHiddenGems() {
  const data = await get<RawList>("/discover/movie", {
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
  const data = await get<RawList>("/trending/all/day");
  return toItems(data).slice(0, 10);
}

export async function getGenres(type: BrowseType) {
  const apiType = type === "movie" ? "movie" : "tv";
  const data = await get<{ genres: Genre[] }>(`/genre/${apiType}/list`);
  if (type === "anime") {
    // every anime is animation already, kids shows are hidden,
    // and genres like news or talk show have no anime at all
    const skip = ["Animation", "Kids", "News", "Reality", "Talk", "Soap", "Documentary"];
    return data.genres.filter((genre) => !skip.includes(genre.name));
  }
  return data.genres;
}

// one search for movies, shows and anime together
export async function search(query: string) {
  const data = await get<RawList>("/search/multi", { query, include_adult: false });
  return toItems(data);
}

// the official title logo (the stylish text from the poster)
// gives back "" if there isn't one (not null, because useFetch treats null as "still loading")
// we remember logos we already got, so the home banner doesn't ask again when it loops
const savedLogos: Record<string, string> = {};

export async function getLogo(type: MediaType, id: number) {
  const key = type + id;
  if (key in savedLogos) return savedLogos[key];

  // "null" = logos with no language, they usually have no text that needs translating
  const data = await get<{ logos: { iso_639_1: string | null; file_path: string }[] }>(`/${type}/${id}/images`, { include_image_language: "en,null" });
  const logo = data.logos.find((image) => image.iso_639_1 === "en") || data.logos[0];
  savedLogos[key] = logo ? logo.file_path : "";
  return savedLogos[key];
}

// some long anime (like naruto shippuden) number their episodes across the whole show,
// so season 2 starts at E33 instead of E1. the app counts episodes inside each season (1, 2, 3...),
// so this turns TMDB's number into "the how-manyth episode of this season"
function episodeInSeason(episode: RawEpisodeRef, seasons: Season[]) {
  const season = seasons.find((s) => s.number === episode.season_number);
  if (!season || episode.episode_number <= season.episodes) return episode.episode_number;

  const before = seasons.filter((s) => s.number < season.number).reduce((sum, s) => sum + s.episodes, 0);
  // a normal show can also have a new episode that isn't in the count yet, keep those as they are
  if (episode.episode_number <= before) return episode.episode_number;
  return Math.min(episode.episode_number - before, season.episodes);
}

// the parts of a show we need for episode tracking
function showInfo(data: RawShow): ShowInfo {
  const last = data.last_episode_to_air;
  const next = data.next_episode_to_air;

  // season 0 is "specials", we skip it
  const seasons = data.seasons
    .filter((season) => season.season_number > 0)
    .map((season) => ({
      number: season.season_number,
      name: season.name,
      episodes: season.episode_count,
      poster: season.poster_path,
      airDate: season.air_date,
    }));

  return {
    seasons,
    lastAired: last ? { season: last.season_number, episode: episodeInSeason(last, seasons) } : null,
    nextAir: next ? { season: next.season_number, episode: episodeInSeason(next, seasons), date: next.air_date } : null,
    ended: data.status === "Ended" || data.status === "Canceled",
  };
}

// fresh episode info for a show you already track (used by up next)
export async function getShowInfo(id: number | string) {
  const data = await get<RawShow>(`/tv/${id}`);
  return showInfo(data);
}

// all episodes of one season
interface RawEpisode {
  name: string;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  overview: string;
}

export async function getSeason(showId: number, seasonNumber: number): Promise<Episode[]> {
  const data = await get<{ episodes: RawEpisode[] }>(`/tv/${showId}/season/${seasonNumber}`);
  // "number" is the place in the season (1, 2, 3...), not TMDB's episode_number,
  // because some anime keep counting from the last season (see episodeInSeason)
  return data.episodes.map((episode, index) => ({
    number: index + 1,
    name: episode.name,
    airDate: episode.air_date,
    runtime: episode.runtime,
    still: episode.still_path,
    overview: episode.overview,
  }));
}

// everything for the details page in one request
// (append_to_response lets us get cast, videos etc. together with the main info)
export async function getDetails(type: MediaType, id: number): Promise<Details> {
  // for shows, "credits" only has the latest season, "aggregate_credits" has everyone
  const creditsName = type === "movie" ? "credits" : "aggregate_credits";
  const data = await get<RawDetails>(`/${type}/${id}`, {
    append_to_response: `${creditsName},videos,watch/providers,recommendations,reviews,external_ids`,
  });

  const item = toItem(data, type);

  const trailer = pickTrailer(data.videos.results);

  // where to watch in india. the data comes from JustWatch
  const providersInIndia = data["watch/providers"].results.IN;

  return {
    ...item,
    tagline: data.tagline,
    genres: data.genres.map((genre) => genre.name),
    // same rule as the anime rows: japanese animation
    isAnime: data.original_language === "ja" && data.genres.some((genre) => genre.id === ANIMATION),
    // movies have one runtime, shows have a runtime per episode
    runtime: (type === "movie" ? data.runtime : data.episode_run_time?.[0]) ?? null,
    status: data.status,
    episodeCount: type === "tv" ? data.number_of_episodes || 0 : 0,
    ...(type === "tv" ? showInfo(data) : { seasons: [] }),
    cast: (data[creditsName]?.cast || []).slice(0, 15).map((person): CastMember => ({
      id: person.id,
      name: person.name,
      // in aggregate_credits one person can play many roles, we show the first
      character: (type === "movie" ? person.character : person.roles?.[0]?.character) || "",
      photo: person.profile_path,
    })),
    trailerKey: trailer ? trailer.key : undefined,
    streaming: providersInIndia && providersInIndia.flatrate ? providersInIndia.flatrate : [],
    watchLink: providersInIndia ? providersInIndia.link : null,
    recommendations: toItems(data.recommendations, type),
    reviews: data.reviews.results.slice(0, 3).map((review) => ({
      id: review.id,
      author: review.author,
      rating: review.author_details.rating, // out of 10, can be empty
      text: review.content,
      date: review.created_at,
    })),
    imdbId: data.external_ids.imdb_id,
  };
}

// other sites' ids for a title (imdb, tvdb...), used to find the show on TVmaze for air times
export async function getExternalIds(type: MediaType, id: number) {
  return get<ExternalIds>(`/${type}/${id}/external_ids`);
}
