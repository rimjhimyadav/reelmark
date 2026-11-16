import { Brain, Ghost, Heart, Mountain, Smile, Zap, type LucideIcon } from "lucide-react";

// what a mood means in TMDB terms. genres: "35,10751" = has all of these genres.
// keyword is a TMDB keyword id, for moods that genres can't describe
export interface MoodFilter {
  genres?: string;
  keyword?: string;
}

export interface Mood {
  key: string;
  name: string;
  icon: LucideIcon;
  color: string;
  movie: MoodFilter;
  tv: MoodFilter; // also used for anime, which are tv shows on TMDB
}

// the "what are you in the mood for?" tiles on explore.
// TMDB's movie and tv genres aren't the same (shows have no thriller, horror, romance or sci-fi,
// only "sci-fi & fantasy"), so every mood has a mix for both
export const MOODS: Mood[] = [
  { key: "feel-good", name: "Feel-good", icon: Smile, color: "from-yellow-500/40", movie: { genres: "35,10751" }, tv: { genres: "35,10751" } },
  { key: "mind-bending", name: "Mind-bending", icon: Brain, color: "from-violet-500/40", movie: { genres: "878,9648" }, tv: { genres: "10765,9648,18" } },
  { key: "edge-of-your-seat", name: "Edge of your seat", icon: Zap, color: "from-red-500/40", movie: { genres: "53" }, tv: { genres: "80" } },
  { key: "date-night", name: "Date night", icon: Heart, color: "from-pink-500/40", movie: { genres: "10749,35" }, tv: { genres: "35,18" } },
  // 315058 = the "horror" keyword, tv has no horror genre
  { key: "cant-sleep", name: "Can't sleep after this", icon: Ghost, color: "from-slate-400/40", movie: { genres: "27" }, tv: { keyword: "315058" } },
  { key: "epic-adventures", name: "Epic adventures", icon: Mountain, color: "from-emerald-500/40", movie: { genres: "12,14" }, tv: { genres: "10759,10765" } },
];
