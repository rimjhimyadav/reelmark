import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { getTrending, search } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import PosterCard, { PosterSkeleton } from "../components/PosterCard";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [text, setText] = useState(query);

  // wait until the user stops typing for a moment, then put the text in the url
  // (that way we don't send a request for every single letter)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = text.trim();
      setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [text, setSearchParams]);

  return (
    <>
      <div className="relative mb-8">
        <SearchIcon size={22} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search movies, shows and anime..."
          className="w-full rounded-2xl border border-line bg-panel py-4 pr-12 pl-13 text-lg outline-none placeholder:text-muted focus:border-muted"
        />
        {text && (
          <button
            onClick={() => setText("")}
            title="Clear"
            className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-text"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {query ? <SearchResults key={query} query={query} /> : <TrendingNow />}
    </>
  );
}

function SearchResults({ query }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let ignore = false;
    search(query)
      .then((result) => {
        // results without a poster are mostly junk uploads, so we hide them
        if (!ignore) setItems(result.filter((item) => item.poster));
      })
      .catch(() => {
        if (!ignore) setItems([]);
      });
    return () => {
      ignore = true;
    };
  }, [query]);

  if (items && items.length === 0) {
    return <p className="mt-16 text-center text-muted">No results for "{query}".</p>;
  }

  return (
    <>
      <h2 className="mb-4 text-xl font-bold">Results for "{query}"</h2>
      <Grid items={items} />
    </>
  );
}

// shown before you type anything
function TrendingNow() {
  const { data } = useFetch(getTrending);
  return (
    <>
      <h2 className="mb-4 text-xl font-bold">Trending today</h2>
      <Grid items={data} />
    </>
  );
}

function Grid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
      {items
        ? items.map((item) => <PosterCard key={item.type + item.id} item={item} />)
        : [1, 2, 3, 4, 5, 6].map((n) => <PosterSkeleton key={n} />)}
    </div>
  );
}
