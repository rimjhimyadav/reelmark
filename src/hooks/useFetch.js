import { useEffect, useState } from "react";

// runs an api function when the component shows up and keeps the result in state
// "load" has to be a function from api/tmdb.js (or wrapped in useCallback),
// otherwise it would run again on every render
export default function useFetch(load) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false; // true if the component is gone before the request finishes

    load()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch(() => {
        if (!ignore) setError(true);
      });

    return () => {
      ignore = true;
    };
  }, [load]);

  return { data, error, loading: !data && !error };
}
