/*
 * Sicherungsdatei: alles, was die App speichert, als eine JSON-Datei.
 * Rein (ohne Browser), damit es sich testen lässt.
 */
import { FELDER, STANDARD } from "../einstellungen";
import { sindGueltig } from "./daten";
import type { AnsageModus } from "./spieler";
import type { Daten, Einstellungen } from "./typen";

/** Aufbau der Datei. `format` erhöhen, wenn sich der Aufbau ändert. */
export interface Sicherung {
  app: "uebungscoach";
  format: 1;
  /** Zeitpunkt der Sicherung (ISO, UTC). */
  erstellt: string;
  daten: Daten;
  einstellungen: Einstellungen;
  ansagen: AnsageModus;
}

export type LeseErgebnis = { ok: true; sicherung: Sicherung } | { ok: false; fehler: string };

export function sicherungErstellen(daten: Daten, einstellungen: Einstellungen, ansagen: AnsageModus, jetzt: Date): Sicherung {
  return { app: "uebungscoach", format: 1, erstellt: jetzt.toISOString(), daten, einstellungen, ansagen };
}

/** Dateiname mit Datum, z. B. „uebungscoach-sicherung-2026-11-12.json“. */
export function dateiname(jetzt: Date, endung = "json"): string {
  const zwei = (n: number) => String(n).padStart(2, "0");
  return `uebungscoach-sicherung-${jetzt.getFullYear()}-${zwei(jetzt.getMonth() + 1)}-${zwei(jetzt.getDate())}.${endung}`;
}

const KEINE_SICHERUNG = "Das ist keine Sicherung vom Übungscoach.";

/** Liest den Text einer Sicherungsdatei und prüft ihn gründlich. */
export function sicherungLesen(text: string): LeseErgebnis {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ok: false, fehler: KEINE_SICHERUNG };
  }
  if (!roh || typeof roh !== "object") return { ok: false, fehler: KEINE_SICHERUNG };
  const s = roh as Record<string, unknown>;
  if (s.app !== "uebungscoach") return { ok: false, fehler: KEINE_SICHERUNG };
  if (typeof s.format === "number" && s.format > 1) {
    return { ok: false, fehler: "Diese Sicherung stammt aus einer neueren App-Version. Bitte die App aktualisieren." };
  }
  if (s.format !== 1 || !sindGueltig(s.daten) || !verweiseStimmen(s.daten)) {
    return { ok: false, fehler: "Die Sicherung ist beschädigt und kann nicht geladen werden." };
  }
  return {
    ok: true,
    sicherung: {
      app: "uebungscoach",
      format: 1,
      erstellt: typeof s.erstellt === "string" ? s.erstellt : "",
      daten: s.daten,
      einstellungen: einstellungenPruefen(s.einstellungen),
      ansagen: s.ansagen === "toene" ? "toene" : "sprache",
    },
  };
}

/** Jede Übung, auf die ein Programm verweist, muss es geben. */
function verweiseStimmen(d: Daten): boolean {
  const ids = new Set(d.uebungen.map((u) => u.id));
  return d.programme.every((p) => p.uebungen.every((id) => ids.has(id)));
}

/** Übernimmt nur gültige Werte im erlaubten Bereich; sonst gilt der Standard. */
function einstellungenPruefen(x: unknown): Einstellungen {
  const e: Einstellungen = { ...STANDARD };
  if (!x || typeof x !== "object") return e;
  for (const f of FELDER) {
    const v = (x as Record<string, unknown>)[f.key];
    if (typeof v === "number" && Number.isFinite(v)) e[f.key] = Math.min(f.max, Math.max(f.min, v));
  }
  return e;
}

/** Kurzbeschreibung für die Rückfrage, z. B. „vom 12.11.2026, 14:30 · 8 Übungen, 3 Programme“. */
export function beschreibung(s: Sicherung): string {
  const anzahl = (n: number, eins: string, mehr: string) => `${n} ${n === 1 ? eins : mehr}`;
  const inhalt = `${anzahl(s.daten.uebungen.length, "Übung", "Übungen")}, ${anzahl(s.daten.programme.length, "Programm", "Programme")}`;
  const d = new Date(s.erstellt);
  if (!s.erstellt || Number.isNaN(d.getTime())) return inhalt;
  const zwei = (n: number) => String(n).padStart(2, "0");
  const wann = `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()}, ${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
  return `vom ${wann} · ${inhalt}`;
}
