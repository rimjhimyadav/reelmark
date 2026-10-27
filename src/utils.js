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

// ("2026-10-27", 7) -> "2026-11-03"
export function addDays(dateString, amount) {
  const date = new Date(dateString + "T12:00:00"); // noon, so timezones can't move it to another day
  date.setDate(date.getDate() + amount);
  return date.toLocaleDateString("en-CA");
}

// "2026-11-03" -> "3 Nov 2026"
export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// how long until a release date: "Today", "Tomorrow", "In 5 days", or just the date if it's far away
// today is passed in so tests can pick their own "today"
export function countdown(dateString, today = todayString()) {
  if (!dateString) return "";
  const days = Math.round((new Date(dateString) - new Date(today)) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Out now";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 14) return `In ${days} days`;
  return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
