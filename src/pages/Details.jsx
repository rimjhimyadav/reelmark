import { useCallback, useState } from "react";
import { useParams } from "react-router";
import { Play, Star } from "lucide-react";
import { getDetails, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { formatRuntime, plural } from "../utils";
import { itemKey, useLibrary } from "../store/library";
import Modal from "../components/Modal";
import StarRating from "../components/StarRating";
import TrackButton from "../components/TrackButton";
import { PosterRow } from "../components/Row";

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
      {/* wide image on top */}
      <div className="relative h-56 overflow-hidden rounded-2xl bg-panel md:h-96">
        {item.backdrop && (
          <img src={imageUrl(item.backdrop, "w1280")} alt="" className="size-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-page to-transparent" />
      </div>

      <div className="relative -mt-24 flex flex-col gap-6 px-2 md:-mt-40 md:flex-row md:gap-10 md:px-8">
        <img
          src={imageUrl(item.poster, "w500")}
          alt={item.title}
          className="w-36 shrink-0 self-start rounded-xl shadow-2xl md:w-60"
        />

        <div className="md:pt-24">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{item.title}</h1>
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
              <span key={genre} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
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
                className="inline-flex items-center gap-2 rounded-lg bg-panel-light px-5 py-2.5 font-semibold hover:bg-line"
              >
                <Play size={18} className="fill-current" /> Trailer
              </button>
            )}
          </div>

          <MyRating item={item} />
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {item.seasons.length > 0 && <Seasons seasons={item.seasons} />}
          {item.cast.length > 0 && <Cast cast={item.cast} />}
        </div>
        <WhereToWatch providers={item.streaming} link={item.watchLink} />
      </div>

      {item.recommendations.length > 0 && <PosterRow title="More like this" items={item.recommendations} />}

      {showTrailer && (
        <Modal title={`${item.title} trailer`} wide onClose={() => setShowTrailer(false)}>
          <iframe
            src={`https://www.youtube.com/embed/${item.trailerKey}?autoplay=1`}
            title="Trailer"
            allow="autoplay; fullscreen"
            allowFullScreen
            className="aspect-video w-full rounded-lg"
          />
        </Modal>
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

function Seasons({ seasons }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold">Seasons</h2>
      <div className="flex flex-col gap-3">
        {seasons.map((season) => (
          <div key={season.id} className="flex items-center gap-4 rounded-xl bg-panel p-3">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-panel-light">
              {season.poster_path && (
                <img src={imageUrl(season.poster_path, "w185")} alt="" loading="lazy" className="size-full object-cover" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{season.name}</h3>
              <p className="text-sm text-muted">
                {plural(season.episode_count, "episode")}
                {season.air_date && ` · ${season.air_date.slice(0, 4)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cast({ cast }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Cast</h2>
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

function WhereToWatch({ providers, link }) {
  return (
    <aside className="self-start rounded-2xl bg-panel p-5">
      <h2 className="mb-4 text-lg font-bold">Where to watch</h2>

      {providers.length === 0 && <p className="text-sm text-muted">Not streaming in India right now.</p>}

      <div className="flex flex-col gap-3">
        {providers.map((provider) => (
          <a
            key={provider.provider_id}
            href={link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg hover:bg-panel-light"
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
