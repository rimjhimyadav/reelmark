// small helpers to work out how far you are in a show
// a show in the library has:
//   seasons:   [{ number: 1, episodes: 10 }, ...]
//   lastAired: { season: 2, episode: 4 }  (the newest episode that is out)
//   watched:   { "1-1": "2026-10-27T...", "1-2": "..." }  (season-episode: when you watched it)

export function episodeKey(season, episode) {
  return `${season}-${episode}`;
}

// every episode that is already out, in order
export function airedEpisodes(item) {
  const list = [];
  if (!item.lastAired || !item.seasons) return list;

  for (const season of item.seasons) {
    if (season.number > item.lastAired.season) break;

    // in the newest season, only count up to the last episode that aired
    const count = season.number === item.lastAired.season ? item.lastAired.episode : season.episodes;
    for (let episode = 1; episode <= count; episode++) {
      list.push({ season: season.number, episode });
    }
  }
  return list;
}

export function getProgress(item) {
  const aired = airedEpisodes(item);
  const watched = item.watched || {};
  const watchedCount = aired.filter((ep) => watched[episodeKey(ep.season, ep.episode)]).length;

  return {
    watched: watchedCount,
    aired: aired.length,
    percent: aired.length > 0 ? Math.round((watchedCount / aired.length) * 100) : 0,
  };
}

// the first episode that is out but you haven't watched. null = you're caught up
export function getNextEpisode(item) {
  const watched = item.watched || {};
  const next = airedEpisodes(item).find((ep) => !watched[episodeKey(ep.season, ep.episode)]);
  return next || null;
}

// "S2 E5"
export function episodeLabel(season, episode) {
  return `S${season} E${episode}`;
}
