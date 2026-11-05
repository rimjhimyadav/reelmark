// the slow, blurry color clouds behind pages that have no movie picture (stats, library, settings...).
// made from the main color you pick in settings, so changing it there recolors the whole background.
// pages with a movie (home, details) hide it and show the movie's own colors instead (see index.css)
export default function Aurora() {
  return (
    <div className="aurora pointer-events-none fixed inset-0 -z-20 overflow-hidden" aria-hidden="true">
      <div className="aurora-blob top-[-20%] left-[-10%] size-[70vmax] bg-accent opacity-45 [animation-duration:38s]" />
      <div className="aurora-blob top-[30%] right-[-25%] size-[60vmax] bg-[color-mix(in_srgb,var(--color-accent)_60%,black)] opacity-60 [animation-delay:-12s] [animation-duration:46s]" />
      <div className="aurora-blob bottom-[-35%] left-[20%] size-[55vmax] bg-[color-mix(in_srgb,var(--color-accent)_75%,white)] opacity-25 [animation-delay:-24s] [animation-duration:52s]" />
      {/* darker toward the middle and bottom, so text and cards on top stay easy to read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(9_9_11/0.55),rgb(9_9_11/0.2)_70%)]" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-page/30 to-page/70" />
    </div>
  );
}
