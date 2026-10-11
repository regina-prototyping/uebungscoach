import type { Daten } from "../logik/typen";

/**
 * Mitgelieferte Übungen und Programme. Die App übernimmt sie beim ersten Start
 * in den Speicher des Browsers; danach gilt nur noch die gespeicherte Fassung.
 */
export const MITGELIEFERT: Daten = {
  version: 1,
  uebungen: [
    { id: "becken-kippen", name: "Becken kippen", hint: "Bauch einziehen", art: "reps", proSeite: false, reps: 15, sets: 2 },
    { id: "beine-seitlich-kippen", name: "Beine seitlich kippen", art: "reps", proSeite: true, reps: 5, sets: 2 },
    { id: "bruecke", name: "Brücke", hint: "Oben halten", art: "hold", proSeite: false, reps: 10, hold: 5, sets: 2 },
  ],
  programme: [
    {
      id: "ruecken",
      name: "Rücken",
      start: "Auf dem Rücken liegen",
      uebungen: ["becken-kippen", "beine-seitlich-kippen", "bruecke"],
    },
    { id: "arme", name: "Arme mit Theraband", uebungen: [] },
  ],
};
