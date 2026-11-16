import { MITGELIEFERT } from "./data/programme";
import { sindGueltig } from "./logik/daten";
import type { Daten } from "./logik/typen";
import { istVerlauf, LEERER_VERLAUF, type Verlauf } from "./logik/verlauf";

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

const VERLAUF_KEY = "uebungscoach-verlauf";

/** Lädt den Trainingsverlauf (leer, wenn noch nichts gespeichert ist). */
export function ladeVerlauf(): Verlauf {
  try {
    const roh = localStorage.getItem(VERLAUF_KEY);
    if (roh) {
      const v: unknown = JSON.parse(roh);
      if (istVerlauf(v)) return v;
    }
  } catch {
    // nicht lesbar: leer beginnen
  }
  return LEERER_VERLAUF;
}

export function speichereVerlauf(v: Verlauf): void {
  try {
    localStorage.setItem(VERLAUF_KEY, JSON.stringify(v));
  } catch {
    // z. B. privater Modus
  }
}
