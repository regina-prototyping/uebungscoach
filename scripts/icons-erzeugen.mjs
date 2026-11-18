// Erzeugt die App-Icons (SVG und PNG) in public/icons/.
// Aufruf: node scripts/icons-erzeugen.mjs  (braucht Playwright/Chromium)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { writeFileSync } from "node:fs";

const VON = "#262A80"; // --primary-dark
const NACH = "#4A44C2"; // --primary

// rund = mit abgerundeten Ecken (Browser-Tab, normales Icon);
// randlos = ganze Fläche gefüllt (Android „maskable“, Apple);
// skala = Größe des Motivs (maskable braucht Rand, weil Android zuschneidet)
function svg({ rund, skala = 1 }) {
  const ecke = rund ? ' rx="112"' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="verlauf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${VON}"/>
      <stop offset="1" stop-color="${NACH}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512"${ecke} fill="url(#verlauf)"/>
  <g transform="translate(256 256) scale(${skala}) translate(-256 -256)">
    <circle cx="256" cy="256" r="130" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="30"/>
    <circle cx="256" cy="256" r="130" fill="none" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round"
      stroke-dasharray="571.8 816.8" transform="rotate(-90 256 256)"/>
    <path d="M226 196v120l100-60z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round"/>
  </g>
</svg>
`;
}

const ausgaben = [
  { datei: "icon-192.png", groesse: 192, svg: svg({ rund: true }), transparent: true },
  { datei: "icon-512.png", groesse: 512, svg: svg({ rund: true }), transparent: true },
  { datei: "maskable-512.png", groesse: 512, svg: svg({ rund: false, skala: 0.82 }) },
  { datei: "apple-touch-icon.png", groesse: 180, svg: svg({ rund: false }) },
];

writeFileSync("public/icons/icon.svg", svg({ rund: true }));

const browser = await chromium.launch();
const seite = await browser.newPage({ deviceScaleFactor: 1 });
for (const a of ausgaben) {
  await seite.setViewportSize({ width: a.groesse, height: a.groesse });
  const inhalt = a.svg.replace("<svg ", `<svg width="${a.groesse}" height="${a.groesse}" `);
  await seite.setContent(`<html><body style="margin:0;background:transparent">${inhalt}</body></html>`);
  await seite.screenshot({ path: `public/icons/${a.datei}`, omitBackground: a.transparent ?? false });
}
await browser.close();
console.log("Icons erzeugt.");
