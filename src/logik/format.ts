import type { Uebung } from "./typen";

/** Menge als Kurztext, z. B. „2 × 15“, „2 × 5 je Seite“, „2 × 10 × 5 s“. */
export function dose(e: Uebung): string {
  return `${e.sets} × ${satzMenge(e)}`;
}

/** Menge eines Satzes, z. B. „15“, „5 je Seite“, „10 × 5 s“. */
export function satzMenge(e: Uebung): string {
  const seite = e.proSeite ? " je Seite" : "";
  if (e.art === "hold") return `${e.reps} × ${e.hold} s${seite}`;
  return `${e.reps}${seite}`;
}

/** Menge als Ansagetext, z. B. „2 Sätze, je Seite 5 Wiederholungen.“ */
export function doseSpoken(e: Uebung): string {
  const head = e.sets > 1 ? `${e.sets} Sätze, ` : "";
  const seite = e.proSeite ? "je Seite " : "";
  if (e.art === "hold") return `${head}${seite}${e.reps} Wiederholungen, jeweils ${e.hold} Sekunden halten.`;
  return `${head}${seite}${e.reps} Wiederholungen.`;
}

/** Sekunden als „m:ss“. */
export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Grobe Schätzung, wie lange eine Ansage dauert (Sekunden). */
export function speechSecs(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 0.45);
}
