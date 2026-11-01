import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { discover, getGenres, getProviders } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { CalendarDays, Tv } from "lucide-react";
import PageTitle from "../components/PageTitle";
import Dropdown from "../components/Dropdown";
import PosterCard, { PosterSkeleton } from "../components/PosterCard";

const TYPES = [
  { key: "movie", label: "Movies" },
  { key: "tv", label: "Shows" },
  { key: "anime", label: "Anime" },
];

const SORTS = [
  { key: "popular", label: "Popular" },
  { key: "top", label: "Top rated" },
  { key: "new", label: "Newest" },
];

const DECADES = ["2020", "2010", "2000", "1990", "1980", "1970"];

// the "see all" page of explore: a grid with filters
export default function Browse() {
  // filters live in the url (like /explore/all?type=anime&sort=top) so you can share the link
  // "name" is only for the title, when you come from a mood or streaming tile
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") || "movie";
  const sort = searchParams.get("sort") || "popular";
  const genre = searchParams.get("genre") || "";
  const provider = searchParams.get("provider") || "";
  const decade = searchParams.get("decade") || "";
  const name = searchParams.get("name") || "";

  function changeFilter(filterName, value) {
    const params = { type, sort, genre, provider, decade };
    params[filterName] = value;
    if (filterName === "type") params.genre = ""; // movie and tv genres are different
    // leave empty filters out of the url
    for (const key in params) {
      if (!params[key]) delete params[key];
    }
    setSearchParams(params);
  }

  const typeLabel = TYPES.find((item) => item.key === type).label;

  return (
    <>
      <PageTitle title={name || typeLabel} text="Find something new to watch." />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* same pills as the library toolbar: glass, 44px high, white when picked */}
        <div className="glass flex h-11 items-center gap-1 rounded-full p-1 [--glass-fill:55%]">
          {TYPES.map((item) => (
            <button
              key={item.key}
              onClick={() => changeFilter("type", item.key)}
              className={`h-full rounded-full px-5 text-sm font-semibold transition-colors ${
                type === item.key ? "bg-white text-page shadow-[0_4px_14px_rgb(255_255_255/0.15)]" : "text-text/70 hover:bg-white/10 hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="glass flex h-11 items-center gap-1 rounded-full p-1 [--glass-fill:55%]">
          {SORTS.map((item) => (
            <button
              key={item.key}
              onClick={() => changeFilter("sort", item.key)}
              className={`h-full rounded-full px-4 text-sm font-semibold transition-colors ${
                sort === item.key ? "bg-white/15 text-text" : "text-text/60 hover:bg-white/10 hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <ProviderSelect provider={provider} onChange={(id) => changeFilter("provider", id)} />
        <Dropdown
          value={decade}
          onChange={(value) => changeFilter("decade", value)}
          options={[{ value: "", label: "Any year" }, ...DECADES.map((item) => ({ value: String(item), label: `${item}s` }))]}
          icon={CalendarDays}
          label="Decade"
        />
      </div>

      <GenreChips type={type} genre={genre} onChange={(id) => changeFilter("genre", id)} />

      {/* a new key = a brand new Results, so the list starts from page 1 again */}
      <Results
        key={[type, sort, genre, provider, decade].join("-")}
        type={type}
        sort={sort}
        genre={genre}
        provider={provider}
        decade={decade}
      />
    </>
  );
}

function ProviderSelect({ provider, onChange }) {
  const { data: providers } = useFetch(getProviders);
  return (
    <Dropdown
      value={provider}
      onChange={onChange}
      options={[
        { value: "", label: "All streaming services" },
        ...(providers || []).map((item) => ({ value: String(item.id), label: item.name })),
      ]}
      icon={Tv}
      label="Streaming service"
    />
  );
}

function GenreChips({ type, genre, onChange }) {
  const loadGenres = useCallback(() => getGenres(type), [type]);
  const { data: genres } = useFetch(loadGenres);
  if (!genres) return <div className="h-14" />;

  return (
    <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
      <Chip active={genre === ""} onClick={() => onChange("")}>
        All
      </Chip>
      {genres.map((item) => (
        <Chip key={item.id} active={genre === String(item.id)} onClick={() => onChange(String(item.id))}>
          {item.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
        active ? "bg-white text-page" : "glass text-text/75 [--glass-fill:45%] hover:bg-white/10 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function Results({ type, sort, genre, provider, decade }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const bottomRef = useRef(null);

  // load a page every time "page" goes up
  useEffect(() => {
    let ignore = false;

    discover({ type, sort, genre, provider, decade, page })
      .then((result) => {
        if (ignore) return;
        // popular lists change while you scroll, so a title can come back on the next page
        setItems((oldItems) => {
          const oldIds = oldItems.map((item) => item.id);
          const newItems = result.items.filter((item) => !oldIds.includes(item.id));
          return [...oldItems, ...newItems];
        });
        setHasMore(result.hasMore);
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [type, sort, genre, provider, decade, page]);

  // infinite scroll: when the empty div under the grid gets close to the screen, load the next page
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoading(true);
          setPage(page + 1);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, page]);

  if (!loading && items.length === 0) {
    return (
      <p className="mt-16 text-center text-muted">
        {error ? "Couldn't load this list, try again in a bit." : "Nothing found here."}
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
        {items.map((item) => (
          <PosterCard key={item.id} item={item} />
        ))}
        {loading && [1, 2, 3, 4, 5, 6].map((n) => <PosterSkeleton key={n} />)}
      </div>

      <div ref={bottomRef} />
      {error && items.length > 0 && <p className="mt-8 text-center text-muted">Couldn't load more.</p>}
    </>
  );
}
