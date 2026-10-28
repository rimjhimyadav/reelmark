import { Link } from "react-router";

export default function Logo({ showName = true }) {
  return (
    <Link to="/" title="Reelmark" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      {/* same drawing as favicon.svg, but here the bookmark uses the main color you picked */}
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-panel" />
        <path d="M10 7h12v18l-6-4-6 4z" className="fill-accent" />
      </svg>
      {showName && "Reelmark"}
    </Link>
  );
}
