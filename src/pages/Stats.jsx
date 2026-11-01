import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useLibrary } from "../store/library";
import {
  countByDay,
  getStreaks,
  getWatchEvents,
  heatmapDays,
  hoursPerMonth,
  splitMinutes,
  topGenres,
  totalMinutes,
} from "../stats";
import { formatDate, formatRuntime, plural } from "../utils";
import { Clapperboard, Film, Flame, Gift, Layers, Star, Trophy } from "lucide-react";
import PageTitle from "../components/PageTitle";
import SectionTitle from "../components/SectionTitle";

export default function Stats() {
  const items = Object.values(useLibrary((state) => state.items));
  const events = getWatchEvents(items);

  if (events.length === 0) {
    return (
      <>
        <PageTitle title="Stats" text="What you’ve been watching." />
        <div className="glass rounded-3xl p-12 text-center [--glass-fill:50%]">
          <h2 className="text-lg font-semibold">No stats yet</h2>
          <p className="mt-1 text-muted">Mark a few episodes or movies as watched and your stats will show up here.</p>
          <Link to="/library" className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 font-semibold text-page">
            Go to your library
          </Link>
        </div>
      </>
    );
  }

  const time = splitMinutes(totalMinutes(events));
  const dayCounts = countByDay(events);
  const streaks = getStreaks(dayCounts);

  // time split by movies, shows and anime
  const movieMinutes = totalMinutes(events.filter((e) => e.item.type === "movie"));
  const animeMinutes = totalMinutes(events.filter((e) => e.item.isAnime));
  const showMinutes = totalMinutes(events) - movieMinutes - animeMinutes;

  const rated = items.filter((item) => item.rating > 0);
  const averageRating = rated.length > 0 ? (rated.reduce((sum, item) => sum + item.rating, 0) / rated.length).toFixed(1) : "–";

  // every tile gets its own icon and color, so the row isn't six identical boxes
  const tiles = [
    { label: "Titles tracked", value: items.length, icon: Layers, color: "var(--color-accent)" },
    { label: "Episodes watched", value: events.filter((e) => e.item.type === "tv").length, icon: Clapperboard, color: "var(--color-show)" },
    { label: "Movies watched", value: events.filter((e) => e.item.type === "movie").length, icon: Film, color: "var(--color-movie)" },
    { label: "Your average rating", value: averageRating, icon: Star, color: "#facc15" },
    { label: "Current streak", value: plural(streaks.current, "day"), icon: Flame, color: "#fb923c" },
    { label: "Longest streak", value: plural(streaks.longest, "day"), icon: Trophy, color: "#34d399" },
  ];

  const kinds = [
    { label: "Movies", minutes: movieMinutes, color: "var(--color-movie)" },
    { label: "Shows", minutes: showMinutes, color: "var(--color-show)" },
    { label: "Anime", minutes: animeMinutes, color: "var(--color-anime)" },
  ];
  const allMinutes = Math.max(movieMinutes + showMinutes + animeMinutes, 1);

  // only count titles you actually started for the genres
  const startedItems = items.filter((item) => item.status !== "plan");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Stats" text="What you’ve been watching." />
        <Link
          to="/wrapped"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-semibold text-page transition hover:-translate-y-0.5 hover:bg-white/90"
        >
          <Gift size={18} /> Your {new Date().getFullYear()} wrapped
        </Link>
      </div>

      {/* the hero card: soft color blobs behind, gradient numbers, and one bar split into movies, shows and anime */}
      <section className="relative overflow-hidden rounded-2xl bg-panel p-6 md:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative">
          <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Time spent watching</h2>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <BigNumber value={time.days} label={time.days === 1 ? "day" : "days"} />
            <BigNumber value={time.hours} label={time.hours === 1 ? "hour" : "hours"} />
            <BigNumber value={time.minutes} label={time.minutes === 1 ? "minute" : "minutes"} />
          </div>

          <div className="mt-6 flex h-2.5 gap-1 overflow-hidden rounded-full">
            {kinds
              .filter((kind) => kind.minutes > 0)
              .map((kind) => (
                <div key={kind.label} className="h-full rounded-full" style={{ width: `${(kind.minutes / allMinutes) * 100}%`, backgroundColor: kind.color }} />
              ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            {kinds.map((kind) => (
              <span key={kind.label} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: kind.color }} />
                {kind.label} <span className="font-semibold text-text">{Math.round(kind.minutes / 60)}h</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="group relative overflow-hidden rounded-2xl bg-panel p-4 transition duration-300 hover:-translate-y-0.5"
            style={{ "--tile": tile.color }}
          >
            {/* a faint glow of the tile's color in the corner, a bit stronger on hover */}
            <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-(color:--tile) opacity-10 blur-2xl transition-opacity group-hover:opacity-25" />
            <span className="relative inline-flex size-9 items-center justify-center rounded-xl bg-(color:--tile)/15 text-(color:--tile)">
              <tile.icon size={18} />
            </span>
            <p className="relative mt-3 text-sm text-muted">{tile.label}</p>
            <p className="relative mt-0.5 font-display text-3xl font-bold tracking-wide">{tile.value}</p>
          </div>
        ))}
      </div>

      <Heatmap dayCounts={dayCounts} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MonthChart months={hoursPerMonth(events)} />
        <GenreList genres={topGenres(startedItems)} />
      </div>
    </>
  );
}

