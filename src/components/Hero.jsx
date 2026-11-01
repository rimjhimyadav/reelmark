import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, Info, Star } from "lucide-react";
import { backdropSrcSet, getLogo, getTrending, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { useAmbientColor } from "../hooks/usePosterColor";

// big banner on top of home, shows what's trending today
export default function Hero() {
  const { data } = useFetch(getTrending);
  const [current, setCurrent] = useState(0);

  // only keep items that have a wide image, and show the first 8
  const items = data ? data.filter((item) => item.backdrop).slice(0, 8) : [];

  // the whole page glows in the colors of the movie on screen (falls back to the main color)
  const ambient = useAmbientColor(items.length > 0 ? items[current].backdrop : null);
  const glow = ambient || "var(--color-accent)";

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
    return <div className="bleed h-[78vh] min-h-[520px] animate-pulse bg-panel/60" />;
  }

  const item = items[current];

  return (
    <section className="bleed relative h-[78vh] min-h-[520px] md:h-[88vh] md:min-h-[600px]" style={{ "--hero-glow": glow }}>
      {/* the same picture, blurred and dark, keeps going down behind the first rows and fades out,
          so the page below the banner still sits in the colors of the movie */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <img key={item.id} src={imageUrl(item.backdrop, "w780")} alt="" className="size-full scale-125 animate-[fade_1s] object-cover opacity-60 blur-[80px] saturate-150" />
        <div className="absolute inset-0 bg-linear-to-b from-page/20 via-page/50 to-page/75" />
      </div>

      {/* the sharp picture, edge to edge */}
      <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <img
          key={item.id}
          src={imageUrl(item.backdrop, "w1280")}
          srcSet={backdropSrcSet(item.backdrop)}
          sizes="100vw"
          alt=""
          className="absolute inset-0 size-full animate-[fade_0.8s] object-cover object-[center_20%]"
        />
        {/* dark on the left for the text, and a long fade at the bottom into the blurred copy */}
        <div className="absolute inset-0 bg-linear-to-r from-page/85 via-page/35 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-page/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-page/70 to-transparent" />
        {/* a wash of the movie's own color from the bottom left */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-soft-light transition-colors duration-1000"
          style={{ background: `radial-gradient(60% 80% at 0% 100%, ${glow}, transparent 70%)` }}
        />
      </div>

      <div className="relative mx-auto flex h-full max-w-[1800px] flex-col justify-end px-4 pb-14 md:px-10 md:pb-24">
        <p
          className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition-colors duration-1000"
          style={{ color: glow, backgroundColor: `color-mix(in srgb, ${glow} 18%, transparent)` }}
        >
          <span className="size-1.5 animate-pulse rounded-full" style={{ backgroundColor: glow }} />#{current + 1} trending today
        </p>
        {/* key: start fresh for every slide, so we never show the logo of the last one */}
        <HeroTitle key={item.type + item.id} item={item} />

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold">
          {item.rating && (
            <span className="glass flex items-center gap-1.5 rounded-lg px-2.5 py-1 [--glass-fill:45%]">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {item.rating}
              <span className="text-xs text-muted">/10</span>
            </span>
          )}
          {item.year && (
            <span className="glass flex items-center gap-1.5 rounded-lg px-2.5 py-1 [--glass-fill:45%]">
              <CalendarDays size={14} className="text-muted" />
              {item.year}
            </span>
          )}
          <span className="glass rounded-lg px-2.5 py-1 [--glass-fill:45%]">{item.type === "movie" ? "Movie" : "Show"}</span>
        </div>

        <p className="mt-4 line-clamp-2 max-w-2xl text-sm text-text/85 drop-shadow md:line-clamp-3 md:text-lg">{item.overview}</p>

        <div className="mt-7 flex items-center gap-3">
          <Link
            to={`/${item.type}/${item.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-lg font-bold text-page shadow-[0_10px_30px_-10px_rgb(255_255_255/0.5)] transition hover:scale-105"
          >
            <Info size={20} /> More info
          </Link>
        </div>

        {/* dots for each slide, the current one is a longer bar that fills up until the next slide */}
        <div className="glass mt-8 flex w-fit items-center gap-2 self-start rounded-full px-3 py-2.5 [--glass-fill:45%] md:absolute md:right-10 md:bottom-24 md:mt-0 md:self-auto">
          {items.map((thumb, index) => (
            <button
              key={thumb.id}
              onClick={() => setCurrent(index)}
              aria-label={`Show ${thumb.title}`}
              className={`relative h-2 overflow-hidden rounded-full transition-all duration-300 ${
                index === current ? "w-10 bg-white/25" : "w-2 bg-white/50 hover:bg-white"
              }`}
            >
              {index === current && <span key={current} className="absolute inset-y-0 left-0 animate-[grow_8s_linear] rounded-full bg-white" />}
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
  if (logo === null && !error) return <div className="mt-4 h-20 md:h-40" />;

  if (logo) {
    return (
      <h1 className="mt-4">
        <img
          src={imageUrl(logo, "w500")}
          alt={item.title}
          className="max-h-20 w-auto max-w-[75%] animate-[fade_0.6s] object-contain object-left drop-shadow-[0_4px_20px_rgb(0_0_0/0.6)] md:max-h-40 md:max-w-xl"
        />
      </h1>
    );
  }

  return <h1 className="mt-4 max-w-3xl font-display text-5xl font-extrabold tracking-wide uppercase drop-shadow-[0_4px_20px_rgb(0_0_0/0.6)] md:text-8xl">{item.title}</h1>;
}
