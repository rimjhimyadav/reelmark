// finds the main "pop" color of a poster or backdrop, so the page can glow in the colors of what you're looking at.
// it draws a tiny copy of the picture on a canvas and picks the most colorful shade that shows up a lot.
// TMDB allows this (their images send the CORS header), the same thing the wrapped card relies on.
import { imageUrl } from "./api/tmdb";

// colors we already found, so going back to a title doesn't do the work again
const cache: Record<string, Promise<string | null>> = {};

export function getPosterColor(path: string | null | undefined): Promise<string | null> {
  if (!path) return Promise.resolve(null);
  if (!cache[path]) {
    cache[path] = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(pickColor(img));
      img.onerror = () => resolve(null);
      img.src = imageUrl(path, "w92")!; // the smallest size is plenty
    });
  }
  return cache[path];
}

function pickColor(img: HTMLImageElement) {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(img, 0, 0, size, size);

  let pixels;
  try {
    pixels = context.getImageData(0, 0, size, size).data;
  } catch {
    return null; // the browser said no (no CORS), just skip the color
  }

  // group similar colors by hue (12 groups), and score each group by how colorful and how common it is
  const groups = Array.from({ length: 12 }, () => ({ score: 0, r: 0, g: 0, b: 0, count: 0 }));
  for (let i = 0; i < pixels.length; i += 4) {
    const [h, s, l] = toHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (l < 0.12 || l > 0.9 || s < 0.2) continue; // skip near black, near white and greys
    const group = groups[Math.floor(h * 12) % 12];
    group.score += s * (1 - Math.abs(l - 0.5));
    group.r += pixels[i];
    group.g += pixels[i + 1];
    group.b += pixels[i + 2];
    group.count++;
  }

  const best = groups.reduce((a, b) => (b.score > a.score ? b : a));
  if (best.count < 8) return null; // a black and white poster, no real color in it

  // average the group, then push it to a bright, glowy version that looks good on the dark navy
  const [h, s] = toHsl(best.r / best.count, best.g / best.count, best.b / best.count);
  return hslToRgb(h, Math.max(s, 0.6), 0.62);
}

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number) {
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `rgb(${f(0)} ${f(8)} ${f(4)})`;
}
