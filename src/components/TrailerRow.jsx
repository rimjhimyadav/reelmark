import { useState } from "react";
import { Play } from "lucide-react";
import { getLatestTrailers, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import SectionTitle from "./SectionTitle";
import TrailerModal from "./TrailerModal";

// wide cards for upcoming movies, click one to watch the trailer right here
export default function TrailerRow() {
  const { data: movies } = useFetch(getLatestTrailers);
  const [playing, setPlaying] = useState(null); // the movie whose trailer is open

  if (!movies || movies.length === 0) return null;

  return (
    <section className="mt-10">
      <SectionTitle label="Trailers" title="Watch the newest trailers" note="For movies coming out soon." />

      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto">
        {movies.map((movie) => (
          <button
            key={movie.id}
            onClick={() => setPlaying(movie)}
            className="group relative aspect-video w-72 shrink-0 snap-start overflow-hidden rounded-xl bg-panel-light text-left md:w-80"
          >
            {movie.backdrop && (
              <img
                src={imageUrl(movie.backdrop, "w780")}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            {/* dark at the bottom so the title is easy to read */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

            <span className="absolute top-1/2 left-1/2 flex size-12 -translate-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors group-hover:bg-accent">
              <Play size={20} className="ml-0.5 fill-current" />
            </span>

            <div className="absolute right-3 bottom-3 left-3">
              <h3 className="truncate font-bold">{movie.title}</h3>
              <p className="text-xs text-muted">Trailer</p>
            </div>
          </button>
        ))}
      </div>

      {playing && <TrailerModal title={playing.title} videoKey={playing.trailerKey} onClose={() => setPlaying(null)} />}
    </section>
  );
}
