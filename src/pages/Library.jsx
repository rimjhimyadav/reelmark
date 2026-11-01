import { useState } from "react";
import { Link } from "react-router";
import { ArrowDownUp, LayoutGrid, List, Search, Star, X } from "lucide-react";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import { STATUSES, getStatus } from "../statuses";
import { episodeLabel, getNextEpisode, getProgress } from "../progress";
import PageTitle from "../components/PageTitle";
import ProgressBar from "../components/ProgressBar";
import Dropdown from "../components/Dropdown";

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
        <div className="glass rounded-3xl p-12 text-center [--glass-fill:50%]">
          <h2 className="text-lg font-semibold">Your library is empty</h2>
          <p className="mt-1 text-muted">Open any movie or show and press Track to add it here.</p>
          <Link to="/explore" className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 font-semibold text-page">
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

      {/* one toolbar: type tabs, search, sort and grid/list. the status chips go under it.
          everything is the same height (h-11), a pill, and the same glass, with white for what's picked */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass flex h-11 w-full items-center gap-1 rounded-full p-1 [--glass-fill:55%] lg:w-auto">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex h-full flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                  active ? "bg-white text-page shadow-[0_4px_14px_rgb(255_255_255/0.15)]" : "text-text/70 hover:bg-white/10 hover:text-text"
                }`}
              >
                {item.label}
                <Count value={items.filter((x) => isInTab(x, item.key)).length} active={active} />
              </button>
            );
          })}
        </div>

        <label className="glass group flex h-11 min-w-52 flex-1 items-center gap-2.5 rounded-full px-4 transition-shadow [--glass-fill:55%] focus-within:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)]">
          <Search size={17} className="shrink-0 text-muted group-focus-within:text-text" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search your library"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          {text && (
            <button onClick={() => setText("")} aria-label="Clear search" className="rounded-full p-1 text-muted hover:bg-white/10 hover:text-text">
              <X size={15} />
            </button>
          )}
        </label>

        <Dropdown
          value={sort}
          onChange={setSort}
          options={SORTS.map((item) => ({ value: item.key, label: item.label }))}
          icon={ArrowDownUp}
          label="Sort by"
          align="right"
        />

        <div className="glass flex h-11 items-center gap-1 rounded-full p-1 [--glass-fill:55%]">
          {[
            { key: "grid", icon: LayoutGrid, label: "Show as grid" },
            { key: "list", icon: List, label: "Show as list" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              title={item.label}
              aria-label={item.label}
              className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                view === item.key ? "bg-white text-page" : "text-muted hover:bg-white/10 hover:text-text"
              }`}
            >
              <item.icon size={17} />
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
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

      {shown.length === 0 && <p className="mt-16 text-center text-muted">Nothing matches these filters.</p>}

      {view === "grid" ? (
        // auto-fill: as many columns as fit, each at least 110px (150px on bigger screens),
        // so the tiles stay the same small size on any screen
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
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

// small round number next to a tab or chip
function Count({ value, active }) {
  return (
    <span
      className={`min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-bold tabular-nums ${
        active ? "bg-page/10 text-page" : "bg-white/10 text-text/70"
      }`}
    >
      {value}
    </span>
  );
}

// "status" is empty for the "All" chip
function StatusChip({ status, active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 shrink-0 items-center gap-2 rounded-full pr-1.5 pl-3.5 text-sm font-semibold whitespace-nowrap transition ${
        active
          ? "bg-white text-page"
          : `glass text-text/80 [--glass-fill:45%] hover:bg-white/10 hover:text-text`
      }`}
    >
      {status && <status.icon size={15} className={active ? "" : status.text} />}
      {label}
      <Count value={count} active={active} />
    </button>
  );
}

function GridCard({ item }) {
  const status = getStatus(item.status);
  const progress = showProgress(item);
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

        {/* progress sits on the bottom edge of the poster, so every card stays the same height */}
        {progress && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${progress.percent}%` }} />
          </div>
        )}
      </div>
      <h3 className="mt-1.5 truncate text-[13px] font-semibold">{item.title}</h3>
      {/* shows you're in the middle of get "S1 E3 next · 67%" instead of the year */}
      {progress ? (
        <p className="truncate text-xs text-muted">{progress.text}</p>
      ) : (
        <MyStars rating={item.rating} year={item.year} />
      )}
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

// for shows: { text: "S2 E5 next · 40%", percent: 40 }, or null. movies don't have episodes
function showProgress(item) {
  if (item.type !== "tv") return null;
  const progress = getProgress(item);
  if (progress.aired === 0) return null;
  // "S1 E1 next · 0%" on something you haven't started is just noise
  if (progress.watched === 0 && item.status !== "watching") return null;

  const next = getNextEpisode(item);
  const nextText = next ? `${episodeLabel(next.season, next.episode)} next` : "Up to date";
  return { text: `${nextText} · ${progress.percent}%`, percent: progress.percent };
}

// the list view has more room, so it gets the text and a bar under it
function ShowProgress({ item }) {
  const progress = showProgress(item);
  if (!progress) return null;
  return (
    <div className="mt-1">
      <p className="mb-1 truncate text-xs text-muted">{progress.text}</p>
      <ProgressBar percent={progress.percent} className="h-1" />
    </div>
  );
}

// "2021 · ★ 4" (stars only if you rated it). this is your own rating,
// the library doesn't show the TMDB score so the two don't get mixed up
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
