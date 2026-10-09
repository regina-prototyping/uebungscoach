import type { Programm } from "../logik/typen";

/**
 * Alle Trainingsprogramme. Ein neues Programm ist nur ein neuer Eintrag hier.
 * Optionale Zeitwerte (tempo, setPause, lower) überschreiben die Einstellungen.
 */
export const PROGRAMME: Programm[] = [
  {
    id: "ruecken",
    name: "Rücken",
    start: "Auf dem Rücken liegen",
    exercises: [
      { name: "Becken kippen", hint: "Bauch einziehen", type: "reps", reps: 15, sets: 2 },
      { name: "Beine seitlich kippen", type: "sides", reps: 5, sets: 2 },
      { name: "Brücke", hint: "Oben halten", type: "hold", reps: 10, hold: 5, sets: 2 },
    ],
  },
  {
    id: "arme",
    name: "Arme mit Theraband",
    exercises: [],
  },
];
