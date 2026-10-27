import { Link } from "react-router";
import { Star } from "lucide-react";
import { imageUrl } from "../api/tmdb";

export default function PosterCard({ item }) {
  return (
    <Link to={`/${item.type}/${item.id}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-panel-light">
        {item.poster ? (
          <img
            src={imageUrl(item.poster, "w342")}
            alt={item.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center p-3 text-center text-sm text-muted">{item.title}</div>
        )}

        {item.rating && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold backdrop-blur">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            {item.rating}
          </span>
        )}

        {/* extra tag at the bottom, like "In 3 days" on upcoming movies */}
        {item.badge && (
          <span className="absolute bottom-2 left-2 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-text">
            {item.badge}
          </span>
        )}
      </div>

      <h3 className="mt-2 truncate text-sm font-semibold">{item.title}</h3>
      <p className="text-xs text-muted">
        {item.year} · {item.type === "movie" ? "Movie" : "Show"}
      </p>
    </Link>
  );
}

// grey boxes while posters are loading
export function PosterSkeleton() {
  return (
    <div>
      <div className="aspect-2/3 animate-pulse rounded-xl bg-panel-light" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-panel-light" />
      <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-panel-light" />
    </div>
  );
}
