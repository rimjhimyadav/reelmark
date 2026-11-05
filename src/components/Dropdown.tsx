import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

// a glass pill that opens a glass menu, used instead of <select>
// (the browser draws the list of a <select> itself, and it can't be made to match the app).
// works with the keyboard too: arrows to move, enter to pick, escape to close.
// options look like [{ value: "title", label: "Title A-Z" }], and can also have
// "image" (a small poster on the left) and "sub" (a grey second line), like the season picker
export interface Option<V> {
  value: V;
  label: string;
  image?: string | null; // undefined = no picture box, null = an empty box
  sub?: string;
}

interface Props<V> {
  value: V;
  onChange: (value: V) => void;
  options: Option<V>[];
  icon?: LucideIcon;
  label: string;
  align?: "left" | "right";
}

export default function Dropdown<V extends string | number>({ value, onChange, options, icon: Icon, label, align = "left" }: Props<V>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value) || options[0];

  // clicking anywhere else closes the menu
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // keep the highlighted option in view in long lists (like streaming services)
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlight];
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlight]);

  function openMenu() {
    setHighlight(Math.max(0, options.indexOf(selected)));
    setOpen(true);
  }

  function pick(option: Option<V>) {
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowDown") setHighlight((old) => Math.min(old + 1, options.length - 1));
    if (event.key === "ArrowUp") setHighlight((old) => Math.max(old - 1, 0));
    if (event.key === "Enter" || event.key === " ") pick(options[highlight]);
    if (event.key !== "Tab") event.preventDefault();
    else setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`glass flex h-11 items-center gap-2 rounded-full pr-3.5 pl-4 text-sm font-semibold whitespace-nowrap transition-colors [--glass-fill:55%] hover:bg-white/10 ${
          open ? "bg-white/10" : ""
        }`}
      >
        {Icon && <Icon size={16} className="shrink-0 text-muted" />}
        <span className="max-w-56 truncate">{selected.label}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`glass-strong absolute top-full z-40 mt-2 max-h-80 min-w-full animate-[pop_0.15s_ease-out] overflow-y-auto rounded-2xl p-1.5 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === selected.value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => pick(option)}
                onMouseEnter={() => setHighlight(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm whitespace-nowrap ${
                  index === highlight ? "bg-white/10" : ""
                } ${isSelected ? "font-semibold text-text" : "text-text/75"}`}
              >
                {option.image !== undefined && (
                  <span className="h-12 w-8 shrink-0 overflow-hidden rounded-md bg-white/10">
                    {option.image && <img src={option.image} alt="" loading="lazy" className="size-full object-cover" />}
                  </span>
                )}
                <span className="mr-auto min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.sub && <span className="block text-xs font-normal text-muted">{option.sub}</span>}
                </span>
                {isSelected && <Check size={15} className="shrink-0 text-accent" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
