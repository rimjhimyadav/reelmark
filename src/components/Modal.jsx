import { useEffect } from "react";
import { X } from "lucide-react";

// a popup over the page. closes with the X, the Escape key or a click outside
export default function Modal({ title, onClose, wide = false, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);

    // stop the page behind from scrolling while the popup is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      {/* stopPropagation so clicks inside the box don't count as "outside" */}
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full rounded-2xl border border-line bg-panel p-5 ${wide ? "max-w-4xl" : "max-w-md"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} title="Close" className="text-muted hover:text-text">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
