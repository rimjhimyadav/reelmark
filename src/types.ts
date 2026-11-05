// the shapes of data the whole app passes around

export type MediaType = "movie" | "tv";

// explore and the "see all" page also have anime, which is a kind of tv show on TMDB
export type BrowseType = MediaType | "anime";

export type StatusKey = "watching" | "plan" | "completed" | "on_hold" | "dropped" | "rewatching";

// a movie or show in a list (search results, rows, recommendations...)
// movies and shows come from TMDB with different field names, api/tmdb.ts turns both into this
export interface Item {
  id: number;
  type: MediaType;
  title: string;
  year: string;
  date: string;
  rating: string | null; // TMDB score like "7.8"
  overview: string;
  poster: string | null;
  backdrop: string | null;
  genreIds: number[];
  trailerKey?: string;
}

export interface Season {
  number: number;
  name: string;
  episodes: number; // how many episodes
  poster: string | null;
  airDate: string | null;
}

// one episode, like season 2 episode 5
export interface EpisodeRef {
  season: number;
  episode: number;
}

export interface NextAir extends EpisodeRef {
  date: string;
}

// what episode tracking needs to know about a show
export interface ShowInfo {
  seasons: Season[];
  lastAired: EpisodeRef | null;
  nextAir: NextAir | null;
  ended: boolean;
}

export interface Episode {
  number: number;
  name: string;
  airDate: string | null;
  runtime: number | null;
  still: string | null;
  overview: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  photo: string | null;
}

export interface Review {
  id: string;
  author: string;
  rating: number | null;
  text: string;
  date: string;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

// everything on the details page
export interface Details extends Item, Partial<Omit<ShowInfo, "seasons">> {
  tagline: string;
  genres: string[];
  isAnime: boolean;
  runtime: number | null;
  status: string;
  episodeCount: number;
  seasons: Season[];
  cast: CastMember[];
  trailerKey?: string;
  streaming: Provider[];
  watchLink: string | null;
  recommendations: Item[];
  reviews: Review[];
  imdbId: string | null;
}

// season-episode ("1-3") -> when you watched it
export type WatchedMap = Record<string, string>;

// a title saved in your library (a small copy of the TMDB info, so library pages work offline)
export interface LibraryItem {
  id: number;
  type: MediaType;
  isAnime?: boolean;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  releaseDate: string;
  genres?: string[];
  tmdbRating: string | null;
  runtime?: number | null;
  // only for shows
  seasons?: Season[];
  lastAired?: EpisodeRef | null;
  nextAir?: NextAir | null;
  ended?: boolean;
  watched: WatchedMap;
  // only for movies
  watchedAt: string | null;
  status: StatusKey;
  rating: number; // your own stars, 0 = not rated
  addedAt: string;
  updatedAt: string;
}

// anything that can be added to the library: a list item or a details page
export type Trackable = Item & Partial<Details>;
