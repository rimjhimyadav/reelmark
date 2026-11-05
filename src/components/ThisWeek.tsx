import { Link } from "react-router";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import useRefreshShows from "../hooks/useRefreshShows";
import { airingShows, getUpcomingEvents } from "../upcoming";
import { addDays, countdown, todayString } from "../utils";
import SectionTitle from "./SectionTitle";

// row on home: new episodes and releases from your library in the next 7 days
export default function ThisWeek() {
  const items = Object.values(useLibrary((state) => state.items)).filter((item) => item.status !== "dropped");
  useRefreshShows(airingShows(items));

  const today = todayString();
  const nextWeek = addDays(today, 7);
  const events = getUpcomingEvents(items, today).filter((event) => event.date <= nextWeek);

  if (events.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionTitle title="New from your shows">
        <Link to="/calendar" className="text-sm font-semibold text-muted hover:text-text">
          Calendar
        </Link>
      </SectionTitle>

      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {events.map((event) => (
          <Link
            key={event.item.type + event.item.id}
            to={`/${event.item.type}/${event.item.id}`}
            className="flex w-64 shrink-0 items-center gap-3 rounded-xl bg-panel p-2.5 hover:bg-panel-light"
          >
            <img src={imageUrl(event.item.poster, "w92")} alt="" className="h-18 w-12 rounded-md object-cover" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-accent">{countdown(event.date, today)}</p>
              <h3 className="truncate font-semibold">{event.item.title}</h3>
              <p className="text-sm text-muted">{event.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
