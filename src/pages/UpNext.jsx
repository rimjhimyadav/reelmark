import { useCallback, useState } from "react";
import { Link } from "react-router";
import { Check, Plus } from "lucide-react";
import { getSeason, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import useRefreshShows from "../hooks/useRefreshShows";
import { useLibrary } from "../store/library";
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
  const [sort, setSort] = useState("recent");

  const shows = items.filter((item) => item.type === "tv" && (item.status === "watching" || item.status === "rewatching"));
  const movies = items.filter((item) => item.type === "movie" && item.status === "watching");

  // shows you have an episode ready for, and shows waiting for the next episode
  const ready = sortShows(shows.filter((show) => getNextEpisode(show)), sort);
  const waiting = shows.filter((show) => !getNextEpisode(show) && show.nextAir);

  useRefreshShows(shows);

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

      {/* as many ~300px cards as fit in a row, so they don't get huge on big screens */}
      {ready.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-5 gap-y-8">
          {/* the key has the season in it, so the card starts fresh when you move to a new season */}
          {ready.map((show) => (
            <NextEpisodeCard key={show.id + "-" + getNextEpisode(show).season} show={show} />
          ))}

          {/* last spot in the grid: a shortcut to find something new, so the page doesn't end in empty space */}
          <Link
            to="/explore"
            className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-muted transition-colors hover:border-muted hover:text-text"
          >
            <Plus size={24} />
            <span className="font-semibold">Find another show</span>
          </Link>
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
    <div>
      <Link to={`/tv/${show.id}`} className="group relative block aspect-video overflow-hidden rounded-xl bg-panel">
        {picture && (
          <img
            src={picture}
            alt=""
            className={`absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              hideSpoilers ? "spoiler" : ""
            }`}
          />
        )}

        {/* thin progress line along the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
          <div className="h-full bg-accent" style={{ width: `${progress.percent}%` }} />
        </div>
      </Link>

      {/* the text sits under the picture, so it has room and is easy to read on any picture */}
      <div className="mt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/tv/${show.id}`} className="block truncate font-bold hover:underline">
            {show.title}
          </Link>
          <p className="truncate text-sm text-muted">
            <span className="font-semibold text-accent">{episodeLabel(next.season, next.episode)}</span>
            {episode && " · "}
            {episode && <span className={hideSpoilers ? "spoiler" : ""}>{episode.name}</span>}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {left.episodes} left · {formatRuntime(left.minutes)}
          </p>
        </div>

        <button
          onClick={() => setEpisodes(show, next.season, [next.episode], true)}
          title="Mark as watched"
          aria-label={`Mark ${episodeLabel(next.season, next.episode)} of ${show.title} as watched`}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-text transition-transform hover:scale-110"
        >
          <Check size={18} strokeWidth={3} />
        </button>
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
