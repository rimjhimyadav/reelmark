// TMDB only knows the day an episode comes out, not the time.
// TVmaze (free, no key needed) knows the exact time, so we ask it for that one thing.
// docs: https://www.tvmaze.com/api
import { getExternalIds } from "./tmdb";

const BASE_URL = "https://api.tvmaze.com";

// answers we already got (a promise per show), cleared when you refresh the page
const cache = {};

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) return null; // 404 = TVmaze doesn't have this show
  return response.json();
}

// the exact moment the next episode of a TMDB show airs, as a Date, or null if we can't tell.
// "date" is the day TMDB says ("2026-11-07"): we only trust TVmaze if its next episode is that
// same day (give or take one, for timezones), so a different season numbering can't show a wrong time
export function getNextAirTime(tmdbId, date) {
  const key = tmdbId + "-" + date;
  if (!cache[key]) {
    cache[key] = findNextAirTime(tmdbId, date).catch(() => null);
  }
  return cache[key];
}

async function findNextAirTime(tmdbId, date) {
  const ids = await getExternalIds("tv", tmdbId);

  // TVmaze can look a show up by its imdb or tvdb id
  let show = null;
  if (ids.imdb_id) show = await getJson(`${BASE_URL}/lookup/shows?imdb=${ids.imdb_id}`);
  if (!show && ids.tvdb_id) show = await getJson(`${BASE_URL}/lookup/shows?thetvdb=${ids.tvdb_id}`);
  if (!show) return null;

  const withNext = await getJson(`${BASE_URL}/shows/${show.id}?embed=nextepisode`);
  const next = withNext && withNext._embedded && withNext._embedded.nextepisode;
  // some shows only have a day, not a time (airtime is empty), then there's nothing to show
  if (!next || !next.airstamp || !next.airtime) return null;

  const dayDifference = Math.abs(new Date(next.airdate) - new Date(date)) / 86400000;
  if (dayDifference > 1) return null;

  return new Date(next.airstamp);
}
