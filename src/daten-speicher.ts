import { MITGELIEFERT } from "./data/programme";
import { sindGueltig } from "./logik/daten";
import type { Daten } from "./logik/typen";

const KEY = "uebungscoach-daten";

/** Lädt Übungen und Programme; beim ersten Start die mitgelieferten. */
export function ladeDaten(): Daten {
  try {
    const roh = localStorage.getItem(KEY);
    if (roh) {
      const d: unknown = JSON.parse(roh);
      if (sindGueltig(d)) return d;
    }
  } catch {
    // kaputte oder nicht lesbare Daten: mitgelieferte verwenden
  }
  return structuredClone(MITGELIEFERT);
}

export function speichereDaten(d: Daten): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // z. B. privater Modus: Änderungen gelten nur bis zum Neuladen
  }
}

/** Bittet den Browser, die Daten nicht bei Speichermangel zu löschen. */
export function datenDauerhaftAufheben(): void {
  void navigator.storage?.persist?.().catch(() => {});
}
