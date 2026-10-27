import { useState } from "react";
import { Link } from "react-router";
import { Dices } from "lucide-react";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import { formatRuntime } from "../utils";
import Modal from "./Modal";

const TIMES = [
  { key: "short", label: "Under an hour" },
  { key: "medium", label: "Around 2 hours" },
  { key: "long", label: "All evening" },
];

// genre names come from TMDB, a mood is just "has one of these genres"
const MOODS = [
  { key: "any", label: "Anything", genres: [] },
  { key: "light", label: "Something light", genres: ["Comedy", "Family", "Animation", "Music"] },
  { key: "intense", label: "Something intense", genres: ["Thriller", "Action", "Crime", "Horror", "Action & Adventure"] },
  { key: "feels", label: "In my feelings", genres: ["Drama", "Romance"] },
];

// does this title fit in the time you have?
// a show fits any time, because you can watch just one episode
function fitsTime(item, time) {
  if (item.type === "tv" || time === "long") return true;
  const minutes = item.runtime || 120;
  if (time === "short") return minutes <= 60;
  return minutes <= 140;
}

function fitsMood(item, mood) {
  if (mood.genres.length === 0) return true;
  return (item.genres || []).some((genre) => mood.genres.includes(genre));
}

// picks something from your "plan to watch" list
export default function TonightPicker() {
  const items = Object.values(useLibrary((state) => state.items));
  const planned = items.filter((item) => item.status === "plan");

  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("medium");
  const [moodKey, setMoodKey] = useState("any");
  const [pick, setPick] = useState(null);
  const [nothingFound, setNothingFound] = useState(false);

  function pickSomething() {
    const mood = MOODS.find((m) => m.key === moodKey);
    const fitting = planned.filter((item) => fitsTime(item, time) && fitsMood(item, mood));

    if (fitting.length === 0) {
      setPick(null);
      setNothingFound(true);
      return;
    }

    // don't show the same title twice in a row if there's another choice
    const others = fitting.filter((item) => !pick || item.id !== pick.id);
    const pool = others.length > 0 ? others : fitting;

    setNothingFound(false);
    setPick(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-10 flex w-full items-center gap-4 rounded-2xl border border-line bg-panel p-5 text-left transition-colors hover:bg-panel-light"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-text">
          <Dices size={26} />
        </span>
        <span>
          <span className="block text-lg font-bold">What should I watch tonight?</span>
          <span className="block text-sm text-muted">Let Reelmark pick something from your Plan to watch list.</span>
        </span>
      </button>

      {open && (
        <Modal title="What should I watch tonight?" onClose={() => setOpen(false)}>
          {planned.length === 0 ? (
            <p className="text-muted">
              Your Plan to watch list is empty. Track a few movies or shows as “Plan to watch” and come back.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold text-muted">How much time do you have?</p>
              <Choices options={TIMES} value={time} onChange={setTime} />

              <p className="mt-5 mb-2 text-sm font-semibold text-muted">What are you in the mood for?</p>
              <Choices options={MOODS} value={moodKey} onChange={setMoodKey} />

              <button
                onClick={pickSomething}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-accent-text hover:opacity-90"
              >
                <Dices size={20} /> {pick ? "Pick another" : "Pick for me"}
              </button>

              {nothingFound && (
                <p className="mt-4 text-center text-sm text-muted">Nothing on your list fits that. Try another mood or time.</p>
              )}

              {pick && (
                <Link
                  to={`/${pick.type}/${pick.id}`}
                  onClick={() => setOpen(false)}
                  className="mt-4 flex items-center gap-4 rounded-xl bg-page/50 p-3 hover:bg-panel-light"
                >
                  <img src={imageUrl(pick.poster, "w185")} alt="" className="w-16 rounded-lg" />
                  <span>
                    <span className="block font-bold">{pick.title}</span>
                    <span className="block text-sm text-muted">
                      {pick.year} · {pick.type === "movie" ? formatRuntime(pick.runtime) : "Show"}
                    </span>
                  </span>
                </Link>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function Choices({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            value === option.key ? "border-text bg-panel-light text-text" : "border-line text-muted hover:text-text"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
