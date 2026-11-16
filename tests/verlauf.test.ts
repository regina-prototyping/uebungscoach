import { describe, expect, it } from "vitest";
import { programmLoeschen, sindGueltig } from "../src/logik/daten";
import type { Daten } from "../src/logik/typen";
import {
  anheftenUmschalten,
  ersterMonat,
  istVerlauf,
  kalender,
  kalenderZusammenfassung,
  LEERER_VERLAUF,
  obenProgramme,
  raster,
  tagSchluessel,
  trainingEintragen,
  zuletztText,
  type Verlauf,
} from "../src/logik/verlauf";

// Montag, 16. November 2026, 18 Uhr (Ortszeit)
const heute = new Date(2026, 10, 16, 18, 0);

const daten: Daten = {
  version: 1,
  uebungen: [{ id: "u", name: "Ü", art: "reps", proSeite: false, reps: 5, sets: 1 }],
  programme: [
    { id: "a", name: "Rücken", uebungen: ["u"] },
    { id: "b", name: "Arme", uebungen: ["u"] },
    { id: "c", name: "Schulter", uebungen: ["u"] },
    { id: "leer", name: "Leer", uebungen: [] },
  ],
};

/** Verlauf aus [Programm, Tag im November, Stunde]. */
function verlauf(...eintraege: [string, number, number?][]): Verlauf {
  let v = LEERER_VERLAUF;
  for (const [id, tag, stunde = 9] of eintraege) v = trainingEintragen(v, { id, name: id }, new Date(2026, 10, tag, stunde));
  return v;
}

describe("Verlauf speichern", () => {
  it("trägt Programm, Name und Zeitpunkt ein, ohne den alten Verlauf zu ändern", () => {
    const v = trainingEintragen(LEERER_VERLAUF, { id: "a", name: "Rücken" }, heute);
    expect(v.trainings).toEqual([{ programmId: "a", name: "Rücken", zeit: heute.toISOString() }]);
    expect(LEERER_VERLAUF.trainings).toEqual([]);
    expect(istVerlauf(v)).toBe(true);
  });

  it("erkennt ungültige Verläufe", () => {
    expect(istVerlauf(null)).toBe(false);
    expect(istVerlauf({ version: 1, trainings: "x" })).toBe(false);
    expect(istVerlauf({ version: 1, trainings: [{ programmId: "a", name: "A", zeit: "kein Datum" }] })).toBe(false);
  });

  it("Tage richten sich nach der Ortszeit", () => {
    expect(tagSchluessel(new Date(2026, 10, 16, 0, 5))).toBe("2026-11-16");
    expect(tagSchluessel(new Date(2026, 10, 16, 23, 55))).toBe("2026-11-16");
  });
});

describe("Programme oben auf der Startseite", () => {
  it("ohne Training und ohne Anheften: die ersten zwei mit Übungen", () => {
    expect(obenProgramme(daten, LEERER_VERLAUF)).toEqual(["a", "b"]);
  });

  it("angeheftete zuerst, Reihenfolge wie in der Liste", () => {
    const d = anheftenUmschalten(anheftenUmschalten(daten, "c"), "a");
    expect(obenProgramme(d, LEERER_VERLAUF)).toEqual(["a", "c"]);
  });

  it("sonst die zuletzt trainierten", () => {
    expect(obenProgramme(daten, verlauf(["b", 10], ["c", 12]))).toEqual(["b", "c"]);
    const d = anheftenUmschalten(daten, "a");
    expect(obenProgramme(d, verlauf(["b", 10], ["c", 12]))).toEqual(["a", "c"]);
  });

  it("leere oder gelöschte Programme kommen nicht nach oben", () => {
    const d = anheftenUmschalten(anheftenUmschalten(daten, "leer"), "weg");
    expect(obenProgramme(d, verlauf(["weg", 15]))).toEqual(["a", "b"]);
  });

  it("höchstens zwei angeheftet; das älteste fällt heraus, nochmal tippen löst", () => {
    let d = anheftenUmschalten(daten, "a");
    d = anheftenUmschalten(d, "b");
    d = anheftenUmschalten(d, "c");
    expect(d.angeheftet).toEqual(["b", "c"]);
    expect(anheftenUmschalten(d, "b").angeheftet).toEqual(["c"]);
    expect(sindGueltig(d)).toBe(true);
  });

  it("Löschen eines Programms löst es auch", () => {
    const d = anheftenUmschalten(daten, "a");
    expect(programmLoeschen(d, "a").angeheftet).toEqual([]);
  });
});

