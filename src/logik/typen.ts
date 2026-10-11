/** Art einer Übung: mitzählen (Wiederholungen) oder Countdown (Halten). */
export type Art = "reps" | "hold";

export interface Uebung {
  /** Eindeutige Kennung; Programme verweisen über sie auf die Übung. */
  id: string;
  name: string;
  /** Wird vor der Übung angesagt, z. B. „Bauch einziehen“. */
  hint?: string;
  art: Art;
  /** Jeden Satz erst links, dann rechts. */
  proSeite: boolean;
  /** Wiederholungen je Satz (bei „pro Seite“: je Seite). */
  reps: number;
  /** Haltedauer in Sekunden, nur bei „hold“. */
  hold?: number;
  sets: number;
  /** Eigene Werte; fehlen sie, gelten die globalen Einstellungen. */
  tempo?: number;
  setPause?: number;
  lower?: number;
}

/** Gespeichertes Programm: verweist per ID auf Übungen der Bibliothek. */
export interface Programm {
  id: string;
  name: string;
  /** Startposition, wird ganz am Anfang angesagt. */
  start?: string;
  /** IDs der Übungen in Reihenfolge; dieselbe ID darf mehrfach vorkommen. */
  uebungen: string[];
}

/** Alles, was die App speichert (außer den Einstellungen). */
export interface Daten {
  version: 1;
  uebungen: Uebung[];
  programme: Programm[];
}

/** Programm mit eingesetzten Übungen – so, wie Ablauf und Anzeige es brauchen. */
export interface Trainingsplan {
  id: string;
  name: string;
  start?: string;
  exercises: Uebung[];
}

/** Globale Standardwerte in Sekunden. */
export interface Einstellungen {
  tempo: number;
  prep: number;
  setPause: number;
  lower: number;
}

export type Seite = "links" | "rechts";

export type AbschnittArt = "prep" | "side" | "rep" | "hold" | "lower" | "pause" | "done";

/** Ein Stück des Trainings mit fester Dauer und Ansage. */
export interface Abschnitt {
  kind: AbschnittArt;
  /** Index der Übung im Programm. */
  ex: number;
  /** Nummer des Satzes, beginnend bei 1. */
  set: number;
  /** Dauer in Sekunden. */
  dur: number;
  /** Text, der zu Beginn des Abschnitts angesagt wird. */
  say: string;
  rep?: number;
  side?: Seite;
}
