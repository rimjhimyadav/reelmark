import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import Library from "./pages/Library";
import UpNext from "./pages/UpNext";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  const navigate = useNavigate();

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
      <main className="px-4 pt-6 pb-24 md:pl-68 md:pr-8 md:pt-8 md:pb-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/up-next" element={<UpNext />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