// counts up from 0 when the page opens (skipped if you asked your system for less motion)
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 0,
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3)))); // fast at first, slow at the end
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function BigNumber({ value, label }) {
  const shown = useCountUp(value);
  return (
    <div>
      <span className="font-display text-6xl font-extrabold tracking-wide tabular-nums md:text-7xl">{shown}</span>
      <span className="ml-2 text-muted">{label}</span>
    </div>
  );
}

// one small box per day, darker = more watched that day (like github's contribution graph)
function Heatmap({ dayCounts }) {
  const days = heatmapDays(dayCounts);
  const [hovered, setHovered] = useState(null);
  const scrollRef = useRef(null);

  // on small screens the heatmap doesn't fit, so start scrolled to today (the right end)
  useEffect(() => {
    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, []);

  function boxColor(count) {
    if (count === 0) return "bg-panel-light";
    if (count === 1) return "bg-accent/30";
    if (count <= 3) return "bg-accent/55";
    if (count <= 6) return "bg-accent";
    return "bg-accent";
  }

  return (
    <section className="mt-4 rounded-2xl bg-panel p-6">
      <SectionTitle title="Your last 12 months">
        <p className="text-sm text-muted">
          {hovered ? `${formatDate(hovered.key)} · ${plural(hovered.count, "thing")} watched` : "Hover or tap a day"}
        </p>
      </SectionTitle>

      <div ref={scrollRef} className="no-scrollbar overflow-x-auto" onMouseLeave={() => setHovered(null)}>
        {/* 7 rows (sunday to saturday), new columns are added for every week.
            auto-cols-fr makes the weeks share the whole width, so the boxes grow to fill the card */}
        <div className="grid w-full min-w-160 auto-cols-fr grid-flow-col grid-rows-7 gap-1">
          {days.map((day) => (
            <div
              key={day.key}
              onMouseEnter={() => setHovered(day)}
              onClick={() => setHovered(day)}
              title={`${formatDate(day.key)}: ${day.count}`}
              className={`aspect-square rounded-[3px] ${boxColor(day.count)} ${
                hovered && hovered.key === day.key ? "ring-1 ring-text" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted">
        Less
        {[0, 1, 2, 4, 7].map((count) => (
          <span key={count} className={`size-3 rounded-[3px] ${boxColor(count)}`} />
        ))}
        More
      </div>
    </section>
  );
}

// hours watched each month, as simple bars with the time on top
function MonthChart({ months }) {
  const highest = Math.max(...months.map((month) => month.minutes), 1);
  const monthsWithTime = months.filter((month) => month.minutes > 0).length;

  return (
    <section className="rounded-2xl bg-panel p-6">
      <SectionTitle title="Hours per month" />

      <div className="flex h-44 items-end gap-3 border-b border-line">
        {months.map((month) => (
          <div key={month.key} className="flex h-full flex-1 flex-col items-center justify-end">
            {month.minutes > 0 && <span className="mb-1 text-xs text-muted">{formatRuntime(month.minutes)}</span>}
            <div
              // thin bars (max 48px), so one busy month doesn't look like a big block
              className={`w-full max-w-12 rounded-t-md bg-accent transition hover:brightness-125 ${month.minutes === highest ? "shadow-[0_0_18px_-2px_var(--color-accent)]" : "opacity-80"}`}
              // at least 2px so an empty month is still visible
              style={{ height: month.minutes > 0 ? `max(4px, ${(month.minutes / highest) * 85}%)` : "2px" }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-3">
        {months.map((month) => (
          <span key={month.key} className="flex-1 text-center text-xs text-muted">
            {month.label}
          </span>
        ))}
      </div>

      {monthsWithTime <= 1 && <p className="mt-4 text-sm text-muted">This chart fills in as you keep watching over the next months.</p>}
    </section>
  );
}

// genre bars cycle through these, so each genre gets its own color
const GENRE_COLORS = ["var(--color-accent)", "var(--color-movie)", "var(--color-show)", "var(--color-anime)", "#34d399", "#fb923c"];

function GenreList({ genres }) {
  const highest = genres.length > 0 ? genres[0].count : 1;

  return (
    <section className="rounded-2xl bg-panel p-6">
      <SectionTitle title="Top genres" />
      <div className="flex flex-col gap-4">
        {genres.map((genre, index) => (
          <div key={genre.name}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{genre.name}</span>
              <span className="text-muted">{plural(genre.count, "title")}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-panel-light">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(genre.count / highest) * 100}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${GENRE_COLORS[index % GENRE_COLORS.length]} 55%, transparent), ${GENRE_COLORS[index % GENRE_COLORS.length]})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
