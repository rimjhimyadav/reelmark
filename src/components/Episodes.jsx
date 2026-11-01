import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, ImageOff } from "lucide-react";
import { getSeason, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { itemKey, useLibrary } from "../store/library";
import { useSettings } from "../store/settings";
import { episodeKey, getNextEpisode } from "../progress";
import { formatDate, formatRuntime, plural, todayString } from "../utils";
import ProgressBar from "./ProgressBar";
import SectionTitle from "./SectionTitle";
import Dropdown from "./Dropdown";

// seasons and episodes of a show: a season picker, and the episodes as wide picture cards you scroll sideways
export default function Episodes({ item }) {
  const saved = useLibrary((state) => state.items[itemKey(item.type, item.id)]);
  const watched = saved ? saved.watched : {};

  // open the season you're in right now (or season 1)
  const next = saved ? getNextEpisode(saved) : null;
  const [season, setSeason] = useState(next ? next.season : item.seasons[0].number);

  // "S1 · Kazekage Rescue" with the season poster, and how far you are in it
  const options = item.seasons.map((s) => {
    let watchedHere = 0;
    for (let episode = 1; episode <= s.episodes; episode++) {
      if (watched[episodeKey(s.number, episode)]) watchedHere++;
    }
    const isPlainName = s.name === `Season ${s.number}`;
    return {
      value: s.number,
      label: isPlainName ? s.name : `S${s.number} · ${s.name}`,
      sub: watchedHere > 0 ? `${watchedHere} of ${s.episodes} watched` : plural(s.episodes, "episode"),
      image: s.poster ? imageUrl(s.poster, "w92") : null,
    };
  });

  return (
    <section className="mb-12">
      {/* key: a new season = new list, so the old episodes don't flash */}
      <SeasonEpisodes
        key={season}
        item={item}
        season={season}
        watched={watched}
        picker={<Dropdown value={season} onChange={setSeason} options={options} label="Season" align="right" />}
      />
    </section>
  );
}

function SeasonEpisodes({ item, season, watched, picker }) {
  const setEpisodes = useLibrary((state) => state.setEpisodes);
  const hideSpoilers = useSettings((state) => state.hideSpoilers);
  const loadSeason = useCallback(() => getSeason(item.id, season), [item.id, season]);
  const { data: episodes, error } = useFetch(loadSeason);
  const listRef = useRef(null);

  const today = todayString();
  const aired = episodes ? episodes.filter((episode) => episode.airDate && episode.airDate <= today) : [];
  const watchedCount = aired.filter((episode) => watched[episodeKey(season, episode.number)]).length;
  const allWatched = aired.length > 0 && watchedCount === aired.length;
  const percent = aired.length > 0 ? Math.round((watchedCount / aired.length) * 100) : 0;

  // the first episode you haven't watched yet, the row starts there
  const firstUnwatched = episodes ? episodes.find((episode) => !watched[episodeKey(season, episode.number)]) : null;
  const startAt = firstUnwatched ? firstUnwatched.number : null;

  // once the episodes are in, scroll the row so the next one to watch is the first card
  // (only the row scrolls sideways, the page itself doesn't move)
  useEffect(() => {
    if (!episodes || !startAt || startAt === 1) return;
    const card = listRef.current.querySelector(`[data-episode="${startAt}"]`);
    if (card) listRef.current.scrollLeft = card.offsetLeft - listRef.current.offsetLeft;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the season loads, not after every tick
  }, [episodes]);

  function scroll(direction) {
    listRef.current.scrollBy({ left: direction * listRef.current.clientWidth * 0.8, behavior: "smooth" });
  }

  function toggleSeason() {
    setEpisodes(item, season, aired.map((episode) => episode.number), !allWatched);
  }

  return (
    <>
      <SectionTitle title="Episodes">
        {aired.length > 0 && (
          <button
            onClick={toggleSeason}
            className="glass flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors [--glass-fill:55%] hover:bg-white/10"
          >
            <Check size={16} className={allWatched ? "text-accent" : "text-muted"} />
            {allWatched ? "Unmark season" : "Mark season watched"}
          </button>
        )}
        {picker}
      </SectionTitle>

      {aired.length > 0 && (
        <div className="mb-5 flex items-center gap-4">
          <ProgressBar percent={percent} className="max-w-sm flex-1" />
          <span className="shrink-0 text-sm text-muted">
            <span className="font-semibold text-text">{watchedCount}</span> of {aired.length} watched
          </span>
        </div>
      )}

      {error && <p className="text-muted">Couldn't load the episodes.</p>}

      <div className="group/row relative">
        <div ref={listRef} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
          {!episodes &&
            !error &&
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="w-72 shrink-0 md:w-80">
                <div className="aspect-video animate-pulse rounded-2xl bg-white/5" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/5" />
              </div>
            ))}

          {episodes &&
            episodes.map((episode) => (
              <EpisodeCard
                key={episode.number}
                episode={episode}
                isOut={Boolean(episode.airDate && episode.airDate <= today)}
                isWatched={Boolean(watched[episodeKey(season, episode.number)])}
                isNext={episode.number === startAt}
                hideSpoilers={hideSpoilers}
                onToggle={(value) => setEpisodes(item, season, [episode.number], value)}
              />
            ))}
        </div>

        {/* arrows on the sides, they show up when you hover the row (desktop only) */}
        {episodes && episodes.length > 3 && (
          <>
            <button
              onClick={() => scroll(-1)}
              aria-label="Previous episodes"
              className="glass absolute top-[5.625rem] -left-4 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Next episodes"
              className="glass absolute top-[5.625rem] -right-4 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </>
  );
}

function EpisodeCard({ episode, isOut, isWatched, isNext, hideSpoilers, onToggle }) {
  // blur the picture, name and story of episodes you haven't seen yet (when spoilers are hidden)
  const spoiler = hideSpoilers && !isWatched ? "spoiler" : "";

  return (
    <article data-episode={episode.number} className="group w-72 shrink-0 snap-start md:w-80">
      <div
        className={`relative aspect-video overflow-hidden rounded-2xl bg-white/5 ring-1 transition ${
          isNext ? "ring-2 ring-accent" : "ring-white/10"
        }`}
      >
        {episode.still ? (
          <img
            src={imageUrl(episode.still, "w300")}
            alt=""
            loading="lazy"
            className={`size-full object-cover transition duration-300 group-hover:scale-105 ${isWatched ? "opacity-45 grayscale-[40%]" : ""} ${spoiler}`}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <ImageOff size={26} />
          </div>
        )}
        {/* a soft dark edge at the bottom so the badges stay readable on bright pictures */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />

        <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/55 px-2 py-0.5 text-xs font-bold backdrop-blur">
          E{episode.number}
        </span>
        {isNext && isOut && (
          <span className="absolute top-2.5 left-14 rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-text">Up next</span>
        )}

        <button
          onClick={() => onToggle(!isWatched)}
          disabled={!isOut}
          title={isOut ? (isWatched ? "Mark as not watched" : "Mark as watched") : "Not out yet"}
          aria-label={isWatched ? "Mark as not watched" : "Mark as watched"}
          className={`absolute top-2 right-2 flex size-9 items-center justify-center rounded-full transition ${
            isWatched
              ? "bg-accent text-accent-text shadow-[0_0_16px_var(--color-accent)]"
              : "bg-black/55 text-white/70 backdrop-blur hover:scale-110 hover:bg-white hover:text-page disabled:hidden"
          }`}
        >
          <Check size={17} strokeWidth={3} />
        </button>

        {isOut ? (
          episode.runtime > 0 && (
            <span className="absolute right-2.5 bottom-2.5 rounded-lg bg-black/55 px-2 py-0.5 text-xs font-semibold backdrop-blur">
              {formatRuntime(episode.runtime)}
            </span>
          )
        ) : (
          <span className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-page">
            <Clock size={12} />
            {episode.airDate ? formatDate(episode.airDate) : "TBA"}
          </span>
        )}
      </div>

      <h3 className={`mt-3 truncate font-semibold ${isWatched ? "text-muted" : ""} ${spoiler}`}>{episode.name}</h3>
      {episode.overview && <p className={`mt-1 line-clamp-2 text-sm text-muted ${spoiler}`}>{episode.overview}</p>}
      {isOut && episode.airDate && <p className="mt-1.5 text-xs text-muted/70">{formatDate(episode.airDate)}</p>}
    </article>
  );
}
