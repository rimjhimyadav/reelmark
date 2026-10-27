import { Link } from "react-router";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import { episodeLabel, getNextEpisode, getProgress } from "../progress";
import ProgressBar from "./ProgressBar";

// row on home with the shows you're in the middle of
export default function ContinueWatching() {
  const items = Object.values(useLibrary((state) => state.items));

  const shows = items
    .filter((item) => item.type === "tv" && (item.status === "watching" || item.status === "rewatching"))
    .filter((item) => getNextEpisode(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // last watched first

  if (shows.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Continue watching</h2>
        <Link to="/up-next" className="text-sm font-semibold text-muted hover:text-text">
          See all
        </Link>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto">
        {shows.map((show) => {
          const next = getNextEpisode(show);
          const progress = getProgress(show);
          return (
            <Link key={show.id} to={`/tv/${show.id}`} className="group w-64 shrink-0 md:w-72">
              <div className="aspect-video overflow-hidden rounded-xl bg-panel-light">
                {show.backdrop && (
                  <img
                    src={imageUrl(show.backdrop, "w780")}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <ProgressBar percent={progress.percent} className="mt-2 h-1" />
              <h3 className="mt-2 truncate font-semibold">{show.title}</h3>
              <p className="text-sm text-muted">{episodeLabel(next.season, next.episode)} is next</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
