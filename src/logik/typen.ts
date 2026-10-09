/** Art einer Übung: Wiederholungen, pro Seite oder Halten. */
export type UebungsTyp = "reps" | "sides" | "hold";

export interface Uebung {
  name: string;
  /** Wird vor der Übung angesagt, z. B. „Bauch einziehen“. */
  hint?: string;
  type: UebungsTyp;
  /** Wiederholungen je Satz (bei „sides“: je Seite). */
  reps: number;
  /** Haltedauer in Sekunden, nur bei „hold“. */
  hold?: number;
  sets: number;
  /** Eigene Werte; fehlen sie, gelten die globalen Einstellungen. */
  tempo?: number;
  setPause?: number;
  lower?: number;
}

export interface Programm {
  id: string;
  name: string;
  /** Startposition, wird ganz am Anfang angesagt. */
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
