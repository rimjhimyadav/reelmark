import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
// the font comes from npm instead of google fonts, so it also works in the wrapped picture
import "@fontsource-variable/inter";
// tall, narrow font for page titles and the logo, like the letters on a cinema sign
import "@fontsource-variable/big-shoulders-display";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* basename is "/reelmark/" so links work on github pages */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
