import { useEffect } from "react";
import { getShowInfo } from "../api/tmdb";
import { itemKey, useLibrary } from "../store/library";

// new episodes may have come out since you added a show, so ask TMDB again
// (used by up next and the calendar)
export default function useRefreshShows(shows) {
  const updateShowInfo = useLibrary((state) => state.updateShowInfo);

  // a list of ids as text, so the effect only runs again when a show is added or removed
  const showIds = shows.map((show) => show.id).join(",");

  useEffect(() => {
    if (!showIds) return;
    for (const id of showIds.split(",")) {
      getShowInfo(id)
        .then((info) => updateShowInfo(itemKey("tv", Number(id)), info))
        .catch(() => {}); // not a big deal, we still have the old info
    }
  }, [showIds, updateShowInfo]);
}
