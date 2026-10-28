import { useState } from "react";
import { Check, Download, Trash2, Upload } from "lucide-react";
import { useLibrary } from "../store/library";
import { useSettings } from "../store/settings";
import { ACCENTS } from "../accents";
import { plural, todayString } from "../utils";
import PageTitle from "../components/PageTitle";
import Modal from "../components/Modal";

export default function Settings() {
  const items = useLibrary((state) => state.items);
  const replaceAll = useLibrary((state) => state.replaceAll);
  const count = Object.keys(items).length;

  // what's waiting for a "yes" in the popup: an imported file, or "delete"
  const [pendingImport, setPendingImport] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");

  // your library is only saved in this browser, so this file is your backup
  function exportLibrary() {
    const text = JSON.stringify({ app: "reelmark", version: 1, items }, null, 2);
    const file = new Blob([text], { type: "application/json" });

    // the usual trick to download a file from javascript: make a hidden link and click it
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `reelmark-backup-${todayString()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function readImportFile(event) {
    const file = event.target.files[0];
    event.target.value = ""; // so picking the same file again still works
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      if (data.app !== "reelmark" || typeof data.items !== "object") throw new Error("not a backup");
      setPendingImport(data.items);
    } catch {
      setMessage("That file isn't a Reelmark backup.");
    }
  }

  function finishImport() {
    replaceAll(pendingImport);
    setMessage(`Imported ${plural(Object.keys(pendingImport).length, "title")}.`);
    setPendingImport(null);
  }

  function deleteEverything() {
    replaceAll({});
    setConfirmDelete(false);
    setMessage("Your library is empty now.");
  }

  return (
    <>
      <PageTitle title="Settings" />

      <AccentPicker />
      <SpoilerSetting />

      <section className="mt-4 max-w-2xl rounded-2xl bg-panel p-6">
        <h2 className="text-lg font-bold">Your library</h2>
        <p className="mt-1 text-sm text-muted">
          You have {plural(count, "title")}. Everything is saved in this browser only, so export a backup now and then.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={exportLibrary}
            disabled={count === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-text hover:opacity-90 disabled:opacity-40"
          >
            <Download size={18} /> Export backup
          </button>

          {/* a real file input is hidden inside the label, so the whole button opens the file picker */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-panel-light px-4 py-2.5 font-semibold hover:bg-line">
            <Upload size={18} /> Import backup
            <input type="file" accept=".json,application/json" onChange={readImportFile} className="hidden" />
          </label>

          <button
            onClick={() => setConfirmDelete(true)}
            disabled={count === 0}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-red-400 hover:bg-red-400/10 disabled:opacity-40"
          >
            <Trash2 size={18} /> Delete everything
          </button>
        </div>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </section>

      <section className="mt-4 max-w-2xl rounded-2xl bg-panel p-6">
        <h2 className="text-lg font-bold">About</h2>
        <p className="mt-2 text-sm text-muted">
          Reelmark is a free, personal project for tracking movies, shows and anime. Movie and show data comes from{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-text underline">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming info is provided by{" "}
          <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="text-text underline">
            JustWatch
          </a>
          .
        </p>
      </section>

      {pendingImport && (
        <Modal title="Import backup?" onClose={() => setPendingImport(null)}>
          <p className="text-muted">
            This replaces your current library ({plural(count, "title")}) with the{" "}
            {plural(Object.keys(pendingImport).length, "title")} from the file.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setPendingImport(null)} className="rounded-lg px-4 py-2 font-semibold text-muted hover:text-text">
              Cancel
            </button>
            <button onClick={finishImport} className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-text">
              Import
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete everything?" onClose={() => setConfirmDelete(false)}>
          <p className="text-muted">
            All {plural(count, "title")} and your watch history will be gone. Export a backup first if you might want them back.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-4 py-2 font-semibold text-muted hover:text-text">
              Cancel
            </button>
            <button onClick={deleteEverything} className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white">
              Delete
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AccentPicker() {
  const accent = useSettings((state) => state.accent);
  const setAccent = useSettings((state) => state.setAccent);
  const current = ACCENTS.find((item) => item.key === accent) || ACCENTS[0];

  return (
    <section className="max-w-2xl rounded-2xl bg-panel p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold">Main color</h2>
        <span className="text-sm font-semibold text-accent">{current.label}</span>
      </div>
      <p className="mt-1 text-sm text-muted">Used for buttons, progress bars, charts and the glow behind the page.</p>

      <div className="mt-5 grid grid-cols-6 justify-items-center gap-3 sm:gap-4">
        {ACCENTS.map((item) => {
          const isPicked = item.key === current.key;
          return (
            <button
              key={item.key}
              onClick={() => setAccent(item.key)}
              title={item.label}
              aria-label={item.label}
              aria-pressed={isPicked}
              className={`flex size-10 items-center justify-center rounded-full transition-transform hover:scale-110 sm:size-11 ${
                isPicked ? "ring-2 ring-text ring-offset-4 ring-offset-panel" : ""
              }`}
              style={{ backgroundColor: item.color, color: item.text }}
            >
              {isPicked && <Check size={18} strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SpoilerSetting() {
  const hideSpoilers = useSettings((state) => state.hideSpoilers);
  const toggleSpoilers = useSettings((state) => state.toggleSpoilers);

  return (
    <section className="mt-4 flex max-w-2xl items-center justify-between gap-6 rounded-2xl bg-panel p-6">
      <div>
        <h2 className="text-lg font-bold">Hide spoilers</h2>
        <p className="mt-1 text-sm text-muted">
          Blur the names and pictures of episodes you haven’t watched yet. Hover (or tap) to see them.
        </p>
      </div>

      {/* a simple on/off switch */}
      <button
        onClick={toggleSpoilers}
        role="switch"
        aria-checked={hideSpoilers}
        title={hideSpoilers ? "Turn off" : "Turn on"}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${hideSpoilers ? "bg-accent" : "bg-panel-light"}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-text shadow transition-all ${
            hideSpoilers ? "left-6 bg-accent-text" : "left-1"
          }`}
        />
      </button>
    </section>
  );
}
