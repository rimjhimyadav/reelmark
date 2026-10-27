import { useCallback, useState } from "react";
import { Check } from "lucide-react";
import { getSeason } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { itemKey, useLibrary } from "../store/library";
import { useSettings } from "../store/settings";
import { episodeKey, getNextEpisode } from "../progress";
import { formatDate, formatRuntime, todayString } from "../utils";
import ProgressBar from "./ProgressBar";
import SectionTitle from "./SectionTitle";

// seasons and episodes of a show, with a tick for every episode
export default function Episodes({ item }) {
  const saved = useLibrary((state) => state.items[itemKey(item.type, item.id)]);
  const watched = saved ? saved.watched : {};

  // open the season you're in right now (or season 1)
  const next = saved ? getNextEpisode(saved) : null;
  const [season, setSeason] = useState(next ? next.season : item.seasons[0].number);

  return (
    <section className="mb-10">
      <SectionTitle label="Episodes" title="Track your progress" />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {item.seasons.map((s) => {
          let watchedHere = 0;
          for (let episode = 1; episode <= s.episodes; episode++) {
            if (watched[episodeKey(s.number, episode)]) watchedHere++;
          }
          return (
            <button
              key={s.number}
              onClick={() => setSeason(s.number)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                season === s.number ? "bg-accent text-accent-text" : "bg-panel text-muted hover:text-text"
              }`}
            >
              Season {s.number}
              {watchedHere > 0 && <span className="ml-1.5 opacity-60">{watchedHere}/{s.episodes}</span>}
            </button>
          );
        })}
      </div>

      {/* key: a new season = new list, so the old episodes don't flash */}
      <SeasonEpisodes key={season} item={item} season={season} watched={watched} />
    </section>
  );
}

function SeasonEpisodes({ item, season, watched }) {
  const setEpisodes = useLibrary((state) => state.setEpisodes);
  const hideSpoilers = useSettings((state) => state.hideSpoilers);
  const loadSeason = useCallback(() => getSeason(item.id, season), [item.id, season]);
  const { data: episodes, error } = useFetch(loadSeason);
  const [showAll, setShowAll] = useState(false);

  if (error) return <p className="text-muted">Couldn't load the episodes.</p>;
  if (!episodes) return <div className="h-64 animate-pulse rounded-xl bg-panel" />;

  const today = todayString();
  const aired = episodes.filter((episode) => episode.airDate && episode.airDate <= today);
  const watchedCount = aired.filter((episode) => watched[episodeKey(season, episode.number)]).length;
  const allWatched = aired.length > 0 && watchedCount === aired.length;
  const percent = aired.length > 0 ? Math.round((watchedCount / aired.length) * 100) : 0;

  // long seasons (like one piece) would make the page huge, so show 12 first
  const shown = showAll ? episodes : episodes.slice(0, 12);

  function toggleSeason() {
    const numbers = aired.map((episode) => episode.number);
    setEpisodes(item, season, numbers, !allWatched);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-panel">
      <div className="flex flex-wrap items-center gap-4 border-b border-line p-4">
        <div className="min-w-40 flex-1">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted">
              {watchedCount} of {aired.length} watched
            </span>
            <span className="font-semibold">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>

        {aired.length > 0 && (
          <button onClick={toggleSeason} className="rounded-lg bg-panel-light px-4 py-2 text-sm font-semibold hover:bg-line">
            {allWatched ? "Unmark season" : "Mark season watched"}
          </button>
        )}
      </div>

      {shown.map((episode) => {
        const isOut = episode.airDate && episode.airDate <= today;
        const isWatched = Boolean(watched[episodeKey(season, episode.number)]);
        let airText = "TBA";
        if (episode.airDate) airText = isOut ? formatDate(episode.airDate) : `Airs ${formatDate(episode.airDate)}`;

        return (
          <div key={episode.number} className="flex items-center gap-4 border-b border-line/60 px-4 py-3 last:border-0">
            <button
              onClick={() => setEpisodes(item, season, [episode.number], !isWatched)}
              disabled={!isOut}
              title={isOut ? (isWatched ? "Mark as not watched" : "Mark as watched") : "Not out yet"}
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                isWatched
                  ? "border-accent bg-accent text-accent-text"
                  : "border-line text-transparent hover:border-muted hover:text-muted disabled:opacity-40 disabled:hover:border-line disabled:hover:text-transparent"
              }`}
            >
              <Check size={16} strokeWidth={3} />
            </button>

            <span className="w-8 shrink-0 text-sm text-muted">E{episode.number}</span>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate font-medium ${isWatched ? "text-muted" : ""} ${
                  hideSpoilers && !isWatched ? "spoiler" : ""
                }`}
              >
                {episode.name}
              </p>
              {/* on phones the date goes under the name, there's no room next to it */}
              <p className="text-xs text-muted sm:hidden">{airText}</p>
            </div>
            <span className="hidden shrink-0 text-sm text-muted sm:block">{formatRuntime(episode.runtime)}</span>
            <span className="hidden w-32 shrink-0 text-right text-sm text-muted sm:block">{airText}</span>
          </div>
        );
      })}

      {episodes.length > 12 && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-3 text-sm font-semibold text-muted hover:text-text">
          {showAll ? "Show less" : `Show all ${episodes.length} episodes`}
        </button>
      )}
    </div>
  );
}
