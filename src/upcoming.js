import { episodeLabel } from "./progress";

// new episodes and movie releases from your library, from today on, soonest first
// each event is { date, item, text }
export function getUpcomingEvents(items, today) {
  const events = [];

  for (const item of items) {
    if (item.type === "tv" && item.nextAir && item.nextAir.date >= today) {
      events.push({
        date: item.nextAir.date,
        item,
        text: episodeLabel(item.nextAir.season, item.nextAir.episode),
      });
    }
    if (item.type === "movie" && item.releaseDate && item.releaseDate >= today) {
      events.push({ date: item.releaseDate, item, text: "Movie release" });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// shows we should ask TMDB about again, because they're still airing
export function airingShows(items) {
  return items.filter((item) => item.type === "tv" && !item.ended && item.status !== "dropped");
}
