import { Link } from "react-router";
import { ArrowRight, Brain, Clapperboard, Ghost, Heart, Mountain, Smile, Sparkles, Tv, Zap } from "lucide-react";
import {
  getGenres,
  getHiddenGems,
  getPopularAnime,
  getProviders,
  getSeasonalMovies,
  getTopTen,
  getTrendingMovies,
  getTrendingShows,
  getUpcomingMovies,
  imageUrl,
} from "../api/tmdb";
import { getSeason } from "../seasons";
import { countdown } from "../utils";
import useFetch from "../hooks/useFetch";
import PageTitle from "../components/PageTitle";
import Row from "../components/Row";
import SectionTitle from "../components/SectionTitle";
import TrailerRow from "../components/TrailerRow";

// "see all" links go to the browse page with filters in the url
function browseLink(filters) {
  return "/explore/all?" + new URLSearchParams(filters).toString();
}

// "load" gives the posters shown behind each tile
const TYPES = [
  { label: "Movies", icon: Clapperboard, filters: { type: "movie" }, load: getTrendingMovies },
  { label: "Shows", icon: Tv, filters: { type: "tv" }, load: getTrendingShows },
  { label: "Anime", icon: Sparkles, filters: { type: "anime" }, load: getPopularAnime },
];

// moods are just genre mixes. a comma means "has all of these genres"
const MOODS = [
  { name: "Feel-good", genre: "35,10751", icon: Smile, color: "from-yellow-500/40" },
  { name: "Mind-bending", genre: "878,9648", icon: Brain, color: "from-violet-500/40" },
  { name: "Edge of your seat", genre: "53", icon: Zap, color: "from-red-500/40" },
  { name: "Date night", genre: "10749,35", icon: Heart, color: "from-pink-500/40" },
  { name: "Can't sleep after this", genre: "27", icon: Ghost, color: "from-slate-400/40" },
  { name: "Epic adventures", genre: "12,14", icon: Mountain, color: "from-emerald-500/40" },
];

const DECADES = ["1970", "1980", "1990", "2000", "2010", "2020"];

// background colors for the genre tiles, they just repeat
const GENRE_COLORS = [
  "from-sky-600/50",
  "from-orange-600/50",
  "from-emerald-600/50",
  "from-fuchsia-600/50",
  "from-amber-600/50",
  "from-rose-600/50",
  "from-teal-600/50",
  "from-indigo-600/50",
];

