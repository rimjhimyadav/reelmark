// the heading above a section: a small label, the title,
// and on the right an optional note or some buttons (children)
export default function SectionTitle({ label, title, note, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        {label && <p className="mb-1 text-xs font-semibold tracking-widest text-accent uppercase">{label}</p>}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {note && <p className="hidden text-sm text-muted lg:block">{note}</p>}
        {children}
      </div>
    </div>
  );
}
