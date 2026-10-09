import { describe, expect, it } from "vitest";
import { MITGELIEFERT } from "../src/data/programme";
import {
  findeProgramm,
  findeUebung,
  programmAendern,
  programmAnlegen,
  programmLoeschen,
  sindGueltig,
  trainingsplan,
  uebungAendern,
  uebungAnlegen,
  uebungDuplizieren,
  uebungEntfernen,
  uebungHinzufuegen,
  uebungLoeschen,
  uebungVerschieben,
  verwendetIn,
} from "../src/logik/daten";
import type { Daten } from "../src/logik/typen";

const d0: Daten = structuredClone(MITGELIEFERT);
const reihenfolge = (d: Daten, id = "ruecken") => findeProgramm(d, id)!.uebungen;

describe("Mitgelieferte Daten", () => {
  it("sind gültig und alle Verweise zeigen auf vorhandene Übungen", () => {
    expect(sindGueltig(MITGELIEFERT)).toBe(true);
    for (const p of MITGELIEFERT.programme) for (const id of p.uebungen) expect(findeUebung(MITGELIEFERT, id)).toBeDefined();
  });

  it("ergeben das Rückenprogramm mit drei Übungen", () => {
    const plan = trainingsplan(MITGELIEFERT, "ruecken")!;
    expect(plan.exercises.map((e) => e.name)).toEqual(["Becken kippen", "Beine seitlich kippen", "Brücke"]);
    expect(plan.start).toBe("Auf dem Rücken liegen");
  });
});

describe("Programme bearbeiten", () => {
  it("verschiebt Übungen nach oben und unten", () => {
    const d = uebungVerschieben(d0, "ruecken", 2, -1);
    expect(reihenfolge(d)).toEqual(["becken-kippen", "bruecke", "beine-seitlich-kippen"]);
    expect(reihenfolge(uebungVerschieben(d, "ruecken", 0, 1))).toEqual(["bruecke", "becken-kippen", "beine-seitlich-kippen"]);
  });

  it("verschiebt nicht über den Rand hinaus", () => {
    expect(reihenfolge(uebungVerschieben(d0, "ruecken", 0, -1))).toEqual(reihenfolge(d0));
    expect(reihenfolge(uebungVerschieben(d0, "ruecken", 2, 1))).toEqual(reihenfolge(d0));
  });

  it("entfernt eine Übung aus dem Programm, aber nicht aus der Bibliothek", () => {
    const d = uebungEntfernen(d0, "ruecken", 1);
    expect(reihenfolge(d)).toEqual(["becken-kippen", "bruecke"]);
    expect(findeUebung(d, "beine-seitlich-kippen")).toBeDefined();
  });

  it("erlaubt dieselbe Übung mehrmals", () => {
    const d = uebungHinzufuegen(d0, "ruecken", "becken-kippen");
    expect(reihenfolge(d)).toEqual(["becken-kippen", "beine-seitlich-kippen", "bruecke", "becken-kippen"]);
    expect(trainingsplan(d, "ruecken")!.exercises).toHaveLength(4);
    // Entfernen trifft nur die eine Stelle
    expect(reihenfolge(uebungEntfernen(d, "ruecken", 3))).toEqual(reihenfolge(d0));
  });

  it("legt ein Programm an, benennt es und löscht es wieder", () => {
    const { daten, id } = programmAnlegen(d0, "Schulter");
    expect(findeProgramm(daten, id)).toMatchObject({ name: "Schulter", uebungen: [] });
    const d2 = programmAendern(daten, id, { name: "Schulter neu", start: "Im Stehen" });
    expect(findeProgramm(d2, id)).toMatchObject({ name: "Schulter neu", start: "Im Stehen" });
    expect(findeProgramm(programmAendern(d2, id, { start: "  " }), id)!.start).toBeUndefined();
    expect(findeProgramm(programmLoeschen(d2, id), id)).toBeUndefined();
  });
});

describe("Übungen bearbeiten", () => {
  it("legt eine Übung mit Standardwerten an", () => {
    const { daten, id } = uebungAnlegen(d0, { name: "Seitstütz" });
    expect(findeUebung(daten, id)).toMatchObject({ name: "Seitstütz", art: "reps", proSeite: false, reps: 10, sets: 2 });
  });

  it("Änderungen an einer Übung gelten in allen Programmen", () => {
    const d = uebungHinzufuegen(d0, "arme", "bruecke");
    const d2 = uebungAendern(d, "bruecke", { reps: 8 });
    expect(trainingsplan(d2, "ruecken")!.exercises[2].reps).toBe(8);
    expect(trainingsplan(d2, "arme")!.exercises[0].reps).toBe(8);
  });

  it("entfernt eine eigene Zeit beim Zurücksetzen", () => {
    const d = uebungAendern(d0, "bruecke", { setPause: 45 });
    expect(findeUebung(d, "bruecke")!.setPause).toBe(45);
    const d2 = uebungAendern(d, "bruecke", { setPause: undefined });
    expect("setPause" in findeUebung(d2, "bruecke")!).toBe(false);
  });

  it("dupliziert direkt hinter das Original", () => {
    const { daten, id } = uebungDuplizieren(d0, "bruecke");
    expect(findeUebung(daten, id)).toMatchObject({ name: "Brücke (Kopie)", art: "hold", hold: 5 });
    expect(daten.uebungen.map((u) => u.id).indexOf(id)).toBe(3);
    expect(verwendetIn(daten, id)).toEqual([]);
  });

  it("löscht nur Übungen, die in keinem Programm vorkommen", () => {
    expect(uebungLoeschen(d0, "bruecke")).toBeNull();
    expect(verwendetIn(d0, "bruecke").map((p) => p.name)).toEqual(["Rücken"]);
    const ohne = uebungEntfernen(d0, "ruecken", 2);
    const d = uebungLoeschen(ohne, "bruecke")!;
    expect(findeUebung(d, "bruecke")).toBeUndefined();
  });
});

describe("Rückgängig", () => {
  it("die vorige Fassung bleibt unverändert erhalten", () => {
    const vorher = structuredClone(d0);
    uebungEntfernen(d0, "ruecken", 0);
    uebungVerschieben(d0, "ruecken", 1, 1);
    uebungAendern(d0, "bruecke", { name: "X" });
    programmLoeschen(d0, "ruecken");
    expect(d0).toEqual(vorher);
  });
});

describe("Gespeicherte Daten prüfen", () => {
  it("erkennt kaputte Daten", () => {
    expect(sindGueltig(null)).toBe(false);
    expect(sindGueltig({ version: 1, uebungen: [], programme: "x" })).toBe(false);
    expect(sindGueltig({ version: 1, uebungen: [{ id: "a", name: "A", art: "sides" }], programme: [] })).toBe(false);
    expect(sindGueltig({ version: 1, uebungen: [], programme: [] })).toBe(true);
  });
});
