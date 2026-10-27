import { getPopularAnime, getTrendingMovies, getTrendingShows, getUpcomingMovies } from "../api/tmdb";
import Hero from "../components/Hero";
import Row from "../components/Row";
import ContinueWatching from "../components/ContinueWatching";

export default function Home() {
  return (
    <>
      <Hero />
      <ContinueWatching />
      <Row title="Trending movies" load={getTrendingMovies} />
      <Row title="Popular shows today" load={getTrendingShows} />
      <Row title="Popular anime" load={getPopularAnime} />
      <Row title="Coming soon to theaters" load={getUpcomingMovies} />
    </>
  );
}
