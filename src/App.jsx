import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import { useSettings } from "./store/settings";
import { applyAccent } from "./accents";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Browse from "./pages/Browse";
import Search from "./pages/Search";
import DetailsPage from "./pages/Details";
import Library from "./pages/Library";
import UpNext from "./pages/UpNext";
import Calendar from "./pages/Calendar";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarCollapsed = useSettings((state) => state.sidebarCollapsed);
  const accent = useSettings((state) => state.accent);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  // when you open a new page, start at the top (react router doesn't do this by itself)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // ctrl + k (or cmd + k on mac) opens search from any page
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault(); // the browser uses ctrl + k for its own search bar
        navigate("/search");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <Sidebar />
      <MobileNav />

      {/* left padding leaves space for the sidebar, bottom padding for the bottom bar on phones */}
      <main
        className={`px-4 pt-6 pb-24 transition-[padding] md:pr-8 md:pt-8 md:pb-12 ${
          sidebarCollapsed ? "md:pl-28" : "md:pl-68"
        }`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/all" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<DetailsPage type="movie" />} />
          <Route path="/tv/:id" element={<DetailsPage type="tv" />} />
          <Route path="/library" element={<Library />} />
          <Route path="/up-next" element={<UpNext />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
