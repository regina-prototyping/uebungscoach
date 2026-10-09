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
