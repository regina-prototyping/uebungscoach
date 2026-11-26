import type { Wochenreihe } from "../logik/verlauf";

/** Obergrenze der y-Achse: mindestens 4, gerade, damit die Mittellinie eine ganze Zahl ist. */
export function obergrenze(r: Wochenreihe): number {
  const max = Math.max(...r.wochen.map((w) => w.anzahl));
  return Math.max(4, max + (max % 2));
}

/** Punkte der Linie in einem Feld der Größe b × h (innen). */
function punkte(r: Wochenreihe, links: number, oben: number, b: number, h: number, max = obergrenze(r)) {
  const n = r.wochen.length;
  return r.wochen.map((w, i) => ({ x: links + (n > 1 ? (i * b) / (n - 1) : b / 2), y: oben + h - (w.anzahl / max) * h, w }));
}

const pfad = (ps: { x: number; y: number }[]) => ps.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/** Unsichtbare Liste für Screenreader: eine Zeile je Woche. */
function srListe(r: Wochenreihe): string {
  return `<ul class="sr-only">${r.wochen.map((w) => `<li>${w.label}</li>`).join("")}</ul>`;
}

/**
 * Liniendiagramm „Trainings pro Woche“: eine Linie mit Punkt je Woche, die Zahl über dem Punkt.
 * Die laufende Woche ist ein offener Punkt mit gestricheltem Stück, weil sie noch nicht fertig ist.
 */
export function wochenDiagramm(r: Wochenreihe): string {
  const B = 360, H = 168;
  const links = 22, rechts = 10, oben = 24, unten = 28;
  const ib = B - links - rechts, ih = H - oben - unten;
  const max = obergrenze(r);
  const ps = punkte(r, links, oben, ib, ih);
  const fertig = ps.slice(0, -1);
  const letzte = ps.slice(-2);
  const linien = [0, max / 2, max]
    .map((v) => {
      const y = oben + ih - (v / max) * ih;
      return `<line class="wd-gitter" x1="${links}" x2="${B - rechts}" y1="${y}" y2="${y}"/><text class="wd-achse" x="${links - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
    })
    .join("");
  const flaeche = `${pfad(ps)} L${ps[ps.length - 1].x.toFixed(1)} ${oben + ih} L${ps[0].x.toFixed(1)} ${oben + ih} Z`;
  const n = ps.length;
  const marken = ps
    .map((p, i) => {
      const zahl = p.w.anzahl ? `<text class="wd-zahl" x="${p.x}" y="${p.y - 10}" text-anchor="middle">${p.w.anzahl}</text>` : "";
      const datum = (n - 1 - i) % 3 === 0 ? `<text class="wd-achse" x="${p.x}" y="${H - 6}" text-anchor="${i === n - 1 ? "end" : "middle"}">${i === n - 1 ? "jetzt" : p.w.kurz}</text>` : "";
      return `<circle class="wd-punkt${p.w.laufend ? " laufend" : ""}" cx="${p.x}" cy="${p.y}" r="${p.w.laufend ? 4.5 : 4}"/>${zahl}${datum}`;
    })
    .join("");
  return `
    <svg class="wochen-diagramm" viewBox="0 0 ${B} ${H}" aria-hidden="true">
      <defs><linearGradient id="wd-verlauf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4A44C2" stop-opacity="0.16"/><stop offset="1" stop-color="#4A44C2" stop-opacity="0"/></linearGradient></defs>
      ${linien}
      <path class="wd-flaeche" d="${flaeche}"/>
      <path class="wd-linie" d="${pfad(fertig)}"/>
      <path class="wd-linie laufend" d="${pfad(letzte)}"/>
      ${marken}
    </svg>${srListe(r)}`;
}

/** Kleine Linie ohne Beschriftung für die Liste „Nach Programm“; `max` gemeinsam für alle Zeilen, damit sie vergleichbar sind. */
export function wochenLinie(r: Wochenreihe, max: number): string {
  const B = 88, H = 32;
  const ps = punkte(r, 3, 4, B - 6, H - 8, max);
  return `<svg class="wochen-linie" viewBox="0 0 ${B} ${H}" aria-hidden="true">
      <path class="wd-linie" d="${pfad(ps.slice(0, -1))}"/><path class="wd-linie laufend" d="${pfad(ps.slice(-2))}"/>
      <circle class="wd-punkt" cx="${ps[ps.length - 1].x}" cy="${ps[ps.length - 1].y}" r="2.5"/>
    </svg>`;
}

/**
 * Flache Fassung für die Startseite: Linie mit Punkten über die ganze Breite,
 * ohne Achsen; nur die Zahl der letzten fertigen Woche und der laufenden steht dabei.
 */
export function wochenKompakt(r: Wochenreihe): string {
  const B = 360, H = 64;
  const ps = punkte(r, 6, 20, B - 12, H - 26);
  const n = ps.length;
  const zahlen = ps
    .slice(-2)
    .map((p, i) => `<text class="wd-zahl" x="${p.x}" y="${p.y - 9}" text-anchor="${i ? "end" : "middle"}">${p.w.anzahl}</text>`)
    .join("");
  const flaeche = `${pfad(ps)} L${ps[n - 1].x.toFixed(1)} ${H - 6} L${ps[0].x.toFixed(1)} ${H - 6} Z`;
  return `
    <svg class="wochen-diagramm" viewBox="0 0 ${B} ${H}" aria-hidden="true">
      <line class="wd-gitter" x1="0" x2="${B}" y1="${H - 6}" y2="${H - 6}"/>
      <path d="${flaeche}" fill="url(#wd-verlauf-k)"/>
      <defs><linearGradient id="wd-verlauf-k" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4A44C2" stop-opacity="0.16"/><stop offset="1" stop-color="#4A44C2" stop-opacity="0"/></linearGradient></defs>
      <path class="wd-linie" d="${pfad(ps.slice(0, -1))}"/>
      <path class="wd-linie laufend" d="${pfad(ps.slice(-2))}"/>
      ${ps.map((p) => `<circle class="wd-punkt${p.w.laufend ? " laufend" : ""}" cx="${p.x}" cy="${p.y}" r="${p.w.laufend ? 3.5 : 3}"/>`).join("")}
      ${zahlen}
    </svg>`;
}
