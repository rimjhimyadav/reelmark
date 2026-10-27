import { useState } from "react";
import { Link } from "react-router";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import useRefreshShows from "../hooks/useRefreshShows";
import { airingShows, getUpcomingEvents } from "../upcoming";
import { addDays, todayString } from "../utils";
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

      <div className="grid grid-cols-7 gap-2">
        {week.map((day) => {
          const isSelected = day.date === selected;
          let color = day.count > 0 ? "bg-panel-light hover:bg-line" : "bg-panel hover:bg-panel-light";
          let countColor = day.count > 0 ? "font-semibold text-accent" : "text-muted";
          if (isSelected) {
            color = "bg-accent text-accent-text";
            countColor = "font-semibold";
          }

          return (
            <button
              key={day.date}
              onClick={() => toggleDay(day.date)}
              className={`rounded-xl p-2 text-center transition-colors md:p-3 ${color} ${
                day.date === today ? "ring-2 ring-accent ring-offset-2 ring-offset-page" : ""
              }`}
            >
              <p className={`text-xs uppercase ${isSelected ? "opacity-80" : "text-muted"}`}>
                {toDate(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
              </p>
              <p className="mt-1 text-xl font-bold">{toDate(day.date).getDate()}</p>
              <p className={`mt-1 text-xs ${countColor}`}>
                {/* phones only have room for the number */}
                {day.count > 0 ? (
                  <>
                    {day.count}
                    <span className="hidden sm:inline"> new</span>
                  </>
                ) : (
                  "–"
                )}
              </p>
            </button>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">Nothing coming up</h2>
          <p className="mt-1 text-muted">
            Track shows that are still airing, or movies that aren’t out yet, and their dates show up here.
          </p>
        </div>
      )}

      {events.length > 0 && selected && shownEvents.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <h2 className="font-semibold">{dayTitle(selected, today)}</h2>
          <p className="mt-1 text-muted">Nothing from your library comes out on this day.</p>
          <button onClick={() => setSelected(null)} className="mt-3 text-sm font-semibold text-accent hover:underline">
            Show all days
          </button>
        </div>
      )}

      {Object.keys(byDay).map((date) => (
        <section key={date} className="mt-8">
          <h2 className="mb-3 text-lg font-bold">{dayTitle(date, today)}</h2>
          {/* cards, as many as fit in a row */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {byDay[date].map((event) => (
              <EventCard key={event.item.type + event.item.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function EventCard({ event }) {
  const { item } = event;
  return (
    <Link
      to={`/${item.type}/${item.id}`}
      className="group relative flex gap-3 overflow-hidden rounded-xl bg-panel p-3 transition-colors hover:bg-panel-light"
    >
      <img src={imageUrl(item.poster, "w154")} alt="" className="h-24 w-16 shrink-0 rounded-lg object-cover" />
      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-xs font-semibold text-accent">{event.text}</p>
        <h3 className="mt-0.5 line-clamp-2 font-semibold">{item.title}</h3>
        <p className="mt-1 text-xs text-muted">{item.type === "movie" ? "In theaters" : "New episode"}</p>
      </div>
    </Link>
  );
}
