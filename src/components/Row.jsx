import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useFetch from "../hooks/useFetch";
import PosterCard, { PosterSkeleton } from "./PosterCard";

// a title and a list of posters you can scroll sideways
export default function Row({ title, load }) {
  const { data, error, loading } = useFetch(load);
  const listRef = useRef(null);

  function scroll(direction) {
    // move by almost one screen width, so the next posters come into view
    const distance = listRef.current.clientWidth * 0.8;
    listRef.current.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  if (error) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => scroll(-1)} className="rounded-full bg-panel-light p-1.5 text-muted hover:text-text">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll(1)} className="rounded-full bg-panel-light p-1.5 text-muted hover:text-text">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={listRef} className="no-scrollbar flex snap-x gap-4 overflow-x-auto">
        {loading && [1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div key={n} className="w-36 shrink-0 md:w-44">
            <PosterSkeleton />
          </div>
        ))}

        {data && data.map((item) => (
          <div key={item.id} className="w-36 shrink-0 snap-start md:w-44">
            <PosterCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
