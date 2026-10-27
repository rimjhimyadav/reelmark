import { Bookmark, Check, CirclePause, Eye, EyeOff, RotateCcw } from "lucide-react";

// every title in your library has one of these
export const STATUSES = [
  { key: "watching", label: "Watching", hint: "Shows up in Up Next.", icon: Eye },
  { key: "plan", label: "Plan to watch", hint: "Save it for later.", icon: Bookmark },
  { key: "completed", label: "Completed", hint: "You finished it.", icon: Check },
  { key: "on_hold", label: "On hold", hint: "Taking a break from it.", icon: CirclePause },
  { key: "dropped", label: "Dropped", hint: "You stopped watching.", icon: EyeOff },
  { key: "rewatching", label: "Rewatching", hint: "Watching it again.", icon: RotateCcw },
];

export function getStatus(key) {
  return STATUSES.find((status) => status.key === key);
}
