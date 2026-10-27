import { useCallback } from "react";
import { getRecommendations } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import { itemKey, useLibrary } from "../store/library";
import { PosterRow } from "./Row";

// recommendations based on the last thing you watched or finished
export default function BecauseYouWatched() {
  const items = useLibrary((state) => state.items);

  const lastWatched = Object.values(items)
    .filter((item) => item.status === "watching" || item.status === "completed")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  if (!lastWatched) return null;
  // key: load new recommendations when the title changes
  return <Recommendations key={itemKey(lastWatched.type, lastWatched.id)} title={lastWatched} library={items} />;
}

function Recommendations({ title, library }) {
  const load = useCallback(() => getRecommendations(title.type, title.id), [title.type, title.id]);
  const { data, error } = useFetch(load);
  if (error) return null;

  // no point recommending things you already track
  const fresh = data && data.filter((item) => !library[itemKey(item.type, item.id)]);
  if (fresh && fresh.length === 0) return null;

  return <PosterRow label="For you" title={`Because you watched ${title.title}`} items={fresh} />;
}
