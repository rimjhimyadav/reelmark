import { Link } from "react-router";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
      Reelmark
    </Link>
  );
}
