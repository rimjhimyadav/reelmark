import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useFetch from "../hooks/useFetch";
import PosterCard, { PosterSkeleton } from "./PosterCard";
import SectionTitle from "./SectionTitle";

// a row that loads its own posters
export default function Row({ load, ...titleProps }) {
  const { data, error } = useFetch(load);
  if (error) return null;
  return <PosterRow {...titleProps} items={data} />;
}

// a title and a list of posters you can scroll sideways
// items = null means it's still loading
export function PosterRow({ label, title, note, items }) {
  const listRef = useRef(null);

  function scroll(direction) {
    // move by almost one screen width, so the next posters come into view
    const distance = listRef.current.clientWidth * 0.8;
    listRef.current.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  return (
    <section className="mt-10">
      <SectionTitle label={label} title={title} note={note}>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => scroll(-1)} className="rounded-full bg-panel-light p-1.5 text-muted hover:text-text">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll(1)} className="rounded-full bg-panel-light p-1.5 text-muted hover:text-text">
            <ChevronRight size={18} />
          </button>
        </div>
      </SectionTitle>

      <div ref={listRef} className="no-scrollbar flex snap-x gap-4 overflow-x-auto">
        {!items && [1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div key={n} className="w-36 shrink-0 md:w-44">
            <PosterSkeleton />
          </div>
        ))}

        {items && items.map((item) => (
          <div key={item.id} className="w-36 shrink-0 snap-start md:w-44">
            <PosterCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
