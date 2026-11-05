import { Bookmark, Check, CirclePause, Eye, EyeOff, RotateCcw, type LucideIcon } from "lucide-react";
import type { StatusKey } from "./types";

export interface Status {
  key: StatusKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  text: string;
  badge: string;
}

// every title in your library has one of these
// each status has its own color so you can tell them apart at a glance
// (the class names are written out in full, tailwind can't find classes that are built from pieces)
export const STATUSES: Status[] = [
  {
    key: "watching",
    label: "Watching",
    hint: "Shows up in Up Next.",
    icon: Eye,
    text: "text-sky-400",
    badge: "bg-sky-500 text-white",
  },
  {
    key: "plan",
    label: "Plan to watch",
    hint: "Save it for later.",
    icon: Bookmark,
    text: "text-zinc-300",
    badge: "bg-zinc-500 text-white",
  },
  {
    key: "completed",
    label: "Completed",
    hint: "You finished it.",
    icon: Check,
    text: "text-emerald-400",
    badge: "bg-emerald-600 text-white",
  },
  {
    key: "on_hold",
    label: "On hold",
    hint: "Taking a break from it.",
    icon: CirclePause,
    text: "text-amber-400",
    badge: "bg-amber-400 text-black",
  },
  {
    key: "dropped",
    label: "Dropped",
    hint: "You stopped watching.",
    icon: EyeOff,
    text: "text-rose-400",
    badge: "bg-rose-500 text-white",
  },
  {
    key: "rewatching",
    label: "Rewatching",
    hint: "Watching it again.",
    icon: RotateCcw,
    text: "text-fuchsia-400",
    badge: "bg-fuchsia-500 text-white",
  },
];

export function getStatus(key: StatusKey) {
  return STATUSES.find((status) => status.key === key)!;
}
