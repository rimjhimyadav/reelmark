import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Info } from "lucide-react";
import { getSeason, getShowInfo, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { itemKey, useLibrary } from "../store/library";
import { useSettings } from "../store/settings";
import { episodeLabel, getNextEpisode, getProgress } from "../progress";
import { formatDate, formatRuntime } from "../utils";
import PageTitle from "../components/PageTitle";
import ProgressBar from "../components/ProgressBar";

const SORTS = [
  { key: "recent", label: "Last watched" },
  { key: "fewest", label: "Fewest left" },
  { key: "most", label: "Most left" },
  { key: "shortest", label: "Least time left" },
  { key: "longest", label: "Most time left" },
];

// how many episodes are left and how long they take, for "24 left · 9h 36m"
function getLeft(show) {
  const progress = getProgress(show);
  const episodes = progress.aired - progress.watched;
  return { episodes, minutes: episodes * (show.runtime || 40) };
}

function sortShows(shows, sort) {
  const sorted = [...shows];
  if (sort === "recent") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (sort === "fewest") sorted.sort((a, b) => getLeft(a).episodes - getLeft(b).episodes);
  if (sort === "most") sorted.sort((a, b) => getLeft(b).episodes - getLeft(a).episodes);
  if (sort === "shortest") sorted.sort((a, b) => getLeft(a).minutes - getLeft(b).minutes);
  if (sort === "longest") sorted.sort((a, b) => getLeft(b).minutes - getLeft(a).minutes);
  return sorted;
}

export default function UpNext() {
  const items = Object.values(useLibrary((state) => state.items));
  const updateShowInfo = useLibrary((state) => state.updateShowInfo);
  const [sort, setSort] = useState("recent");

  const shows = items.filter((item) => item.type === "tv" && (item.status === "watching" || item.status === "rewatching"));
  const movies = items.filter((item) => item.type === "movie" && item.status === "watching");

  // shows you have an episode ready for, and shows waiting for the next episode
  const ready = sortShows(shows.filter((show) => getNextEpisode(show)), sort);
  const waiting = shows.filter((show) => !getNextEpisode(show) && show.nextAir);

  // a list of ids as text, so the effect below only runs again when a show is added or removed
  const showIds = shows.map((show) => show.id).join(",");

  // new episodes may have come out since you added a show, so ask TMDB again
  useEffect(() => {
    if (!showIds) return;
    for (const id of showIds.split(",")) {
      getShowInfo(id)
        .then((info) => updateShowInfo(itemKey("tv", Number(id)), info))
        .catch(() => {}); // not a big deal, we still have the old info
    }
  }, [showIds, updateShowInfo]);

  return (
    <>
      <PageTitle title="Up Next" text="The next episode of every show you’re watching." />

      {ready.length === 0 && waiting.length === 0 && movies.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">You’re all caught up</h2>
          <p className="mt-1 text-muted">Shows you mark as Watching will show up here with their next episode.</p>
        </div>
      )}

      {ready.length > 1 && (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
          {SORTS.map((item) => (
            <button
              key={item.key}
              onClick={() => setSort(item.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                sort === item.key ? "border-text bg-panel-light text-text" : "border-line text-muted hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {/* the key has the season in it, so the card starts fresh when you move to a new season */}
          {ready.map((show) => (
            <NextEpisodeCard key={show.id + "-" + getNextEpisode(show).season} show={show} />
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Waiting for new episodes</h2>
          <div className="flex flex-col gap-2">
            {waiting.map((show) => (
              <Link
                key={show.id}
                to={`/tv/${show.id}`}
                className="flex items-center gap-4 rounded-xl bg-panel p-2.5 hover:bg-panel-light"
              >
                <img src={imageUrl(show.poster, "w92")} alt="" className="h-18 w-12 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{show.title}</h3>
                  <p className="text-sm text-muted">
                    {episodeLabel(show.nextAir.season, show.nextAir.episode)} comes out {formatDate(show.nextAir.date)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {movies.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Movies you’re watching</h2>
          <div className="flex flex-col gap-2">
            {movies.map((movie) => (
              <MovieRow key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function NextEpisodeCard({ show }) {
  const next = getNextEpisode(show);
  const progress = getProgress(show);
  const left = getLeft(show);
  const setEpisodes = useLibrary((state) => state.setEpisodes);
  const hideSpoilers = useSettings((state) => state.hideSpoilers);

  // the season list has the episode name and picture
  const loadSeason = useCallback(() => getSeason(show.id, next.season), [show.id, next.season]);
  const { data: episodes } = useFetch(loadSeason);
  const episode = episodes ? episodes.find((ep) => ep.number === next.episode) : null;

  const picture = episode && episode.still ? imageUrl(episode.still, "w780") : imageUrl(show.backdrop, "w780");

  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-panel">
      {picture && (
        <img
          src={picture}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            hideSpoilers ? "spoiler" : ""
          }`}
        />
      )}
      {/* dark fade at the bottom so the text is readable on any picture */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

      <Link
        to={`/tv/${show.id}`}
        title="Show details"
        className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white/80 backdrop-blur hover:text-white"
      >
        <Info size={18} />
      </Link>

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">{show.title}</h3>
          <p className="truncate text-sm text-white/80">
            <span className="font-semibold text-accent">{episodeLabel(next.season, next.episode)}</span>
            {episode && " · "}
            {episode && <span className={hideSpoilers ? "spoiler" : ""}>{episode.name}</span>}
          </p>
          <span className="mt-2 inline-block rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white/90 backdrop-blur">
            {left.episodes} left · {formatRuntime(left.minutes)}
          </span>
        </div>

        <button
          onClick={() => setEpisodes(show, next.season, [next.episode], true)}
          title="Mark as watched"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-text transition-transform hover:scale-110"
        >
          <Check size={22} strokeWidth={3} />
        </button>
      </div>

      {/* thin progress line along the bottom edge */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <div className="h-full bg-accent" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}

function MovieRow({ movie }) {
  const setStatus = useLibrary((state) => state.setStatus);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-panel p-2.5">
      <img src={imageUrl(movie.poster, "w92")} alt="" className="h-18 w-12 rounded-md object-cover" />
      <Link to={`/movie/${movie.id}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">
        {movie.title}
      </Link>
      <button
        onClick={() => setStatus(movie, "completed")}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-panel-light px-3 py-2 text-sm font-semibold hover:bg-line"
      >
        <Check size={16} strokeWidth={3} /> Finished
      </button>
    </div>
  );
}
