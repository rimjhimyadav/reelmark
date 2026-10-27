import { NavLink } from "react-router";
import { links } from "../links";
import Logo from "./Logo";

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-8 border-r border-line bg-panel p-5 md:flex">
      <Logo />

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                isActive ? "bg-panel-light text-text" : "text-muted hover:text-text"
              }`
            }
          >
            <link.icon size={20} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
