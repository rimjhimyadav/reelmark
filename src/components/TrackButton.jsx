import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { itemKey, useLibrary } from "../store/library";
import { STATUSES, getStatus } from "../statuses";
import Modal from "./Modal";

// "Track" button on the details page. opens a popup to pick a status
export default function TrackButton({ item }) {
  const key = itemKey(item.type, item.id);
  const saved = useLibrary((state) => state.items[key]);
  const setStatus = useLibrary((state) => state.setStatus);
  const remove = useLibrary((state) => state.remove);
  const [open, setOpen] = useState(false);

  function pick(status) {
    setStatus(item, status);
    setOpen(false);
  }

  function removeFromLibrary() {
    remove(key);
    setOpen(false);
  }

  const current = saved ? getStatus(saved.status) : null;

  return (
    <>
      {current ? (
        <button
          onClick={() => setOpen(true)}
          className="glass inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition-colors hover:bg-white/10"
        >
          <current.icon size={18} className={current.text} /> {current.label}{" "}
          <ChevronDown size={16} className="text-muted" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-text hover:opacity-90"
        >
          <Plus size={18} /> Track
        </button>
      )}

      {open && (
        <Modal title={saved ? "Change status" : `Track ${item.title}`} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-2">
            {STATUSES.map((status) => (
              <button
                key={status.key}
                onClick={() => pick(status.key)}
                className={`flex items-center gap-4 rounded-xl border p-3 text-left transition-colors ${
                  saved && saved.status === status.key
                    ? "border-text/40 bg-white/10"
                    : "border-transparent bg-white/5 hover:bg-white/10"
                }`}
              >
                <status.icon size={20} className={status.text} />
                <span>
                  <span className="block font-semibold">{status.label}</span>
                  <span className="block text-sm text-muted">{status.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {saved && (
            <button
              onClick={removeFromLibrary}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10"
            >
              <Trash2 size={16} /> Remove from library
            </button>
          )}
        </Modal>
      )}
    </>
  );
}
