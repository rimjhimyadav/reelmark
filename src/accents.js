// main colors you can pick in settings
// "text" is the color of text that sits on top of the main color (like on buttons)
export const ACCENTS = [
  { key: "snow", label: "Snow", color: "#f4f4f5", text: "#0e0f13" },
  { key: "coral", label: "Coral", color: "#ff6b5b", text: "#0e0f13" },
  { key: "amber", label: "Amber", color: "#f5b041", text: "#0e0f13" },
  { key: "sky", label: "Sky", color: "#4c8dff", text: "#ffffff" },
  { key: "teal", label: "Teal", color: "#2dd4bf", text: "#0e0f13" },
];

// tailwind reads the main color from these css variables (see index.css),
// so changing them recolors every button and bar in the app
export function applyAccent(key) {
  const accent = ACCENTS.find((a) => a.key === key) || ACCENTS[0];
  document.documentElement.style.setProperty("--color-accent", accent.color);
  document.documentElement.style.setProperty("--color-accent-text", accent.text);
}
