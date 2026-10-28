import { Link } from "react-router";

export default function Logo({ showName = true }) {
  return (
    <Link to="/" title="Reelmark" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-wide">
      {/* same drawing as favicon.svg: a bookmark with a play button cut out of it.
          here the bookmark uses the main color you picked */}
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-panel-light" />
        <path d="M9 6h14v20l-7-5-7 5z" className="fill-accent" />
        <path d="M14 10.5v6.5l5-3.25z" className="fill-panel-light" />
      </svg>
      {showName && "Reelmark"}
    </Link>
  );
}
