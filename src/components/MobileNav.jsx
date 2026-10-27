import { NavLink } from "react-router";
import { links } from "../links";
import Logo from "./Logo";

const bottomLinks = links.filter((link) => link.mobile !== false);
const topLinks = links.filter((link) => link.mobile === false);

// on phones: logo + small icons on top, main pages at the bottom
export default function MobileNav() {
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-page/90 px-4 py-3 backdrop-blur md:hidden">
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

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-panel md:hidden">
        {bottomLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${isActive ? "text-text" : "text-muted"}`
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
