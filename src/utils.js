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
