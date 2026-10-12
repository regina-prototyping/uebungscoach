import type { AnsageModus } from "./logik/spieler";
import type { Einstellungen } from "./logik/typen";

export const STANDARD: Einstellungen = { tempo: 3, prep: 5, setPause: 30, lower: 3 };

const KEY = "uebungscoach-settings";

/** Liest die Einstellungen aus dem Browser; fehlende Werte kommen aus STANDARD. */
export function ladeEinstellungen(): Einstellungen {
  try {
    return { ...STANDARD, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...STANDARD };
  }
}

export function speichereEinstellungen(e: Einstellungen): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    // z. B. privater Modus: dann gelten die Werte nur bis zum Neuladen
  }
}

export interface Feld {
  key: keyof Einstellungen;
  label: string;
  hilfe: string;
  min: number;
  max: number;
  schritt: number;
}

/** Die vier einstellbaren Werte mit erlaubtem Bereich. */
export const FELDER: Feld[] = [
  { key: "tempo", label: "Tempo", hilfe: "Sekunden pro Wiederholung", min: 1, max: 10, schritt: 1 },
  { key: "prep", label: "Vorbereitung", hilfe: "Sekunden vor jeder Übung", min: 3, max: 30, schritt: 1 },
  { key: "setPause", label: "Satzpause", hilfe: "Sekunden zwischen zwei Sätzen", min: 5, max: 120, schritt: 5 },
  { key: "lower", label: "Absenken", hilfe: "Sekunden zwischen Haltephasen", min: 1, max: 10, schritt: 1 },
];

/** Erhöht (+1) oder verringert (−1) einen Wert um einen Schritt, innerhalb der Grenzen. */
export function aendern(e: Einstellungen, key: keyof Einstellungen, richtung: 1 | -1): Einstellungen {
  const f = FELDER.find((x) => x.key === key)!;
  return { ...e, [key]: Math.min(f.max, Math.max(f.min, e[key] + f.schritt * richtung)) };
}

const MODUS_KEY = "uebungscoach-ansagen";

export function ladeAnsageModus(): AnsageModus {
  try {
    return localStorage.getItem(MODUS_KEY) === "toene" ? "toene" : "sprache";
  } catch {
    return "sprache";
  }
}

export function speichereAnsageModus(m: AnsageModus): void {
  try {
    localStorage.setItem(MODUS_KEY, m);
  } catch {
    // privater Modus: gilt bis zum Neuladen
  }
}
