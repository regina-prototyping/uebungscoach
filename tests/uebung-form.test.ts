import { describe, expect, it } from "vitest";
import { MITGELIEFERT } from "../src/data/programme";
import { findeProgramm, findeUebung, uebungAnlegen, uebungAufraeumen, uebungHinzufuegen } from "../src/logik/daten";
import type { Uebung } from "../src/logik/typen";
import { eigeneZeitenText, relevanteZeiten, zeitWert } from "../src/logik/uebung-form";

const STANDARD = { tempo: 3, prep: 5, setPause: 30, lower: 3 };
const u = (x: Partial<Uebung>): Uebung => ({ id: "a", name: "A", art: "reps", proSeite: false, reps: 10, sets: 2, ...x });

describe("Eigene Zeiten", () => {
  it("zeigt je nach Art und Sätzen nur passende Felder", () => {
    expect(relevanteZeiten(u({ art: "reps", sets: 2 }))).toEqual(["tempo", "setPause"]);
    expect(relevanteZeiten(u({ art: "hold", sets: 2 }))).toEqual(["lower", "setPause"]);
    expect(relevanteZeiten(u({ art: "hold", sets: 1 }))).toEqual(["lower"]);
  });

  it("beschreibt den zugeklappten Zustand", () => {
    expect(eigeneZeitenText(u({ art: "hold" }))).toBe("Absenken und Satzpause wie in den Einstellungen");
    expect(eigeneZeitenText(u({ sets: 1 }))).toBe("Tempo wie in den Einstellungen");
    expect(eigeneZeitenText(u({ art: "hold", setPause: 45 }))).toBe("Satzpause 45 s");
    expect(eigeneZeitenText(u({ tempo: 4, setPause: 60 }))).toBe("Tempo 4 s · Satzpause 60 s");
  });

  it("ignoriert eigene Zeiten, die zur Art nicht passen", () => {
    expect(eigeneZeitenText(u({ art: "hold", tempo: 5 }))).toBe("Absenken und Satzpause wie in den Einstellungen");
  });

  it("nimmt ohne eigenen Wert den Standard", () => {
    expect(zeitWert(u({}), "tempo", STANDARD)).toBe(3);
    expect(zeitWert(u({ tempo: 5 }), "tempo", STANDARD)).toBe(5);
  });
});

describe("Neue Übung aufräumen", () => {
  it("verwirft eine Übung ohne Namen und entfernt sie aus Programmen", () => {
    const { daten, id } = uebungAnlegen(MITGELIEFERT);
    const d = uebungAufraeumen(uebungHinzufuegen(daten, "erstes", id), id);
    expect(findeUebung(d, id)).toBeUndefined();
    expect(findeProgramm(d, "erstes")!.uebungen).toEqual(findeProgramm(MITGELIEFERT, "erstes")!.uebungen);
  });

  it("behält Übungen mit Namen", () => {
    const { daten, id } = uebungAnlegen(MITGELIEFERT, { name: "Seitstütz" });
    expect(uebungAufraeumen(daten, id)).toBe(daten);
  });
});
