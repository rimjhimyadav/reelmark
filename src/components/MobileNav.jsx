import { NavLink } from "react-router";
import { links } from "../links";
import Logo from "./Logo";

const bottomLinks = links.filter((link) => link.mobile !== false);
const topLinks = links.filter((link) => link.mobile === false);

// on phones: logo + small icons on top, main pages at the bottom
export default function MobileNav() {
  return (
    <>
      <header className="glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden">
        <Logo />
        <div className="flex gap-1">
          {topLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.label}
              className={({ isActive }) => `rounded-lg p-2 ${isActive ? "bg-panel-light text-text" : "text-muted"}`}
            >
              <link.icon size={20} />
            </NavLink>
          ))}
        </div>
      </header>

      {/* floats a bit above the bottom edge (and above the iphone home bar), so posters scroll behind it */}
      <nav className="glass fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 grid grid-cols-5 gap-1 rounded-[28px] p-1.5 md:hidden">
        {bottomLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-[22px] py-2 text-xs font-medium transition-colors ${
                isActive ? "bg-white/10 text-text" : "text-muted"
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
