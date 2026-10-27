import { useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { imageUrl } from "../api/tmdb";
import { useLibrary } from "../store/library";
import { yearSummary } from "../stats";
import { plural } from "../utils";

// a card with your year in watching, that you can download and share
export default function Wrapped() {
  const items = Object.values(useLibrary((state) => state.items));
  const year = new Date().getFullYear();
  const summary = yearSummary(items, year);
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setSaving(true);
    setError(false);
    try {
      // html-to-image draws the card into a picture. pixelRatio 3 makes it sharp on phones.
      // cacheBust loads the posters again, the copies the browser already has can't be used for a picture
      const picture = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.href = picture;
      link.download = `reelmark-wrapped-${year}.png`;
      link.click();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const hours = Math.round(summary.minutes / 60);

  return (
    <>
      <Link to="/stats" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text">
        <ArrowLeft size={16} /> Back to stats
      </Link>

      {summary.titles === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">Nothing to wrap yet</h2>
          <p className="mt-1 text-muted">Watch a few things in {year} and your card shows up here.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* this div is what ends up in the picture */}
          <div
            ref={cardRef}
            className="w-[360px] overflow-hidden rounded-3xl bg-linear-to-br from-accent/35 via-panel to-page p-7 sm:w-[400px]"
          >
            <p className="text-xs font-bold tracking-[0.3em] text-text/70 uppercase">Reelmark wrapped</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">Your {year}</h1>

            <p className="mt-8 text-7xl leading-none font-black">{hours}</p>
            <p className="mt-1 text-lg font-semibold text-text/80">hours of watching</p>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <SmallStat value={summary.titles} label="titles" />
              <SmallStat value={summary.episodes} label="episodes" />
              <SmallStat value={summary.movies} label="movies" />
            </div>

            {summary.topShow && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-black/25 p-3">
                <img src={imageUrl(summary.topShow.item.poster, "w185")} alt="" crossOrigin="anonymous" className="w-14 rounded-lg" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text/60 uppercase">Most binged</p>
                  <p className="truncate font-bold">{summary.topShow.item.title}</p>
                  <p className="text-sm text-text/70">{plural(summary.topShow.episodes, "episode")}</p>
                </div>
              </div>
            )}

            {summary.favorites.length > 0 && (
              <>
                <p className="mt-6 mb-2 text-xs font-semibold text-text/60 uppercase">Favorites</p>
                <div className="grid grid-cols-3 gap-2">
                  {summary.favorites.map((item) => (
                    <img key={item.type + item.id} src={imageUrl(item.poster, "w342")} alt={item.title} crossOrigin="anonymous" className="rounded-lg" />
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex justify-between gap-4 text-sm">
              {summary.topGenre && (
                <div>
                  <p className="text-xs font-semibold text-text/60 uppercase">Top genre</p>
                  <p className="font-bold">{summary.topGenre}</p>
                </div>
              )}
              {summary.bestMonth && (
                <div className="text-right">
                  <p className="text-xs font-semibold text-text/60 uppercase">Busiest month</p>
                  <p className="font-bold">{summary.bestMonth.label}</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={download}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-text hover:opacity-90 disabled:opacity-60"
          >
            <Download size={18} /> {saving ? "Saving..." : "Download picture"}
          </button>
          {error && <p className="text-sm text-red-400">Couldn’t make the picture, try again.</p>}
        </div>
      )}
    </>
  );
}

function SmallStat({ value, label }) {
  return (
    <div className="rounded-xl bg-black/25 py-3">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-text/70">{label}</p>
    </div>
  );
}
