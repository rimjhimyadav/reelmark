import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Link } from "react-router";
import { imageUrl } from "../api/tmdb";
import { getNextAirTime } from "../api/tvmaze";
import { useLibrary } from "../store/library";
import useRefreshShows from "../hooks/useRefreshShows";
import { airingShows, getUpcomingEvents } from "../upcoming";
import { addDays, plural, todayString } from "../utils";
import PageTitle from "../components/PageTitle";

// "2026-10-27" -> a date object at noon (noon so timezones can't move it to another day)
function toDate(dateString) {
  return new Date(dateString + "T12:00:00");
}

function dayTitle(dateString, today) {
  if (dateString === today) return "Today";
  if (dateString === addDays(today, 1)) return "Tomorrow";
  return toDate(dateString).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

export default function Calendar() {
  const items = Object.values(useLibrary((state) => state.items));
  const today = todayString();
  const [selected, setSelected] = useState(null); // a date like "2026-10-28", or null for all days

  useRefreshShows(airingShows(items));
  // dropped shows still have dates, but you don't care about them anymore
  const events = getUpcomingEvents(items.filter((item) => item.status !== "dropped"), today);

  // the next 7 days for the strip on top
  const week = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    week.push({ date, count: events.filter((event) => event.date === date).length });
  }

  // click a day to see only that day, click it again to see everything
  function toggleDay(date) {
    setSelected(selected === date ? null : date);
  }
  const shownEvents = selected ? events.filter((event) => event.date === selected) : events;

  // group the list by day: { "2026-10-28": [event, event], ... }
  const byDay = {};
  for (const event of shownEvents) {
    if (!byDay[event.date]) byDay[event.date] = [];
    byDay[event.date].push(event);
  }

  return (
    <>
      <PageTitle title="Calendar" text="New episodes and movie releases from your library." />

      <div className="grid grid-cols-7 gap-1.5 md:gap-3">
        {week.map((day) => {
          const isSelected = day.date === selected;
          const isToday = day.date === today;

          return (
            <button
              key={day.date}
              onClick={() => toggleDay(day.date)}
              className={`relative flex flex-col items-center rounded-3xl px-1 py-3 transition md:py-4 ${
                isSelected
                  ? "bg-white text-page shadow-[0_10px_30px_-10px_rgb(255_255_255/0.4)]"
                  : `glass [--glass-fill:50%] hover:-translate-y-0.5 hover:bg-white/10 ${day.count === 0 ? "text-text/60" : ""}`
              }`}
            >
              <span className={`text-[11px] font-bold tracking-widest uppercase ${isSelected ? "text-page/60" : "text-muted"}`}>
                {isToday ? "Today" : toDate(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
              </span>
              <span className="mt-1 font-display text-3xl font-bold md:text-4xl">{toDate(day.date).getDate()}</span>
              {/* one dot per thing coming out (up to 3), so busy days stand out at a glance */}
              <span className="mt-2 flex h-1.5 gap-1">
                {Array.from({ length: Math.min(day.count, 3) }, (_, i) => (
                  <span key={i} className={`size-1.5 rounded-full ${isSelected ? "bg-page" : "bg-accent shadow-[0_0_6px_var(--color-accent)]"}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="mt-8 glass rounded-3xl p-12 text-center [--glass-fill:50%]">
          <h2 className="text-lg font-semibold">Nothing coming up</h2>
          <p className="mt-1 text-muted">
            Track shows that are still airing, or movies that aren’t out yet, and their dates show up here.
          </p>
        </div>
      )}

      {events.length > 0 && selected && shownEvents.length === 0 && (
        <div className="mt-8 glass rounded-3xl p-10 text-center [--glass-fill:50%]">
          <h2 className="font-semibold">{dayTitle(selected, today)}</h2>
          <p className="mt-1 text-muted">Nothing from your library comes out on this day.</p>
          <button onClick={() => setSelected(null)} className="mt-3 text-sm font-semibold text-accent hover:underline">
            Show all days
          </button>
        </div>
      )}

      {Object.keys(byDay).map((date) => (
        <section key={date} className="mt-8">
          <h2 className="mb-4 flex items-baseline gap-3 text-xl font-bold">
            {dayTitle(date, today)}
            <span className="text-sm font-medium text-muted">{plural(byDay[date].length, "release")}</span>
          </h2>
          {/* cards, as many as fit in a row */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {byDay[date].map((event) => (
              <EventCard key={event.item.type + event.item.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// the exact air time of an episode (from TVmaze), null while loading or if it's unknown
function useAirTime(event) {
  const isEpisode = event.item.type === "tv";
  const [time, setTime] = useState(null);

  useEffect(() => {
    if (!isEpisode) return;
    let active = true;
    getNextAirTime(event.item.id, event.date).then((result) => {
      if (active) setTime(result);
    });
    return () => {
      active = false;
    };
  }, [isEpisode, event.item.id, event.date]);

  return time;
}

// "7:30 PM", plus the day if it lands on a different day where you live than the listed one
// (a 9 PM show in the US is the next morning in India), and "in 3h" when it's close
function timeLabel(time, listedDate) {
  const now = new Date();
  let text = time.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase();

  const localDate = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, "0")}-${String(time.getDate()).padStart(2, "0")}`;
  if (localDate !== listedDate) {
    text = time.toLocaleDateString("en-IN", { weekday: "short" }) + ", " + text;
  }

  const hoursLeft = (time - now) / 3600000;
  let soon = null;
  if (hoursLeft <= 0 && hoursLeft > -1) soon = "Out now";
  else if (hoursLeft > 0 && hoursLeft < 1) soon = `in ${Math.max(1, Math.round(hoursLeft * 60))}m`;
  else if (hoursLeft >= 1 && hoursLeft < 24) soon = `in ${Math.round(hoursLeft)}h`;

  return { text, soon };
}

function EventCard({ event }) {
  const { item } = event;
  const airTime = useAirTime(event);
  const label = airTime ? timeLabel(airTime, event.date) : null;

  return (
    <Link
      to={`/${item.type}/${item.id}`}
      className="group relative flex h-40 items-end overflow-hidden rounded-3xl bg-panel ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-white/25"
    >
      {/* the wide picture fills the card, darker at the bottom where the text is */}
      {item.backdrop && (
        <img
          src={imageUrl(item.backdrop, "w780")}
          alt=""
          loading="lazy"
          onError={(event) => (event.currentTarget.style.display = "none")}
          className="absolute inset-0 size-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-85"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

      {label && (
        <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-page shadow-lg">
          <Clock size={13} />
          {label.text}
          {label.soon && <span className="text-page/60">· {label.soon}</span>}
        </span>
      )}

      <div className="relative flex w-full items-end gap-3 p-3">
        <img src={imageUrl(item.poster, "w154")} alt="" className="h-24 w-16 shrink-0 rounded-xl object-cover shadow-xl ring-1 ring-white/15" />
        <div className="min-w-0 pb-0.5">
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur">
            {event.text}
          </span>
          <h3 className="mt-1.5 line-clamp-1 text-lg font-bold">{item.title}</h3>
          <p className="text-xs text-text/70">{item.type === "movie" ? "In theaters" : "New episode"}</p>
        </div>
      </div>
    </Link>
  );
}
