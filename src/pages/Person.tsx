import { useCallback, useState, type CSSProperties } from "react";
import { useParams, useSearchParams } from "react-router";
import { ExternalLink } from "lucide-react";
import { backdropSrcSet, getPerson, imageUrl } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { useAmbientColor } from "../hooks/usePosterColor";
import { itemKey, useLibrary, type LibraryItems } from "../store/library";
import { STATUSES } from "../statuses";
import { countdown, formatDate, plural, todayString } from "../utils";
import { PosterRow } from "../components/Row";
import PosterCard, { type CardItem } from "../components/PosterCard";
import SectionTitle from "../components/SectionTitle";
import type { Credit, Person as PersonData } from "../types";

// /person/123: an actor (or director, writer...) and everything they were in
export default function PersonPage() {
  const { id } = useParams();
  // key: when you go from one person to another, start fresh
  return <Person key={id} id={Number(id)} />;
}

type SortKey = "new" | "popular" | "top";
type TypeKey = "all" | "movie" | "tv";

const TYPES: { key: TypeKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "Shows" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "new", label: "Newest" },
  { key: "popular", label: "Popular" },
  { key: "top", label: "Top rated" },
];

// how many posters the filmography shows before "show more"
const PAGE_SIZE = 30;

function Person({ id }: { id: number }) {
  const loadPerson = useCallback(() => getPerson(id), [id]);
  const { data: person, error } = useFetch(loadPerson);
  const library = useLibrary((state) => state.items);
  // the page glows in the color of their photo
  const ambient = useAmbientColor(person ? person.photo : null);
  const tint = ambient || "var(--color-accent)";

  if (error) {
    return <p className="mt-20 text-center text-muted">Couldn't load this person. Maybe the link is wrong?</p>;
  }
  if (!person) {
    return <div className="h-[420px] animate-pulse rounded-2xl bg-panel" />;
  }

  const department = mainDepartment(person);
  const knownFor = getKnownFor(person.credits[department] || []);
  const everything = allCredits(person);
  const inLibrary = getInLibrary(everything, library);
  const comingSoon = getComingSoon(everything);
  // the big picture on top: the backdrop of the title they're best known for
  const hero = knownFor.find((credit) => credit.backdrop)?.backdrop;

  return (
    <>
      {/* same blurry glow behind the page as the details page */}
      {hero && (
        <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
          <img src={imageUrl(hero, "w780")} alt="" className="size-full scale-125 object-cover opacity-50 blur-[80px] saturate-150" />
          <div className="absolute inset-0 bg-linear-to-b from-page/40 via-page/65 to-page/85" />
        </div>
      )}

      <div className="bleed relative h-[30vh] min-h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,black_40%,transparent)] md:h-[50vh]">
        {hero && (
          <img
            src={imageUrl(hero, "w1280")}
            srcSet={backdropSrcSet(hero)}
            sizes="100vw"
            alt=""
            className="size-full object-cover object-[center_25%] opacity-60"
          />
        )}
      </div>

      <div
        className="relative -mt-24 flex flex-col gap-6 px-2 md:-mt-[22vh] md:flex-row md:gap-10 md:px-4"
        style={{ "--tint": tint } as CSSProperties}
      >
        <div className="aspect-2/3 w-36 shrink-0 self-start overflow-hidden rounded-xl bg-panel-light shadow-[0_20px_90px_-8px_var(--tint)] ring-1 ring-white/10 transition-shadow duration-1000 md:w-60">
          {person.photo && <img src={imageUrl(person.photo, "w500")} alt={person.name} className="size-full object-cover" />}
        </div>

        <div className="min-w-0 md:pt-[10vh]">
          <h1 className="font-display text-5xl font-extrabold tracking-wide uppercase drop-shadow-[0_4px_20px_rgb(0_0_0/0.6)] md:text-7xl">
            {person.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {lifeFacts(person).map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {countFacts(everything, inLibrary.length).map((fact) => (
              <span key={fact} className="rounded-full border border-(color:--tint)/40 bg-(color:--tint)/15 px-3 py-1 text-xs font-medium text-text/90">
                {fact}
              </span>
            ))}
          </div>

          {person.bio && <Bio text={person.bio} />}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {person.imdbId && <OutLink href={`https://www.imdb.com/name/${person.imdbId}/`} label="IMDb" />}
            {person.instagram && <OutLink href={`https://www.instagram.com/${person.instagram}/`} label="Instagram" />}
          </div>
        </div>
      </div>

      {knownFor.length > 0 && <PosterRow title="Known for" items={knownFor.map(toCard)} />}
      {inLibrary.length > 0 && <PosterRow title="In your library" items={inLibrary} />}
      {comingSoon.length > 0 && <PosterRow title="Coming soon" items={comingSoon} />}

      <Filmography person={person} defaultDepartment={department} />
    </>
  );
}

// the department the page is about: what TMDB says they're known for, if they have titles there
function mainDepartment(person: PersonData) {
  if (person.credits[person.knownFor]?.length) return person.knownFor;
  if (person.credits.Acting.length) return "Acting";
  return Object.keys(person.credits).find((department) => person.credits[department].length > 0) || "Acting";
}

// the titles most people have seen them in. for shows we skip guest spots (1-2 episodes),
// otherwise anyone who was once in Friends would be "known for" Friends
function getKnownFor(credits: Credit[]) {
  const today = todayString();
  return credits
    .filter((credit) => credit.date && credit.date <= today)
    .filter((credit) => credit.type === "movie" || credit.episodes === 0 || credit.episodes >= 3)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 12);
}

// every title from every department, once
function allCredits(person: PersonData) {
  const seen = new Map<string, Credit>();
  for (const department in person.credits) {
    for (const credit of person.credits[department]) {
      const key = itemKey(credit.type, credit.id);
      if (!seen.has(key)) seen.set(key, credit);
    }
  }
  return [...seen.values()];
}

// their titles you track, newest activity first, with your status as the badge
function getInLibrary(credits: Credit[], library: LibraryItems): CardItem[] {
  return credits
    .filter((credit) => library[itemKey(credit.type, credit.id)])
    .map((credit) => {
      const saved = library[itemKey(credit.type, credit.id)];
      const status = STATUSES.find((item) => item.key === saved.status);
      return { ...toCard(credit), badge: status?.label };
    })
    .sort((a, b) => library[itemKey(b.type, b.id)].updatedAt.localeCompare(library[itemKey(a.type, a.id)].updatedAt));
}

// not out yet: soonest first, then the ones without a date ("announced")
function getComingSoon(credits: Credit[]): CardItem[] {
  const today = todayString();
  const dated = credits.filter((credit) => credit.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const undated = credits.filter((credit) => !credit.date);
  return [
    ...dated.map((credit) => ({ ...toCard(credit), badge: countdown(credit.date) })),
    ...undated.map((credit) => ({ ...toCard(credit), badge: "Announced" })),
  ];
}

// the grey line under the poster: "Rue · 24 episodes"
function toCard(credit: Credit): CardItem {
  const role = [credit.role, credit.type === "tv" && credit.episodes > 0 ? plural(credit.episodes, "episode") : ""];
  return { ...credit, role: role.filter(Boolean).join(" · ") };
}

function age(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  let years = end.getFullYear() - start.getFullYear();
  // not had their birthday yet that year
  if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) years--;
  return years;
}

// "Acting · Born 1 Sep 1996 (30) · Oakland, California, USA"
function lifeFacts(person: PersonData) {
  const facts = [person.knownFor];
  if (person.birthday && person.deathday) {
    facts.push(`${formatDate(person.birthday)} – ${formatDate(person.deathday)} (${age(person.birthday, person.deathday)})`);
  } else if (person.birthday) {
    facts.push(`Born ${formatDate(person.birthday)} (${age(person.birthday, todayString())})`);
  }
  if (person.birthplace) facts.push(person.birthplace);
  return facts.filter(Boolean);
}

// "34 movies", "9 shows", "4 in your library"
function countFacts(credits: Credit[], inLibrary: number) {
  const movies = credits.filter((credit) => credit.type === "movie").length;
  const shows = credits.length - movies;
  const facts = [];
  if (movies) facts.push(plural(movies, "movie"));
  if (shows) facts.push(plural(shows, "show"));
  if (inLibrary) facts.push(`${inLibrary} in your library`);
  return facts;
}

// long bios are cut after a few lines until you click "read more"
function Bio({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > 400;

  return (
    <div className="mt-5 max-w-3xl">
      <p className={`leading-relaxed whitespace-pre-line text-text/85 ${open ? "" : "line-clamp-4"}`}>{text}</p>
      {isLong && (
        <button onClick={() => setOpen(!open)} className="mt-2 text-sm font-semibold text-accent hover:underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function OutLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="glass inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition-colors hover:bg-white/10"
    >
      {label} <ExternalLink size={16} className="text-muted" />
    </a>
  );
}

// every title, with filters. the filters live in the url (?dept=Directing&type=movie&sort=top),
// so when you open a title and come back, they're still set
function Filmography({ person, defaultDepartment }: { person: PersonData; defaultDepartment: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shown, setShown] = useState(PAGE_SIZE);

  // departments they have titles in, the main one first
  const departments = Object.keys(person.credits)
    .filter((name) => person.credits[name].length > 0)
    .sort((a, b) => (a === defaultDepartment ? -1 : b === defaultDepartment ? 1 : 0));

  const department = departments.find((name) => name === searchParams.get("dept")) || defaultDepartment;
  const type = (TYPES.find((item) => item.key === searchParams.get("type")) || TYPES[0]).key;
  const sort = (SORTS.find((item) => item.key === searchParams.get("sort")) || SORTS[0]).key;

  function changeFilter(name: "dept" | "type" | "sort", value: string) {
    const params: Record<string, string> = { dept: department, type, sort };
    params[name] = value;
    // leave the defaults out of the url
    if (params.dept === defaultDepartment) delete params.dept;
    if (params.type === TYPES[0].key) delete params.type;
    if (params.sort === SORTS[0].key) delete params.sort;
    setSearchParams(params, { replace: true, preventScrollReset: true });
    setShown(PAGE_SIZE);
  }

  const credits = (person.credits[department] || []).filter((credit) => type === "all" || credit.type === type);
  const sorted = sortCredits(credits, sort);

  return (
    <section className="mt-10">
      <SectionTitle title="Filmography" />

      {departments.length > 1 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          {departments.map((name) => (
            <button
              key={name}
              onClick={() => changeFilter("dept", name)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                department === name ? "bg-white text-page" : "glass text-text/75 [--glass-fill:45%] hover:bg-white/10 hover:text-text"
              }`}
            >
              {name} <span className="opacity-60">{person.credits[name].length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Pills options={TYPES} value={type} onChange={(value) => changeFilter("type", value)} />
        <Pills options={SORTS} value={sort} onChange={(value) => changeFilter("sort", value)} subtle />
      </div>

      {sorted.length === 0 && <p className="mt-12 text-center text-muted">Nothing here.</p>}

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
        {sorted.slice(0, shown).map((credit) => (
          <PosterCard key={credit.type + credit.id} item={toCard(credit)} />
        ))}
      </div>

      {sorted.length > shown && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShown(shown + PAGE_SIZE)}
            className="glass rounded-full px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            Show more ({sorted.length - shown} left)
          </button>
        </div>
      )}
    </section>
  );
}

function sortCredits(credits: Credit[], sort: SortKey) {
  const list = [...credits];
  if (sort === "popular") return list.sort((a, b) => b.votes - a.votes);
  if (sort === "top") {
    // a 10/10 from 3 votes shouldn't beat a 8.5 from 20,000, so titles with few votes go last
    const score = (credit: Credit) => (credit.votes >= 50 ? Number(credit.rating) : -1);
    return list.sort((a, b) => score(b) - score(a) || b.votes - a.votes);
  }
  // newest: titles without a date are only announced, so they go last
  return list.sort((a, b) => Number(!a.date) - Number(!b.date) || b.date.localeCompare(a.date));
}

// the glass pill group from the explore "see all" page
function Pills<K extends string>({
  options,
  value,
  onChange,
  subtle,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (value: K) => void;
  subtle?: boolean;
}) {
  const picked = subtle ? "bg-white/15 text-text" : "bg-white text-page shadow-[0_4px_14px_rgb(255_255_255/0.15)]";
  const idle = subtle ? "text-text/60 hover:bg-white/10 hover:text-text" : "text-text/70 hover:bg-white/10 hover:text-text";
  return (
    <div className="glass flex h-11 items-center gap-1 rounded-full p-1 [--glass-fill:55%]">
      {options.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`h-full rounded-full px-4 text-sm font-semibold transition-colors ${value === item.key ? picked : idle}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
