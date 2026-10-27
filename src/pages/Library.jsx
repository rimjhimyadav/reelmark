import { useState } from "react";
import { Link } from "react-router";
import { LayoutGrid, List, Search, Star } from "lucide-react";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import { STATUSES, getStatus } from "../statuses";
import { episodeLabel, getNextEpisode, getProgress } from "../progress";
import PageTitle from "../components/PageTitle";
import ProgressBar from "../components/ProgressBar";

const TABS = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "Shows" },
  { key: "anime", label: "Anime" },
];

const SORTS = [
  { key: "updated", label: "Recently updated" },
  { key: "title", label: "Title A-Z" },
  { key: "rating", label: "My rating" },
  { key: "year", label: "Release year" },
];

// anime is saved as a "tv" item, so the tabs need a small check
function isInTab(item, tab) {
  if (tab === "all") return true;
  if (tab === "anime") return item.isAnime;
  if (tab === "tv") return item.type === "tv" && !item.isAnime;
  return item.type === tab;
}

function sortItems(items, sort) {
  const sorted = [...items];
  if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
  if (sort === "year") sorted.sort((a, b) => b.year.localeCompare(a.year));
  if (sort === "updated") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sorted;
}

export default function Library() {
  const items = Object.values(useLibrary((state) => state.items));
  const [tab, setTab] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const [text, setText] = useState("");
  const [view, setView] = useState("grid");

  if (items.length === 0) {
    return (
      <>
        <PageTitle title="Library" text="Everything you track, in one place." />
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">Your library is empty</h2>
          <p className="mt-1 text-muted">Open any movie or show and press Track to add it here.</p>
          <Link to="/explore" className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-text">
            Find something to watch
          </Link>
        </div>
      </>
    );
  }

  // first the tab, then the status, then the search box
  const inTab = items.filter((item) => isInTab(item, tab));
  const filtered = inTab.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    return item.title.toLowerCase().includes(text.toLowerCase());
  });
  const shown = sortItems(filtered, sort);

  return (
    <>
      <PageTitle title="Library" text="Everything you track, in one place." />

      <div className="flex rounded-xl bg-panel p-1 sm:inline-flex">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold transition-colors ${
              tab === item.key ? "bg-accent text-accent-text" : "text-muted hover:text-text"
            }`}
          >
            {item.label}
            <span className="ml-1.5 text-xs opacity-60">{items.filter((x) => isInTab(x, item.key)).length}</span>
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        <StatusChip active={status === "all"} onClick={() => setStatus("all")} label="All" count={inTab.length} />
        {STATUSES.map((item) => (
          <StatusChip
            key={item.key}
            status={item}
            active={status === item.key}
            onClick={() => setStatus(item.key)}
            label={item.label}
            count={inTab.filter((x) => x.status === item.key).length}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search your library"
            className="w-full rounded-lg border border-line bg-panel py-2 pr-3 pl-10 outline-none placeholder:text-muted focus:border-muted"
          />
        </div>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-lg border border-line bg-panel px-3 py-2 outline-none"
        >
          {SORTS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-line bg-panel p-0.5">
          <button
            onClick={() => setView("grid")}
            title="Grid"
            className={`rounded-md p-1.5 ${view === "grid" ? "bg-panel-light" : "text-muted"}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setView("list")}
            title="List"
            className={`rounded-md p-1.5 ${view === "list" ? "bg-panel-light" : "text-muted"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {shown.length === 0 && <p className="mt-16 text-center text-muted">Nothing matches these filters.</p>}

      {view === "grid" ? (
        <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {shown.map((item) => (
            <GridCard key={item.type + item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {shown.map((item) => (
            <ListRow key={item.type + item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

// "status" is empty for the "All" chip
function StatusChip({ status, active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
        active ? "border-text bg-panel-light text-text" : "border-line text-muted hover:border-muted hover:text-text"
      }`}
    >
      {status && <status.icon size={15} className={status.text} />}
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}

function GridCard({ item }) {
  const status = getStatus(item.status);
  return (
    <Link to={`/${item.type}/${item.id}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-panel-light">
        <img
          src={imageUrl(item.poster, "w342")}
          alt={item.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* status as a small colored circle, the name shows when you hover it */}
        <span
          title={status.label}
          className={`absolute top-1.5 left-1.5 flex size-7 items-center justify-center rounded-full shadow-lg ring-2 ring-black/30 ${status.badge}`}
        >
          <status.icon size={15} strokeWidth={2.5} />
        </span>

        {item.tmdbRating && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            {item.tmdbRating}
          </span>
        )}
      </div>
      <h3 className="mt-1.5 truncate text-[13px] font-semibold">{item.title}</h3>
      <MyStars rating={item.rating} year={item.year} />
      <ShowProgress item={item} />
    </Link>
  );
}

function ListRow({ item }) {
  const status = getStatus(item.status);
  return (
    <Link to={`/${item.type}/${item.id}`} className="flex items-center gap-4 rounded-xl bg-panel p-2.5 hover:bg-panel-light">
      <img src={imageUrl(item.poster, "w92")} alt="" loading="lazy" className="h-18 w-12 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{item.title}</h3>
        <MyStars rating={item.rating} year={item.year} />
        <div className="max-w-xs">
          <ShowProgress item={item} />
        </div>
      </div>
      <span className={`flex shrink-0 items-center gap-1.5 text-sm font-medium ${status.text}`}>
        <status.icon size={16} /> <span className="hidden sm:inline">{status.label}</span>
      </span>
    </Link>
  );
}

// for shows: "S2 E5 next · 40%" and a bar. movies don't have episodes
function ShowProgress({ item }) {
  if (item.type !== "tv") return null;
  const progress = getProgress(item);
  if (progress.aired === 0) return null;
  // "S1 E1 next · 0%" on something you haven't started is just noise
  if (progress.watched === 0 && item.status !== "watching") return null;

  const next = getNextEpisode(item);
  return (
    <div className="mt-1">
      <p className="mb-1 truncate text-xs text-muted">
        {next ? `${episodeLabel(next.season, next.episode)} next` : "Up to date"} · {progress.percent}%
      </p>
      <ProgressBar percent={progress.percent} className="h-1" />
    </div>
  );
}

// "2021 · ★ 4" (stars only if you rated it)
function MyStars({ rating, year }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted">
      {year}
      {rating > 0 && (
        <>
          {" · "}
          <Star size={11} className="fill-yellow-400 text-yellow-400" /> {rating}
        </>
      )}
    </p>
  );
}
