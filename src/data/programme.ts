import type { Daten } from "../logik/typen";

/**
 * Mitgelieferte Übungen und Programme. Die App übernimmt sie beim ersten Start
 * in den Speicher des Browsers; danach gilt nur noch die gespeicherte Fassung.
 * Bewusst neutrale, klassische Übungen als Beispiel zum Ausprobieren.
 */
export const MITGELIEFERT: Daten = {
  version: 1,
  uebungen: [
    { id: "katze-kuh", name: "Katze-Kuh", hint: "Mit dem Atem bewegen", art: "reps", proSeite: false, reps: 15, sets: 2 },
    { id: "vogel-hund", name: "Vogel-Hund", art: "reps", proSeite: true, reps: 5, sets: 2 },
    { id: "bruecke", name: "Brücke", hint: "Oben halten", art: "hold", proSeite: false, reps: 10, hold: 5, sets: 2 },
  ],
  programme: [
    {
      id: "erstes",
      name: "Mein erstes Programm",
      start: "Im Vierfüßlerstand beginnen",
      uebungen: ["katze-kuh", "vogel-hund", "bruecke"],
    },
  ],
};