describe("Raster der letzten 2 Wochen", () => {
  it("Wochentage und Tage, ältester zuerst, heute zuletzt", () => {
    const r = raster(daten, verlauf(["a", 3], ["a", 16], ["a", 2]), ["a", "b"], heute);
    expect(r.kopf).toHaveLength(14);
    expect(r.kopf[0]).toBe("D"); // Dienstag, 3. November
    expect(r.kopf[13]).toBe("M"); // Montag, heute
    expect(r.zeilen[0].tage[0]).toBe(true);
    expect(r.zeilen[0].tage[13]).toBe(true);
    expect(r.zeilen[0].anzahl).toBe(2); // der 2. liegt außerhalb
  });

  it("zweimal am selben Tag: ein Kästchen, aber zwei Trainings", () => {
    const r = raster(daten, verlauf(["a", 16, 8], ["a", 16, 19]), ["a", "b"], heute);
    expect(r.zeilen[0].tage.filter(Boolean)).toHaveLength(1);
    expect(r.zeilen[0].anzahl).toBe(2);
    expect(r.gesamt).toBe(2);
  });

  it("Zeilen für die oberen Programme, auch ohne Training, und für weitere trainierte", () => {
    const r = raster(daten, verlauf(["c", 14], ["weg", 14]), ["a", "b"], heute);
    expect(r.zeilen.map((z) => z.programmId)).toEqual(["a", "b", "c"]);
    expect(r.zeilen[1].anzahl).toBe(0);
    expect(r.gesamt).toBe(1); // Training eines gelöschten Programms zählt hier nicht
  });
});

describe("Monatskalender", () => {
  it("November 2026 beginnt an einem Sonntag", () => {
    const k = kalender(LEERER_VERLAUF, "a", 2026, 10, heute);
    expect(k.titel).toBe("November 2026");
    expect(k.versatz).toBe(6);
    expect(k.tage).toHaveLength(30);
    expect(k.tage[15]).toMatchObject({ tag: 16, heute: true, zukunft: false });
    expect(k.tage[16].zukunft).toBe(true);
  });

  it("zählt Trainings je Tag, nur für das gewählte Programm", () => {
    const v = verlauf(["a", 12, 8], ["a", 12, 18], ["a", 16], ["b", 16]);
    const k = kalender(v, "a", 2026, 10, heute);
    expect(k.tage[11].anzahl).toBe(2);
    expect(k.tage[11].label).toBe("Donnerstag, 12. November: 2 Trainings");
    expect(k.tage[15].label).toBe("Montag, 16. November: trainiert");
    expect(k.trainings).toBe(3);
    expect(k.trainingsTage).toBe(2);
    expect(kalenderZusammenfassung(k, zuletztText(v, "a", heute))).toBe("3 Trainings an 2 Tagen · zuletzt heute");
  });

  it("Woche beginnt am Montag (Februar 2027 beginnt an einem Montag)", () => {
    expect(kalender(LEERER_VERLAUF, "a", 2027, 1, heute).versatz).toBe(0);
  });

  it("frühester Monat zum Zurückblättern", () => {
    expect(ersterMonat(LEERER_VERLAUF, "a", heute)).toEqual({ jahr: 2026, monat: 10 });
    const v = trainingEintragen(LEERER_VERLAUF, { id: "a", name: "A" }, new Date(2026, 7, 20));
    expect(ersterMonat(v, "a", heute)).toEqual({ jahr: 2026, monat: 7 });
  });
});

describe("Zuletzt trainiert", () => {
  it("heute, gestern, vor ein paar Tagen, mit Datum", () => {
    expect(zuletztText(LEERER_VERLAUF, "a", heute)).toBe("Noch nicht trainiert");
    expect(zuletztText(verlauf(["a", 16, 7]), "a", heute)).toBe("zuletzt heute");
    expect(zuletztText(verlauf(["a", 15, 23]), "a", heute)).toBe("zuletzt gestern");
    expect(zuletztText(verlauf(["a", 12]), "a", heute)).toBe("zuletzt vor 4 Tagen");
    expect(zuletztText(verlauf(["a", 2]), "a", heute)).toBe("zuletzt am 2.11.2026");
  });

  it("Zusammenfassung ohne Training im Monat", () => {
    const k = kalender(verlauf(["a", 2]), "a", 2026, 9, heute);
    expect(kalenderZusammenfassung(k, "zuletzt am 2.11.2026")).toBe("In diesem Monat kein Training · zuletzt am 2.11.2026");
    expect(kalenderZusammenfassung(kalender(LEERER_VERLAUF, "a", 2026, 10, heute), "Noch nicht trainiert")).toBe("Noch nicht trainiert");
  });
});
