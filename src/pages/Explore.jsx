import { Link } from "react-router";
import { ArrowRight, Brain, Clapperboard, Ghost, Heart, Mountain, Smile, Sparkles, Tv, Zap } from "lucide-react";
import { getGenres, getHiddenGems, getProviders, getTopTen, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import PageTitle from "../components/PageTitle";
import Row from "../components/Row";
import SectionTitle from "../components/SectionTitle";

// "see all" links go to the browse page with filters in the url
function browseLink(filters) {
  return "/explore/all?" + new URLSearchParams(filters).toString();
}

const TYPES = [
  { label: "Movies", icon: Clapperboard, filters: { type: "movie" } },
  { label: "Shows", icon: Tv, filters: { type: "tv" } },
  { label: "Anime", icon: Sparkles, filters: { type: "anime" } },
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
          <Link
            key={item.label}
            to={browseLink(item.filters)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-panel py-5 font-bold transition-colors hover:bg-panel-light md:justify-start md:px-6"
          >
            <item.icon size={22} /> {item.label}
            <ArrowRight size={18} className="ml-auto hidden text-muted md:block" />
          </Link>
        ))}
      </div>

      <Providers />
      <TopTen />

      <Section label="Moods" title="What are you in the mood for?">
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

      <Row label="Hidden gems" title="Great movies you might have missed" note="Loved by the people who found them." load={getHiddenGems} />

      <GenreTiles />

      <Section label="Time travel" title="Best of every decade">
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

function Section({ label, title, note, children }) {
  return (
    <section className="mt-10">
      <SectionTitle label={label} title={title} note={note} />
      {children}
    </section>
  );
}

function Providers() {
  const { data: providers } = useFetch(getProviders);
  if (!providers) return null;

  return (
    <Section label="Streaming" title="What's on your apps" note="Streaming in India right now.">
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
    <Section label="Top 10" title="Most watched today" note="Movies and shows, updated every day.">
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
    <Section label="Genres" title="Find it by genre">
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

// useFetch needs a function that stays the same, so this lives outside the component
function getMovieGenres() {
  return getGenres("movie");
}
