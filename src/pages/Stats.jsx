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
import { Gift } from "lucide-react";
import PageTitle from "../components/PageTitle";
import SectionTitle from "../components/SectionTitle";

export default function Stats() {
  const items = Object.values(useLibrary((state) => state.items));
  const events = getWatchEvents(items);

  if (events.length === 0) {
    return (
      <>
        <PageTitle title="Stats" text="What you’ve been watching." />
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">No stats yet</h2>
          <p className="mt-1 text-muted">Mark a few episodes or movies as watched and your stats will show up here.</p>
          <Link to="/library" className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-text">
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

  const tiles = [
    { label: "Titles tracked", value: items.length },
    { label: "Episodes watched", value: events.filter((e) => e.item.type === "tv").length },
    { label: "Movies watched", value: events.filter((e) => e.item.type === "movie").length },
    { label: "Your average rating", value: averageRating },
    { label: "Current streak", value: plural(streaks.current, "day") },
    { label: "Longest streak", value: plural(streaks.longest, "day") },
  ];

  // only count titles you actually started for the genres
  const startedItems = items.filter((item) => item.status !== "plan");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Stats" text="What you’ve been watching." />
        <Link
          to="/wrapped"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-text hover:opacity-90"
        >
          <Gift size={18} /> Your {new Date().getFullYear()} wrapped
        </Link>
      </div>

      <section className="rounded-2xl bg-panel p-6">
        <h2 className="font-semibold text-muted">Time spent watching</h2>
        <div className="mt-3 flex flex-wrap items-end gap-6">
          <BigNumber value={time.days} label={time.days === 1 ? "day" : "days"} />
          <BigNumber value={time.hours} label={time.hours === 1 ? "hour" : "hours"} />
          <BigNumber value={time.minutes} label={time.minutes === 1 ? "minute" : "minutes"} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Movies {Math.round(movieMinutes / 60)}h · Shows {Math.round(showMinutes / 60)}h · Anime{" "}
          {Math.round(animeMinutes / 60)}h
        </p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl bg-panel p-4">
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="mt-1 text-2xl font-bold">{tile.value}</p>
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

function BigNumber({ value, label }) {
  return (
    <div>
      <span className="text-5xl font-extrabold tracking-tight md:text-6xl">{value}</span>
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
    if (count <= 6) return "bg-accent/80";
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
              className="w-full max-w-12 rounded-t-[4px] bg-accent/80"
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

function GenreList({ genres }) {
  const highest = genres.length > 0 ? genres[0].count : 1;

  return (
    <section className="rounded-2xl bg-panel p-6">
      <SectionTitle title="Top genres" />
      <div className="flex flex-col gap-4">
        {genres.map((genre) => (
          <div key={genre.name}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{genre.name}</span>
              <span className="text-muted">{plural(genre.count, "title")}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-panel-light">
              <div className="h-full rounded-full bg-accent/80" style={{ width: `${(genre.count / highest) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
