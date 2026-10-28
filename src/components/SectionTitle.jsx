// the heading above a section: the title,
// and on the right an optional note or some buttons (children)
export default function SectionTitle({ title, note, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <h2 className="min-w-0 text-xl font-bold">{title}</h2>

      <div className="flex shrink-0 items-center gap-3">
        {note && <p className="hidden text-sm text-muted lg:block">{note}</p>}
        {children}
      </div>
    </div>
  );
}
