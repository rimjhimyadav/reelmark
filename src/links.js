import { CalendarDays, ChartColumn, Compass, House, LibraryBig, ListVideo, Search, Settings } from "lucide-react";

// pages shown in the sidebar (desktop) and the bottom bar (mobile)
// "mobile: false" means it doesn't fit in the bottom bar, so it goes in the top bar instead
export const links = [
  { to: "/", label: "Home", icon: House },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: LibraryBig },
  { to: "/up-next", label: "Up Next", icon: ListVideo },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, mobile: false },
  { to: "/stats", label: "Stats", icon: ChartColumn, mobile: false },
  { to: "/settings", label: "Settings", icon: Settings, mobile: false },
];
