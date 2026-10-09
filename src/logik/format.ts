import type { Uebung } from "./typen";

/** Menge als Kurztext, z. B. „2 × 15“, „2 × 5 je Seite“, „2 × 10 × 5 s“. */
export function dose(e: Uebung): string {
  if (e.type === "hold") return `${e.sets} × ${e.reps} × ${e.hold} s`;
  if (e.type === "sides") return `${e.sets} × ${e.reps} je Seite`;
  return `${e.sets} × ${e.reps}`;
}

/** Menge als Ansagetext, z. B. „2 Sätze, je Seite 5 Wiederholungen.“ */
export function doseSpoken(e: Uebung): string {
  const head = e.sets > 1 ? `${e.sets} Sätze, ` : "";
  if (e.type === "hold") return `${head}${e.reps} Wiederholungen, jeweils ${e.hold} Sekunden halten.`;
  if (e.type === "sides") return `${head}je Seite ${e.reps} Wiederholungen.`;
  return `${head}${e.reps} Wiederholungen.`;
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
