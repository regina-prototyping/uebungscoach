/*
 * Trainingsverlauf: welche Trainings wann abgeschlossen wurden.
 * Rein (ohne Browser), damit es sich testen lässt. Ein Training zählt erst,
 * wenn es bis „Training geschafft“ durchgelaufen ist.
 * Gespeichert wird jedes Training einzeln mit Zeitpunkt – daraus lassen sich
 * später auch andere Auswertungen berechnen (z. B. Trainings pro Woche).
 */
import type { Daten, Trainingsplan } from "./typen";

export interface Training {
  programmId: string;
  /** Name zum Zeitpunkt des Trainings (falls das Programm später gelöscht wird). */
  name: string;
  /** Zeitpunkt des Abschlusses (ISO, UTC). */
  zeit: string;
}

export interface Verlauf {
  version: 1;
  trainings: Training[];
}

export const LEERER_VERLAUF: Verlauf = { version: 1, trainings: [] };

export function istVerlauf(x: unknown): x is Verlauf {
  if (!x || typeof x !== "object") return false;
  const v = x as Verlauf;
  return (
    v.version === 1 &&
    Array.isArray(v.trainings) &&
    v.trainings.every(
      (t) => typeof t?.programmId === "string" && typeof t.name === "string" && typeof t.zeit === "string" && !Number.isNaN(Date.parse(t.zeit)),
    )
  );
}

export function trainingEintragen(v: Verlauf, plan: Pick<Trainingsplan, "id" | "name">, jetzt: Date): Verlauf {
  return { ...v, trainings: [...v.trainings, { programmId: plan.id, name: plan.name, zeit: jetzt.toISOString() }] };
}

/* ---------- Tage ---------- */

