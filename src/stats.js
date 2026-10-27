// the math behind the stats page. kept separate from the page so it can be tested

// TMDB doesn't always know how long something is, so we guess
const DEFAULT_EPISODE_MINUTES = 40;
const DEFAULT_MOVIE_MINUTES = 120;

// "2026-10-27T18:30:00Z" -> "2026-10-27" in your own timezone
export function dayKey(date) {
  return new Date(date).toLocaleDateString("en-CA");
}

// every time you watched something (one movie or one episode)
export function getWatchEvents(items) {
  const events = [];
  for (const item of items) {
    if (item.type === "movie") {
      if (item.watchedAt) {
        events.push({ date: item.watchedAt, minutes: item.runtime || DEFAULT_MOVIE_MINUTES, item });
      }
    } else {
      for (const key in item.watched || {}) {
        events.push({ date: item.watched[key], minutes: item.runtime || DEFAULT_EPISODE_MINUTES, item });
      }
    }
  }
  return events;
}

export function totalMinutes(events) {
  let total = 0;
  for (const event of events) total += event.minutes;
  return total;
}

// 1505 minutes -> { days: 1, hours: 1, minutes: 5 }
export function splitMinutes(minutes) {
  return {
    days: Math.floor(minutes / (60 * 24)),
    hours: Math.floor((minutes % (60 * 24)) / 60),
    minutes: minutes % 60,
  };
}

// { "2026-10-27": 3, "2026-10-28": 1 }
export function countByDay(events) {
  const counts = {};
  for (const event of events) {
    const day = dayKey(event.date);
    counts[day] = (counts[day] || 0) + 1;
  }
  return counts;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

// how many days in a row you watched something
export function getStreaks(dayCounts, today = new Date()) {
  // current streak: count back from today. if you haven't watched anything today yet,
  // the streak isn't broken, so we start from yesterday
  let current = 0;
  let day = dayCounts[dayKey(today)] ? today : addDays(today, -1);
  while (dayCounts[dayKey(day)]) {
    current++;
    day = addDays(day, -1);
  }

  // longest streak: go through all the days in order
  const days = Object.keys(dayCounts).sort();
  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    const isNextDay = i > 0 && dayKey(addDays(days[i - 1] + "T12:00:00", 1)) === days[i];
    run = isNextDay ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest };
}

// hours watched in each of the last few months, oldest first
export function hoursPerMonth(events, months = 6, today = new Date()) {
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    result.push({
      key: dayKey(month).slice(0, 7), // "2026-10"
      label: month.toLocaleDateString("en-IN", { month: "short" }),
      minutes: 0,
    });
  }

  for (const event of events) {
    const month = result.find((m) => m.key === dayKey(event.date).slice(0, 7));
    if (month) month.minutes += event.minutes;
  }

  return result.map((month) => ({ ...month, hours: Math.round(month.minutes / 60) }));
}

// the genres you watch the most (counts titles, not episodes)
export function topGenres(items, limit = 6) {
  const counts = {};
  for (const item of items) {
    for (const genre of item.genres || []) {
      counts[genre] = (counts[genre] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// boxes for the heatmap: the last 53 weeks, starting on a sunday
export function heatmapDays(dayCounts, today = new Date()) {
  const start = addDays(today, -364);
  const firstSunday = addDays(start, -start.getDay());

  const days = [];
  for (let day = firstSunday; dayKey(day) <= dayKey(today); day = addDays(day, 1)) {
    const key = dayKey(day);
    days.push({ key, count: dayCounts[key] || 0 });
  }
  return days;
}

// everything for the "wrapped" card: what you watched in one year
export function yearSummary(items, year) {
  const events = getWatchEvents(items).filter((event) => dayKey(event.date).startsWith(String(year)));

  // the show you watched the most episodes of
  const episodesPerShow = {};
  for (const event of events) {
    if (event.item.type === "tv") {
      const key = event.item.id;
      episodesPerShow[key] = (episodesPerShow[key] || 0) + 1;
    }
  }
  let topShow = null;
  for (const event of events) {
    const count = episodesPerShow[event.item.id];
    if (event.item.type === "tv" && (!topShow || count > topShow.episodes)) {
      topShow = { item: event.item, episodes: count };
    }
  }

  // every title you watched something of this year, only once
  const watchedItems = [];
  for (const event of events) {
    if (!watchedItems.includes(event.item)) watchedItems.push(event.item);
  }

  // your 3 favorites: highest rated by you, then by TMDB score
  const favorites = [...watchedItems]
    .sort((a, b) => b.rating - a.rating || (b.tmdbRating || 0) - (a.tmdbRating || 0))
    .slice(0, 3);

  // the month with the most watch time
  const months = hoursPerMonth(events, 12, new Date(year, 11, 1));
  const bestMonth = months.reduce((best, month) => (month.minutes > best.minutes ? month : best), months[0]);

  const genres = topGenres(watchedItems, 1);

  return {
    minutes: totalMinutes(events),
    episodes: events.filter((event) => event.item.type === "tv").length,
    movies: events.filter((event) => event.item.type === "movie").length,
    titles: watchedItems.length,
    topGenre: genres.length > 0 ? genres[0].name : null,
    topShow,
    favorites,
    bestMonth: bestMonth.minutes > 0 ? bestMonth : null,
  };
}
