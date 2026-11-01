import { useEffect, useState } from "react";
import { getPosterColor } from "../posterColor";

// the main color of a TMDB picture (null until it's ready, or if the picture has no real color)
export default function usePosterColor(path) {
  const [result, setResult] = useState({ path: null, color: null });

  useEffect(() => {
    let active = true;
    getPosterColor(path).then((color) => {
      if (active) setResult({ path, color });
    });
    return () => {
      active = false;
    };
  }, [path]);

  // only return the color of the picture we were asked about, never the last one
  return result.path === path ? result.color : null;
}

// same, but also tints the whole page (the glow behind everything) while this component is on screen
export function useAmbientColor(path) {
  const color = usePosterColor(path);

  useEffect(() => {
    if (!color) return;
    document.documentElement.style.setProperty("--color-ambient", color);
  }, [color]);

  // while this page is open, the color clouds behind plain pages step aside (see .aurora in index.css).
  // leaving the page: fade the glow back out and bring the clouds back
  useEffect(() => {
    document.documentElement.dataset.ambient = "";
    return () => {
      delete document.documentElement.dataset.ambient;
      document.documentElement.style.setProperty("--color-ambient", "transparent");
    };
  }, []);

  return color;
}