/** Kalendertag in der Zeitzone des Geräts, z. B. „2026-11-16“. */
export function tagSchluessel(d: Date): string {
  const zwei = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

/** Datum ohne Uhrzeit, `n` Tage verschoben. */
function tagPlus(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Anzahl Trainings je Tag, optional nur für ein Programm. */
export function trainingsProTag(v: Verlauf, programmId?: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of v.trainings) {
    if (programmId && t.programmId !== programmId) continue;
    const k = tagSchluessel(new Date(t.zeit));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** Erster Buchstabe des Wochentags, Montag zuerst. */
const WOCHENTAG = ["S", "M", "D", "M", "D", "F", "S"];
const WOCHENTAG_LANG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONAT = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/* ---------- Programme oben auf der Startseite ---------- */

export const MAX_ANGEHEFTET = 2;

/** Heftet ein Programm an bzw. löst es. Beim dritten fällt das am längsten angeheftete heraus. */
export function anheftenUmschalten(d: Daten, programmId: string): Daten {
  const alt = d.angeheftet ?? [];
  const neu = alt.includes(programmId) ? alt.filter((id) => id !== programmId) : [...alt, programmId].slice(-MAX_ANGEHEFTET);
  return { ...d, angeheftet: neu };
}

export function istAngeheftet(d: Daten, programmId: string): boolean {
  return (d.angeheftet ?? []).includes(programmId);
}

/**
 * Die (bis zu) zwei Programme, die oben groß stehen: zuerst die angehefteten,
 * dann die zuletzt trainierten, dann die ersten der Liste – nur Programme mit
 * Übungen. Reihenfolge wie in der Programmliste, damit die Karten nicht springen.
 */
export function obenProgramme(d: Daten, v: Verlauf): string[] {
  const mitUebungen = d.programme.filter((p) => p.uebungen.length > 0).map((p) => p.id);
  const gewaehlt: string[] = [];
  const nimm = (id: string) => {
    if (gewaehlt.length < MAX_ANGEHEFTET && mitUebungen.includes(id) && !gewaehlt.includes(id)) gewaehlt.push(id);
  };
  for (const id of d.angeheftet ?? []) nimm(id);
  const neuesteZuerst = [...v.trainings].sort((a, b) => Date.parse(b.zeit) - Date.parse(a.zeit));
  for (const t of neuesteZuerst) nimm(t.programmId);
  for (const id of mitUebungen) nimm(id);
  return mitUebungen.filter((id) => gewaehlt.includes(id));
}

/* ---------- Raster „Letzte 2 Wochen“ (Startseite) ---------- */

export interface RasterZeile {
  programmId: string;
  name: string;
  /** Ein Eintrag je Tag, ältester zuerst: trainiert ja/nein. */
  tage: boolean[];
  /** Trainings im Zeitraum (zwei am selben Tag zählen zwei). */
  anzahl: number;
}

export interface Raster {
  /** Wochentags-Buchstaben, ältester Tag zuerst. */
  kopf: string[];
  zeilen: RasterZeile[];
  /** Alle Trainings im Zeitraum. */
  gesamt: number;
}

/**
 * Die letzten `tage` Tage bis heute: eine Zeile für jedes Programm oben und
 * für jedes weitere, das im Zeitraum trainiert wurde.
 */
export function raster(d: Daten, v: Verlauf, oben: string[], heute: Date, tage = 14): Raster {
  const schluessel = Array.from({ length: tage }, (_, i) => tagSchluessel(tagPlus(heute, i - tage + 1)));
  const imZeitraum = new Set(schluessel);
  const trainingsIm = v.trainings.filter((t) => imZeitraum.has(tagSchluessel(new Date(t.zeit))));
  const ids = [...oben];
  for (const p of d.programme) {
    if (!ids.includes(p.id) && trainingsIm.some((t) => t.programmId === p.id)) ids.push(p.id);
  }
  const zeilen = ids.flatMap((id): RasterZeile[] => {
    const p = d.programme.find((x) => x.id === id);
    if (!p) return [];
    const proTag = trainingsProTag({ version: 1, trainings: trainingsIm }, id);
    return [
      {
        programmId: id,
        name: p.name || "Ohne Namen",
        tage: schluessel.map((k) => proTag.has(k)),
        anzahl: [...proTag.values()].reduce((a, n) => a + n, 0),
      },
    ];
  });
  return {
    kopf: schluessel.map((_, i) => WOCHENTAG[tagPlus(heute, i - tage + 1).getDay()]),
    zeilen,
    gesamt: trainingsIm.filter((t) => d.programme.some((p) => p.id === t.programmId)).length,
  };
}

/* ---------- Monatskalender (Programm-Ansicht) ---------- */

export interface KalenderTag {
  tag: number;
  /** Trainings an diesem Tag. */
  anzahl: number;
  heute: boolean;
  zukunft: boolean;
  /** Für Screenreader, z. B. „Montag, 16. November: 2 Trainings“. */
  label: string;
}

export interface Kalender {
  /** z. B. „November 2026“. */
  titel: string;
  /** Leere Felder vor dem 1. (Woche beginnt am Montag). */
  versatz: number;
  tage: KalenderTag[];
  /** Trainings und Trainingstage in diesem Monat. */
  trainings: number;
  trainingsTage: number;
}

/** Monat `monat` (0–11) von `jahr` für ein Programm. */
export function kalender(v: Verlauf, programmId: string, jahr: number, monat: number, heute: Date): Kalender {
  const proTag = trainingsProTag(v, programmId);
  const erster = new Date(jahr, monat, 1);
  const anzahlTage = new Date(jahr, monat + 1, 0).getDate();
  const heuteK = tagSchluessel(heute);
  const tage: KalenderTag[] = [];
  for (let t = 1; t <= anzahlTage; t++) {
    const datum = new Date(jahr, monat, t);
    const k = tagSchluessel(datum);
    const anzahl = proTag.get(k) ?? 0;
    const wann = `${WOCHENTAG_LANG[datum.getDay()]}, ${t}. ${MONAT[monat]}`;
    tage.push({
      tag: t,
      anzahl,
      heute: k === heuteK,
      zukunft: k > heuteK,
      label: anzahl ? `${wann}: ${anzahl === 1 ? "trainiert" : `${anzahl} Trainings`}` : wann,
    });
  }
  return {
    titel: `${MONAT[monat]} ${jahr}`,
    versatz: (erster.getDay() + 6) % 7,
    tage,
    trainings: tage.reduce((a, t) => a + t.anzahl, 0),
    trainingsTage: tage.filter((t) => t.anzahl > 0).length,
  };
}

/** Frühester Monat mit einem Training dieses Programms (sonst der aktuelle). */
export function ersterMonat(v: Verlauf, programmId: string, heute: Date): { jahr: number; monat: number } {
  const zeiten = v.trainings.filter((t) => t.programmId === programmId).map((t) => Date.parse(t.zeit));
  const d = zeiten.length ? new Date(Math.min(...zeiten, heute.getTime())) : heute;
  return { jahr: d.getFullYear(), monat: d.getMonth() };
}

/** „zuletzt heute“, „zuletzt gestern“, „zuletzt vor 3 Tagen“, „zuletzt am 2.10.2026“ – oder „noch nicht trainiert“. */
export function zuletztText(v: Verlauf, programmId: string, heute: Date): string {
  const zeiten = v.trainings.filter((t) => t.programmId === programmId).map((t) => Date.parse(t.zeit));
  if (!zeiten.length) return "Noch nicht trainiert";
  const letzte = new Date(Math.max(...zeiten));
  const tage = Math.round((tagPlus(heute, 0).getTime() - tagPlus(letzte, 0).getTime()) / 86_400_000);
  if (tage <= 0) return "zuletzt heute";
  if (tage === 1) return "zuletzt gestern";
  if (tage < 7) return `zuletzt vor ${tage} Tagen`;
  return `zuletzt am ${letzte.getDate()}.${letzte.getMonth() + 1}.${letzte.getFullYear()}`;
}

/** Zusammenfassung unter dem Kalender, z. B. „11 Trainings an 10 Tagen · zuletzt heute“. */
export function kalenderZusammenfassung(k: Kalender, zuletzt: string): string {
  if (!k.trainings) return zuletzt === "Noch nicht trainiert" ? zuletzt : `In diesem Monat kein Training · ${zuletzt}`;
  const tr = k.trainings === 1 ? "1 Training" : `${k.trainings} Trainings`;
  const tg = k.trainingsTage === 1 ? "1 Tag" : `${k.trainingsTage} Tagen`;
  return `${tr} an ${tg} · ${zuletzt}`;
}
