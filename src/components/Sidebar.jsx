import { NavLink } from "react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { links } from "../links";
import { useSettings } from "../store/settings";
import Logo from "./Logo";

// on small screens the sidebar is hidden and MobileNav is used instead
export default function Sidebar() {
  const collapsed = useSettings((state) => state.sidebarCollapsed);
  const toggleSidebar = useSettings((state) => state.toggleSidebar);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col gap-8 border-r border-line bg-panel py-5 transition-[width] md:flex ${
        collapsed ? "w-20 px-3" : "w-60 px-5"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "flex-col gap-4" : "justify-between"}`}>
        <Logo showName={!collapsed} />
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Open sidebar" : "Close sidebar"}
          className="rounded-lg p-1.5 text-muted hover:bg-panel-light hover:text-text"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg py-2.5 font-medium transition-colors ${
                collapsed ? "justify-center" : "px-3"
              } ${isActive ? "bg-panel-light text-text" : "text-muted hover:text-text"}`
            }
          >
            <link.icon size={20} className="shrink-0" />
            {!collapsed && link.label}
            {!collapsed && link.to === "/search" && (
              <kbd className="ml-auto rounded border border-line px-1.5 text-xs text-muted">Ctrl K</kbd>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
