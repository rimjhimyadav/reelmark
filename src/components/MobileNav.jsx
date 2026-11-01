import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { links } from "../links";
import Logo from "./Logo";

const bottomLinks = links.filter((link) => link.mobile !== false);
const topLinks = links.filter((link) => link.mobile === false);

// on phones: logo + small icons on top, main pages at the bottom
export default function MobileNav() {
  // the top bar floats see-through over the big pictures, and turns into glass once you scroll
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 transition-colors duration-300 md:hidden ${
          scrolled ? "glass [--glass-fill:80%]" : "bg-linear-to-b from-black/50 to-transparent"
        }`}
      >
        <Logo />
        <div className="flex gap-1">
          {topLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.label}
              className={({ isActive }) =>
                `flex size-10 items-center justify-center rounded-full transition-colors ${isActive ? "bg-white text-page" : "bg-black/25 text-text/85 backdrop-blur"}`
              }
            >
              <link.icon size={18} />
            </NavLink>
          ))}
        </div>
      </header>

      {/* floats a bit above the bottom edge (and above the iphone home bar), so posters scroll behind it */}
      <nav className="glass fixed inset-x-3 [--glass-fill:85%] bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 grid grid-cols-5 gap-1 rounded-[28px] p-1.5 md:hidden">
        {bottomLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-[22px] py-2 text-xs font-medium transition-colors ${
                isActive ? "bg-white text-page" : "text-muted"
              }`
            }
          >
            <link.icon size={20} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
