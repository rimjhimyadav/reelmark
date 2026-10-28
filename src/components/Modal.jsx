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
    // the page behind stays visible but blurry, and the box is a glass sheet on top
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-[fade_0.2s] items-center justify-center bg-black/45 p-4 backdrop-blur-md"
    >
      {/* stopPropagation so clicks inside the box don't count as "outside" */}
      <div
        onClick={(event) => event.stopPropagation()}
        className={`glass-strong w-full rounded-3xl p-5 ${wide ? "max-w-4xl" : "max-w-md"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-muted transition-colors hover:bg-white/15 hover:text-text"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
