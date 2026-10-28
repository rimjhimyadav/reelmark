import { Link } from "react-router";
import { Compass, Search } from "lucide-react";
import { getPopularAnime, getTrending, getTrendingMovies, getTrendingShows } from "../api/tmdb";
import { useLibrary } from "../store/library";
import Hero from "../components/Hero";
import Row from "../components/Row";
import ContinueWatching from "../components/ContinueWatching";
import ThisWeek from "../components/ThisWeek";
import TonightPicker from "../components/TonightPicker";
import BecauseYouWatched from "../components/BecauseYouWatched";

// home is about you. finding new stuff is on explore
export default function Home() {
  const hasItems = useLibrary((state) => Object.keys(state.items).length > 0);

  return (
    <>
      <Hero />
      {hasItems ? (
        <>
          <ContinueWatching />
          <ThisWeek />
          <TonightPicker />
          <BecauseYouWatched />
          <Row title="What everyone's watching today" load={getTrending} />
        </>
      ) : (
        // nothing tracked yet (like the first visit), so show popular stuff instead of an empty page
        <>
          <StartTracking />
          <Row title="Movies everyone's watching" load={getTrendingMovies} />
          <Row title="Popular shows today" load={getTrendingShows} />
          <Row title="Popular anime right now" load={getPopularAnime} />
        </>
      )}
    </>
  );
}

function StartTracking() {
  return (
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 md:flex-row md:items-center">
      <div>
        <h2 className="text-lg font-bold">Start tracking what you watch</h2>
        <p className="mt-1 text-muted">
          Add a few movies or shows and this page fills up with your next episodes and picks for you.
        </p>
      </div>
      <div className="flex shrink-0 gap-3 md:ml-auto">
        <Link to="/search" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-text">
          <Search size={18} /> Search
        </Link>
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-lg bg-panel-light px-4 py-2.5 font-semibold hover:bg-line">
          <Compass size={18} /> Explore
        </Link>
      </div>
    </div>
  );
}
