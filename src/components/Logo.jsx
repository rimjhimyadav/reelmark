import { Link } from "react-router";

export default function Logo({ showName = true }) {
  return (
    <Link to="/" title="Reelmark" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
      {showName && "Reelmark"}
    </Link>
  );
}
