import { Link } from "react-router";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import useRefreshShows from "../hooks/useRefreshShows";
import { episodeLabel } from "../progress";
import { todayString } from "../utils";
import PageTitle from "../components/PageTitle";

// "2026-10-27" -> a date object at noon (noon so timezones can't move it to another day)
function toDate(dateString) {
  return new Date(dateString + "T12:00:00");
}

function addDays(dateString, amount) {
  const date = toDate(dateString);
  date.setDate(date.getDate() + amount);
  return date.toLocaleDateString("en-CA");
}

function dayTitle(dateString, today) {
  if (dateString === today) return "Today";
  if (dateString === addDays(today, 1)) return "Tomorrow";
  return toDate(dateString).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

export default function Calendar() {
  const items = Object.values(useLibrary((state) => state.items));
  const today = todayString();

  // shows that are still airing, and movies you're waiting for
  const shows = items.filter((item) => item.type === "tv" && !item.ended && item.status !== "dropped");
  useRefreshShows(shows);

  const events = [];
  for (const show of shows) {
    if (show.nextAir && show.nextAir.date >= today) {
      events.push({
        date: show.nextAir.date,
        item: show,
        text: episodeLabel(show.nextAir.season, show.nextAir.episode),
      });
    }
  }
  for (const movie of items.filter((item) => item.type === "movie")) {
    if (movie.releaseDate && movie.releaseDate >= today) {
      events.push({ date: movie.releaseDate, item: movie, text: "Movie release" });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));

  // the next 7 days for the strip on top
  const week = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    week.push({ date, count: events.filter((event) => event.date === date).length });
  }

  // group the list by day: { "2026-10-28": [event, event], ... }
  const byDay = {};
  for (const event of events) {
    if (!byDay[event.date]) byDay[event.date] = [];
    byDay[event.date].push(event);
  }

  return (
    <>
      <PageTitle title="Calendar" text="New episodes and movie releases from your library." />

      <div className="grid grid-cols-7 gap-2">
        {week.map((day) => (
          <div
            key={day.date}
            className={`rounded-xl p-2 text-center md:p-3 ${day.count > 0 ? "bg-panel-light" : "bg-panel"} ${
              day.date === today ? "ring-2 ring-accent" : ""
            }`}
          >
            <p className="text-xs text-muted uppercase">
              {toDate(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
            </p>
            <p className="mt-1 text-xl font-bold">{toDate(day.date).getDate()}</p>
            <p className={`mt-1 text-xs ${day.count > 0 ? "font-semibold text-accent" : "text-muted"}`}>
              {day.count > 0 ? `${day.count} new` : "–"}
            </p>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">Nothing coming up</h2>
          <p className="mt-1 text-muted">
            Track shows that are still airing, or movies that aren’t out yet, and their dates show up here.
          </p>
        </div>
      )}

      {Object.keys(byDay).map((date) => (
        <section key={date} className="mt-8">
          <h2 className="mb-3 text-lg font-bold">{dayTitle(date, today)}</h2>
          <div className="flex flex-col gap-2">
            {byDay[date].map((event) => (
              <Link
                key={event.item.type + event.item.id}
                to={`/${event.item.type}/${event.item.id}`}
                className="flex items-center gap-4 rounded-xl bg-panel p-2.5 hover:bg-panel-light"
              >
                <img src={imageUrl(event.item.poster, "w92")} alt="" className="h-18 w-12 rounded-md object-cover" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{event.item.title}</h3>
                  <p className="text-sm text-muted">{event.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
