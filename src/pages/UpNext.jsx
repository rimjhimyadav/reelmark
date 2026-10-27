import { useCallback, useEffect } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { getSeason, getShowInfo, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { itemKey, useLibrary } from "../store/library";
import { episodeLabel, getNextEpisode, getProgress } from "../progress";
import { formatDate } from "../utils";
import PageTitle from "../components/PageTitle";
import ProgressBar from "../components/ProgressBar";

export default function UpNext() {
  const items = Object.values(useLibrary((state) => state.items));
  const updateShowInfo = useLibrary((state) => state.updateShowInfo);

  const shows = items.filter((item) => item.type === "tv" && (item.status === "watching" || item.status === "rewatching"));
  const movies = items.filter((item) => item.type === "movie" && item.status === "watching");

  // shows you have an episode ready for, and shows waiting for the next episode
  const ready = shows.filter((show) => getNextEpisode(show));
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

      {ready.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
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
  const setEpisodes = useLibrary((state) => state.setEpisodes);

  // the season list has the episode name and picture
  const loadSeason = useCallback(() => getSeason(show.id, next.season), [show.id, next.season]);
  const { data: episodes } = useFetch(loadSeason);
  const episode = episodes ? episodes.find((ep) => ep.number === next.episode) : null;

  const picture = episode && episode.still ? imageUrl(episode.still, "w500") : imageUrl(show.backdrop, "w780");

  return (
    <div className="flex gap-4 rounded-2xl bg-panel p-3">
      <Link to={`/tv/${show.id}`} className="relative w-40 shrink-0 overflow-hidden rounded-xl bg-panel-light sm:w-56">
        {picture && <img src={picture} alt="" className="aspect-video size-full object-cover" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link to={`/tv/${show.id}`} className="truncate font-bold hover:underline">
          {show.title}
        </Link>
        <p className="truncate text-sm text-muted">
          {episodeLabel(next.season, next.episode)}
          {episode && ` · ${episode.name}`}
        </p>

        <div className="mt-auto flex items-end gap-3 pt-3">
          <div className="flex-1">
            <p className="mb-1 text-xs text-muted">
              {progress.watched} of {progress.aired} episodes
            </p>
            <ProgressBar percent={progress.percent} />
          </div>
          <button
            onClick={() => setEpisodes(show, next.season, [next.episode], true)}
            title="Mark as watched"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-text hover:opacity-90"
          >
            <Check size={16} strokeWidth={3} /> <span className="hidden sm:inline">Watched</span>
          </button>
        </div>
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
