/* Regeln für das Formular „Übung bearbeiten“ – ohne Bildschirmzugriff, damit testbar. */
import type { Einstellungen, Uebung } from "./typen";

/** Grenzen der Zahlenfelder einer Übung. */
export const GRENZEN = {
  reps: { min: 1, max: 50, schritt: 1 },
  hold: { min: 1, max: 120, schritt: 1 },
  sets: { min: 1, max: 10, schritt: 1 },
} as const;

export type EigeneZeit = "tempo" | "lower" | "setPause";

export const ZEIT_LABEL: Record<EigeneZeit, string> = {
  tempo: "Tempo",
  lower: "Absenken",
  setPause: "Satzpause",
};

/** Welche eigenen Zeiten für diese Übung eine Rolle spielen. */
export function relevanteZeiten(u: Uebung): EigeneZeit[] {
  const z: EigeneZeit[] = [];
  if (u.art === "reps") z.push("tempo");
  if (u.art === "hold") z.push("lower");
  if (u.sets > 1) z.push("setPause");
  return z;
}

/** Text unter „Eigene Zeiten“ im zugeklappten Zustand. */
export function eigeneZeitenText(u: Uebung): string {
  const zeiten = relevanteZeiten(u);
  const eigene = zeiten.filter((k) => u[k] !== undefined);
  if (eigene.length) return eigene.map((k) => `${ZEIT_LABEL[k]} ${u[k]} s`).join(" · ");
  const namen = zeiten.map((k) => ZEIT_LABEL[k]);
  const liste = namen.length > 1 ? `${namen.slice(0, -1).join(", ")} und ${namen.at(-1)}` : namen[0];
  return `${liste} wie in den Einstellungen`;
}

/** Wert einer eigenen Zeit, sonst der Standard aus den Einstellungen. */
export function zeitWert(u: Uebung, k: EigeneZeit, einst: Einstellungen): number {
  return u[k] ?? einst[k];
}

/** Hält eine Zahl innerhalb von Grenzen. */
export function begrenzen(wert: number, g: { min: number; max: number }): number {
  return Math.min(g.max, Math.max(g.min, wert));
}
