// main colors you can pick in settings
// "text" is the color of text that sits on top of the main color (like on buttons):
// white on dark colors, dark navy on light ones so it's still easy to read
const DARK = "#0a0e1f";

export const ACCENTS = [
  { key: "violet", label: "Violet", color: "#7c5cff", text: "#ffffff" },
  { key: "lavender", label: "Lavender", color: "#a78bfa", text: DARK },
  { key: "blue", label: "Blue", color: "#3b82f6", text: "#ffffff" },
  { key: "sky", label: "Sky", color: "#38bdf8", text: DARK },
  { key: "cyan", label: "Cyan", color: "#22d3ee", text: DARK },
  { key: "teal", label: "Teal", color: "#2dd4bf", text: DARK },

  { key: "mint", label: "Mint", color: "#6ee7b7", text: DARK },
  { key: "green", label: "Green", color: "#4ade80", text: DARK },
  { key: "yellow", label: "Yellow", color: "#facc15", text: DARK },
  { key: "gold", label: "Gold", color: "#f5b041", text: DARK },
  { key: "orange", label: "Orange", color: "#fb923c", text: DARK },
  { key: "coral", label: "Coral", color: "#ff6b5b", text: DARK },

  { key: "red", label: "Red", color: "#ef4444", text: "#ffffff" },
  { key: "rose", label: "Rose", color: "#fb7185", text: DARK },
  { key: "pink", label: "Pink", color: "#f472b6", text: DARK },
  { key: "fuchsia", label: "Fuchsia", color: "#d946ef", text: "#ffffff" },
  { key: "peach", label: "Peach", color: "#ffc4a3", text: DARK },
  { key: "snow", label: "Snow", color: "#f4f4f5", text: DARK },
];

// tailwind reads the main color from these css variables (see index.css),
// so changing them recolors every button, bar and the glow behind the page
export function applyAccent(key) {
  const accent = ACCENTS.find((item) => item.key === key) || ACCENTS[0];
  document.documentElement.style.setProperty("--color-accent", accent.color);
  document.documentElement.style.setProperty("--color-accent-text", accent.text);
}
