import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { links } from "../links";
import Logo from "./Logo";

// search and settings are round icon buttons on the right, the rest go in the pill in the middle
const ICON_LINKS = ["/search", "/settings"];
const pillLinks = links.filter((link) => !ICON_LINKS.includes(link.to));
const iconLinks = links.filter((link) => ICON_LINKS.includes(link.to));

// desktop navigation: floats over the page, so the big pictures can go right up to the top edge.
// on phones MobileNav is used instead
export default function TopBar() {
  // once you scroll, a dark fade appears behind the bar so it stays readable over the rows
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-30 hidden md:block">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-page/95 via-page/60 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_50%,transparent)] transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative mx-auto grid max-w-[1800px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-10 py-5">
        <div className="drop-shadow-[0_2px_8px_rgb(0_0_0/0.5)]">
          <Logo />
        </div>

        <nav className="glass flex items-center gap-1 rounded-full p-1.5 [--glass-fill:55%]">
          {pillLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-white text-page shadow-[0_4px_16px_rgb(255_255_255/0.2)]" : "text-text/75 hover:bg-white/10 hover:text-text"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <link.icon size={16} />}
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {iconLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.to === "/search" ? "Search (Ctrl K)" : link.label}
              className={({ isActive }) =>
                `glass flex size-11 items-center justify-center rounded-full transition-colors [--glass-fill:55%] ${
                  isActive ? "text-accent" : "text-text/80 hover:bg-white/10 hover:text-text"
                }`
              }
            >
              <link.icon size={19} />
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
