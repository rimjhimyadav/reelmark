// 135 -> "2h 15m"
export function formatRuntime(minutes) {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

// 1 -> "1 season", 3 -> "3 seasons"
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// today as "2026-10-27" in your own timezone (same format TMDB uses for dates)
export function todayString() {
  return new Date().toLocaleDateString("en-CA");
}

// "2026-11-03" -> "3 Nov 2026"
export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
