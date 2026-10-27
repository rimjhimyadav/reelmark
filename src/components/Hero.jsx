import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Info, Star } from "lucide-react";
import { getLogo, getTrending, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";

// big banner on top of home, shows what's trending today
export default function Hero() {
  const { data } = useFetch(getTrending);
  const [current, setCurrent] = useState(0);

  // only keep items that have a wide image, and show the first 8
  const items = data ? data.filter((item) => item.backdrop).slice(0, 8) : [];

  // go to the next one every 8 seconds
  // (current is in the list, so clicking a thumbnail restarts the timer)
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((old) => (old + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length, current]);

  if (items.length === 0) {
    return <div className="h-[420px] animate-pulse rounded-2xl bg-panel md:h-[540px]" />;
  }

  const item = items[current];

  return (
    <section className="relative h-[420px] overflow-hidden rounded-2xl md:h-[540px]">
      <img
        key={item.id}
        src={imageUrl(item.backdrop, "w1280")}
        alt=""
        className="absolute inset-0 size-full animate-[fade_0.6s] object-cover"
      />
      {/* dark fade so the text is easy to read */}
      <div className="absolute inset-0 bg-linear-to-t from-page via-page/50 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-r from-page/80 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 md:p-10">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">#{current + 1} trending today</p>
        {/* key: start fresh for every slide, so we never show the logo of the last one */}
        <HeroTitle key={item.type + item.id} item={item} />

        <div className="mt-3 flex items-center gap-3 text-sm text-muted">
          {item.rating && (
            <span className="flex items-center gap-1 font-semibold text-text">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {item.rating}
            </span>
          )}
          <span>{item.year}</span>
          <span>{item.type === "movie" ? "Movie" : "Show"}</span>
        </div>

        <p className="mt-3 line-clamp-2 max-w-xl text-sm text-text/80 md:line-clamp-3 md:text-base">{item.overview}</p>

        <Link
          to={`/${item.type}/${item.id}`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-text hover:opacity-90"
        >
          <Info size={18} /> More info
        </Link>

        <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto">
          {items.map((thumb, index) => (
            <button
              key={thumb.id}
              onClick={() => setCurrent(index)}
              className={`w-28 shrink-0 overflow-hidden rounded-lg border-2 transition md:w-36 ${
                index === current ? "border-text" : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img src={imageUrl(thumb.backdrop, "w300")} alt={thumb.title} className="aspect-video w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// the title logo if TMDB has one, otherwise the name as text
function HeroTitle({ item }) {
  const loadLogo = useCallback(() => getLogo(item.type, item.id), [item.type, item.id]);
  const { data: logo, error } = useFetch(loadLogo);

  // keep the space empty for a moment instead of showing the text and then swapping it
  if (logo === null && !error) return <div className="mt-2 h-16 md:h-28" />;

  if (logo) {
    return (
      <h1 className="mt-2">
        <img
          src={imageUrl(logo, "w500")}
          alt={item.title}
          className="h-16 max-w-[70%] animate-[fade_0.6s] object-contain object-left md:h-28 md:max-w-md"
        />
      </h1>
    );
  }

  return <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">{item.title}</h1>;
}
