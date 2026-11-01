import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import TopBar from "./components/TopBar";
import Aurora from "./components/Aurora";
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
import Wrapped from "./pages/Wrapped";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const accent = useSettings((state) => state.accent);

  // the main color you picked in settings
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
      <Aurora />
      <TopBar />
      <MobileNav />

      {/* the padding is kept in css variables, so big pictures (the home banner, the details header)
          can use "bleed" to cancel it and go edge to edge. top padding leaves space for the top bar,
          bottom padding for the bottom bar on phones */}
      <main className="mx-auto max-w-[1800px] px-(--page-x) pt-(--page-top) pb-24 [--page-top:5rem] [--page-x:1rem] md:pb-12 md:[--page-top:7rem] md:[--page-x:2.5rem]">
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
          <Route path="/wrapped" element={<Wrapped />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
