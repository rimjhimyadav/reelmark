import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { ExternalLink, Play, Star } from "lucide-react";
import { getDetails, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { formatDate, formatRuntime, plural } from "../utils";
import { itemKey, useLibrary } from "../store/library";
import StarRating from "../components/StarRating";
import TrailerModal from "../components/TrailerModal";
import TrackButton from "../components/TrackButton";
import Episodes from "../components/Episodes";
import { PosterRow } from "../components/Row";
import SectionTitle from "../components/SectionTitle";

// the same page is used for /movie/123 and /tv/456
export default function DetailsPage({ type }) {
  const { id } = useParams();
  // key: when you open another title from "More like this", start fresh
  return <Details key={type + id} type={type} id={id} />;
}

function Details({ type, id }) {
  const loadDetails = useCallback(() => getDetails(type, id), [type, id]);
  const { data: item, error } = useFetch(loadDetails);
  const [showTrailer, setShowTrailer] = useState(false);
  const updateShowInfo = useLibrary((state) => state.updateShowInfo);

  // if you track this title, save the newest info (a new season may be out, the score changes)
  useEffect(() => {
    if (!item) return;
    const info = { tmdbRating: item.rating, releaseDate: item.date };
    if (item.type === "tv") {
      info.seasons = item.seasons;
      info.lastAired = item.lastAired;
      info.nextAir = item.nextAir;
      info.ended = item.ended;
    }
    updateShowInfo(itemKey(item.type, item.id), info);
  }, [item, updateShowInfo]);

  if (error) {
    return <p className="mt-20 text-center text-muted">Couldn't load this title. Maybe the link is wrong?</p>;
  }
  if (!item) {
    return <div className="h-[420px] animate-pulse rounded-2xl bg-panel" />;
  }

  // things like "2026 · 2h 15m" or "2021 · 3 seasons · 61 episodes"
  const facts = [item.year];
  if (type === "movie") {
    facts.push(formatRuntime(item.runtime));
  } else {
    facts.push(plural(item.seasons.length, "season"), plural(item.episodeCount, "episode"));
  }
  if (item.status && item.status !== "Released") facts.push(item.status);

  return (
    <>
      {/* the same picture again, very blurry and dark, behind the whole page.
          it gives the glass panels below some color to blur (a plain blur filter, so it stays fast) */}
      {item.backdrop && (
        <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
          <img src={imageUrl(item.backdrop, "w780")} alt="" className="size-full scale-110 object-cover opacity-50 blur-3xl" />
          <div className="absolute inset-0 bg-page/55" />
        </div>
      )}

      {/* wide image on top, it fades out at the bottom into the blurry one */}
      <div className="relative h-56 overflow-hidden rounded-2xl [mask-image:linear-gradient(to_bottom,black_45%,transparent)] md:h-96">
        {item.backdrop && (
          <img src={imageUrl(item.backdrop, "w1280")} alt="" className="size-full object-cover opacity-70" />
        )}
      </div>

      <div className="relative -mt-24 flex flex-col gap-6 px-2 md:-mt-40 md:flex-row md:gap-10 md:px-8">
        <img
          src={imageUrl(item.poster, "w500")}
          alt={item.title}
          className="w-36 shrink-0 self-start rounded-xl shadow-2xl md:w-60"
        />

        <div className="md:pt-24">
          <h1 className="font-display text-4xl font-extrabold tracking-wide md:text-6xl">{item.title}</h1>
          {item.tagline && <p className="mt-2 text-muted italic">{item.tagline}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {item.rating && (
              <span className="flex items-center gap-1 font-semibold text-text">
                <Star size={15} className="fill-yellow-400 text-yellow-400" />
                {item.rating}
              </span>
            )}
            {facts.filter(Boolean).map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.genres.map((genre) => (
              <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-text/80">
                {genre}
              </span>
            ))}
          </div>

          <p className="mt-5 max-w-3xl leading-relaxed text-text/85">{item.overview}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <TrackButton item={item} />
            {item.trailerKey && (
              <button
                onClick={() => setShowTrailer(true)}
                className="glass inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition-colors hover:bg-white/10"
              >
                <Play size={18} className="fill-current" /> Trailer
              </button>
            )}
            {item.imdbId && (
              <a
                href={`https://www.imdb.com/title/${item.imdbId}/`}
                target="_blank"
                rel="noreferrer"
                className="glass inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition-colors hover:bg-white/10"
              >
                IMDb <ExternalLink size={16} className="text-muted" />
              </a>
            )}
          </div>

          <MyRating item={item} />
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {item.seasons.length > 0 && <Episodes item={item} />}
          {item.cast.length > 0 && <Cast cast={item.cast} />}
          {item.reviews.length > 0 && <Reviews reviews={item.reviews} />}
        </div>
        <WhereToWatch providers={item.streaming} link={item.watchLink} />
      </div>

      {item.recommendations.length > 0 && <PosterRow title="More like this" items={item.recommendations} />}

      {showTrailer && (
        <TrailerModal title={item.title} videoKey={item.trailerKey} onClose={() => setShowTrailer(false)} />
      )}
    </>
  );
}

// only shows up after you add the title to your library
function MyRating({ item }) {
  const key = itemKey(item.type, item.id);
  const saved = useLibrary((state) => state.items[key]);
  const setRating = useLibrary((state) => state.setRating);
  if (!saved) return null;

  return (
    <div className="mt-5 flex items-center gap-3">
      <span className="text-sm text-muted">Your rating</span>
      <StarRating value={saved.rating} onChange={(rating) => setRating(key, rating)} />
    </div>
  );
}

function Cast({ cast }) {
  return (
    <section>
      <SectionTitle title="Who's in it" />
      <div className="no-scrollbar flex gap-4 overflow-x-auto">
        {cast.map((person) => (
          <div key={person.id} className="w-24 shrink-0 text-center">
            <div className="mx-auto size-20 overflow-hidden rounded-full bg-panel-light">
              {person.photo && (
                <img src={imageUrl(person.photo, "w185")} alt={person.name} loading="lazy" className="size-full object-cover" />
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium">{person.name}</p>
            <p className="line-clamp-2 text-xs text-muted">{person.character}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reviews({ reviews }) {
  return (
    <section className="mt-10">
      <SectionTitle title="What people are saying" note="Reviews from TMDB users." />
      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <Review key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}

// long reviews are cut after a few lines until you click "read more"
function Review({ review }) {
  const [open, setOpen] = useState(false);
  const isLong = review.text.length > 400;

  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3">
        {/* first letter of the name as a little avatar */}
        <span className="flex size-9 items-center justify-center rounded-full bg-accent font-bold text-accent-text uppercase">
          {review.author[0]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{review.author}</p>
          <p className="text-xs text-muted">{formatDate(review.date)}</p>
        </div>
        {review.rating && (
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            {review.rating}/10
          </span>
        )}
      </div>

      <p className={`mt-3 text-sm leading-relaxed whitespace-pre-line text-text/85 ${open ? "" : "line-clamp-4"}`}>
        {review.text}
      </p>
      {isLong && (
        <button onClick={() => setOpen(!open)} className="mt-2 text-sm font-semibold text-accent hover:underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </article>
  );
}

function WhereToWatch({ providers, link }) {
  return (
    <aside className="glass self-start rounded-2xl p-5">
      <h2 className="mb-4 text-lg font-bold">Where to watch</h2>

      {providers.length === 0 && <p className="text-sm text-muted">Not streaming in India right now.</p>}

      <div className="flex flex-col gap-3">
        {providers.map((provider) => (
          <a
            key={provider.provider_id}
            href={link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg hover:bg-white/5"
          >
            <img src={imageUrl(provider.logo_path, "w92")} alt="" className="size-10 rounded-lg" />
            <span className="font-medium">{provider.provider_name}</span>
          </a>
        ))}
      </div>

      {/* TMDB asks every app that shows this data to credit JustWatch */}
      <p className="mt-5 text-xs text-muted">Streaming data from JustWatch</p>
    </aside>
  );
}
