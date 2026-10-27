import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // the site lives at rimjhimyadav.github.io/reelmark/
  base: "/reelmark/",
});
