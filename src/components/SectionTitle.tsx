// the heading above a section: the title,
// and on the right an optional note or some buttons (children)
import type { ReactNode } from "react";

export interface SectionTitleProps {
  title: ReactNode;
  note?: string;
  children?: ReactNode;
}

export default function SectionTitle({ title, note, children }: SectionTitleProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <h2 className="flex min-w-0 items-center gap-2.5 text-xl font-bold">
        <span className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
        {title}
      </h2>

      <div className="flex shrink-0 items-center gap-3">
        {note && <p className="hidden text-sm text-muted lg:block">{note}</p>}
        {children}
      </div>
    </div>
  );
}
