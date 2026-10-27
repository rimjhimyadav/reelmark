# Reelmark

Keep track of the movies, shows and anime you watch. Tick off episodes, see what's next, and look back at how much you've watched.

**Live:** https://rimjhimyadav.github.io/reelmark/

![Home](screenshots/home.jpg)

## Features

- **Home** with what's trending today, plus a "continue watching" row for your shows
- **Explore** movies, shows and anime by popularity, rating or newest, with genre filters and infinite scroll
- **Search** everything at once, open it from anywhere with `Ctrl + K`
- **Details page** with trailer, cast, where to watch in India and similar titles
- **Track** anything as Watching, Plan to watch, Completed, On hold, Dropped or Rewatching, and rate it out of 5
- **Episode tracking** per season. A show moves to Completed by itself when you finish the last episode
- **Up Next** shows the next episode of every show you're watching, one click to mark it watched
- **Stats**: total watch time, streaks, a 12 month activity heatmap, hours per month and top genres
- **Backup**: export your library to a file and import it again (it's all saved in your browser)

| Episodes | Up Next |
| --- | --- |
| ![Details](screenshots/details.jpg) | ![Up Next](screenshots/up-next.jpg) |

| Library | Stats |
| --- | --- |
| ![Library](screenshots/library.jpg) | ![Stats](screenshots/stats.jpg) |

## Built with

- React + Vite
- React Router
- Tailwind CSS
- Zustand (the library is saved to localStorage with its `persist` middleware)
- Vitest for the tracking and stats logic
- [TMDB API](https://developer.themoviedb.org/docs) for all movie and show data

## Some things I had to figure out

- **Anime isn't a type on TMDB.** Anime here means Japanese animation (genre 16 + language `ja`), without kids shows.
- **Working out the next episode.** TMDB tells you the last episode that aired, so `src/progress.js` builds the list of aired episodes from that and finds the first one you haven't watched. This also handles skipped episodes and new seasons coming out.
- **api.themoviedb.org is blocked on Jio** (and some other Indian internet providers), so the app uses `api.tmdb.org`, which is the same API on a different domain.
- **Movies and shows have different field names** (`title` vs `name`, `release_date` vs `first_air_date`), so every result is turned into the same shape in `src/api/tmdb.js` before the rest of the app sees it.

## Run it locally

```bash
npm install
cp .env.example .env   # then put your TMDB API key in .env
npm run dev
```

`npm test` runs the tests, `npm run lint` runs ESLint.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming info comes from JustWatch.