export default function Explore() {
  return (
    <>
      <PageTitle title="Explore" text="Find something new to watch." />

      <div className="grid grid-cols-3 gap-3">
        {TYPES.map((item) => (
          <TypeTile key={item.label} item={item} />
        ))}
      </div>

      <Row title={season.title} note={season.note} load={getThisSeason} />
      <TopTen />
      <TrailerRow />
      <Row title="Movies everyone's watching" load={getTrendingMovies} />
      <Row title="Popular shows today" load={getTrendingShows} />
      <Row
        title="New in theaters soon"
        note="Mark the ones you want to see."
        load={getComingSoon}
      />
      <Row title="Popular anime right now" load={getPopularAnime} />
      <Providers />

      <Section title="What are you in the mood for?">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {MOODS.map((mood) => (
            <Link
              key={mood.name}
              to={browseLink({ type: "movie", genre: mood.genre, name: mood.name })}
              className={`flex items-center gap-3 rounded-2xl bg-linear-to-br ${mood.color} to-panel p-5 font-bold transition-transform hover:scale-[1.02]`}
            >
              <mood.icon size={24} />
              {mood.name}
            </Link>
          ))}
        </div>
      </Section>

      <Row title="Great movies you might have missed" note="Loved by the people who found them." load={getHiddenGems} />

      <GenreTiles />

      <Section title="Best of every decade">
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {DECADES.map((decade) => (
            <Link
              key={decade}
              to={browseLink({ type: "movie", decade, sort: "top", name: `Best of the ${decade}s` })}
              className="shrink-0 rounded-2xl border border-line px-8 py-6 text-2xl font-extrabold text-muted transition-colors hover:border-text hover:text-text"
            >
              {decade.slice(2)}s
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

// a big tile with 3 posters fanned out on the right side
function TypeTile({ item }) {
  const { data } = useFetch(item.load);
  const posters = data ? data.filter((result) => result.poster).slice(0, 3) : [];

  return (
    <Link
      to={browseLink(item.filters)}
      className="group relative flex h-16 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-panel font-bold transition-colors hover:bg-panel-light md:h-32 md:justify-start md:px-6 md:text-lg"
    >
      {/* only on bigger screens, on phones the tiles are too small for posters */}
      <div className="absolute inset-y-0 right-0 hidden w-1/2 origin-right transition-transform duration-300 group-hover:scale-105 md:block" aria-hidden="true">
        {posters.map((result, index) => (
          <img
            key={result.id}
            src={imageUrl(result.poster, "w185")}
            alt=""
            className="absolute top-1/2 w-20 rounded-lg shadow-xl shadow-black/50"
            style={{
              right: `${12 + index * 44}px`,
              transform: `translateY(-50%) rotate(${(index - 1) * -8}deg)`,
              zIndex: 3 - index,
            }}
          />
        ))}
        {/* fade the posters into the tile so the text stays easy to read */}
        <div className="absolute inset-0 bg-linear-to-r from-panel via-panel/40 to-transparent transition-colors group-hover:from-panel-light group-hover:via-panel-light/40" />
      </div>

      <span className="relative flex items-center gap-2">
        <item.icon size={22} /> {item.label}
        <ArrowRight size={18} className="hidden text-muted transition-transform group-hover:translate-x-1 md:block" />
      </span>
    </Link>
  );
}

function Section({ title, note, children }) {
  return (
    <section className="mt-10">
      <SectionTitle title={title} note={note} />
      {children}
    </section>
  );
}

function Providers() {
  const { data: providers } = useFetch(getProviders);
  if (!providers) return null;

  return (
    <Section title="What's on your apps" note="Streaming in India right now.">
      <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
        {providers.map((provider) => (
          <Link
            key={provider.id}
            to={browseLink({ type: "movie", provider: provider.id, name: `On ${provider.name}` })}
            className="group flex flex-col items-center gap-2 text-center"
          >
            <img
              src={imageUrl(provider.logo, "w154")}
              alt=""
              className="aspect-square w-full max-w-20 rounded-2xl transition-transform group-hover:scale-105"
            />
            <span className="text-xs text-muted group-hover:text-text">{provider.name}</span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// trending today with a big number next to each poster
function TopTen() {
  const { data: items } = useFetch(getTopTen);
  if (!items) return null;

  return (
    <Section title="Most watched today" note="Movies and shows, updated every day.">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {items.map((item, index) => (
          <Link key={item.id} to={`/${item.type}/${item.id}`} className="group flex shrink-0 items-end">
            {/* outlined number, the text color is the page color so only the stroke shows */}
            <span
              className="-mr-4 text-8xl leading-none font-black text-page md:text-9xl"
              style={{ WebkitTextStroke: "2px var(--color-muted)" }}
            >
              {index + 1}
            </span>
            <img
              src={imageUrl(item.poster, "w342")}
              alt={item.title}
              loading="lazy"
              className="relative w-28 rounded-xl transition-transform group-hover:scale-105 md:w-36"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}

function GenreTiles() {
  const { data: genres } = useFetch(getMovieGenres);
  if (!genres) return null;

  return (
    <Section title="Browse by genre">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {genres.map((genre, index) => (
          <Link
            key={genre.id}
            to={browseLink({ type: "movie", genre: genre.id, name: genre.name })}
            className={`rounded-xl bg-linear-to-br ${GENRE_COLORS[index % GENRE_COLORS.length]} to-panel px-4 py-5 font-bold transition-transform hover:scale-[1.02]`}
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}

// useFetch needs a function that stays the same, so these live outside the component
function getMovieGenres() {
  return getGenres("movie");
}

// the seasonal row: spooky in october, cozy in december and so on
const season = getSeason();
function getThisSeason() {
  return getSeasonalMovies(season.params);
}

// upcoming movies with a little "In 3 days" tag on the poster
async function getComingSoon() {
  const movies = await getUpcomingMovies();
  return movies.map((movie) => ({ ...movie, badge: countdown(movie.date) }));
}
