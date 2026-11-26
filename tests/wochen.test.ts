import { describe, expect, it } from "vitest";
import { schnittText, trainingsProWoche, type Verlauf } from "../src/logik/verlauf";

// Donnerstag, 26. November 2026, 18 Uhr (Ortszeit) – die Woche begann am Montag, 23. November
const heute = new Date(2026, 10, 26, 18, 0);
const t = (programmId: string, d: Date) => ({ programmId, name: programmId, zeit: d.toISOString() });
const v = (...trainings: ReturnType<typeof t>[]): Verlauf => ({ version: 1, trainings });

describe("trainingsProWoche", () => {
  it("liefert 12 Wochen ab Montag, älteste zuerst, die letzte läuft noch", () => {
    const r = trainingsProWoche(v(), heute);
    expect(r.wochen).toHaveLength(12);
    expect(r.wochen[11]).toMatchObject({ montag: "2026-11-23", kurz: "23.11.", laufend: true, anzahl: 0 });
    expect(r.wochen[0].montag).toBe("2026-09-07");
    expect(r.wochen.filter((w) => w.laufend)).toHaveLength(1);
    expect(r.schnitt).toBeNull();
    expect(schnittText(r)).toBe("");
  });

  it("ordnet Sonntagabend der alten und Montagfrüh der neuen Woche zu", () => {
    const r = trainingsProWoche(v(t("a", new Date(2026, 10, 22, 23, 30)), t("a", new Date(2026, 10, 23, 0, 15))), heute);
    expect(r.wochen[10].anzahl).toBe(1);
    expect(r.wochen[11].anzahl).toBe(1);
  });

  it("zählt Trainings vor dem Zeitraum nicht mit", () => {
    const r = trainingsProWoche(v(t("a", new Date(2026, 8, 6, 10)), t("a", new Date(2026, 8, 7, 10))), heute);
    expect(r.gesamt).toBe(1);
    expect(r.wochen[0].anzahl).toBe(1);
  });

  it("begrenzt auf die angegebenen Programme (z. B. ohne gelöschte)", () => {
    const r = trainingsProWoche(v(t("a", new Date(2026, 10, 24)), t("weg", new Date(2026, 10, 24))), heute, ["a"]);
    expect(r.gesamt).toBe(1);
  });

  it("Schnitt nur über fertige Wochen ab dem ersten Training", () => {
    // erste Trainingswoche: 9.11. (2 Trainings), 16.11. (1), laufende Woche (5) zählt nicht
    const r = trainingsProWoche(
      v(
        t("a", new Date(2026, 10, 9, 10)),
        t("a", new Date(2026, 10, 12, 10)),
        t("a", new Date(2026, 10, 18, 10)),
        ...Array.from({ length: 5 }, () => t("a", new Date(2026, 10, 24, 10))),
      ),
      heute,
    );
    expect(r.gesamt).toBe(8);
    expect(r.schnitt).toBe(1.5);
    expect(schnittText(r)).toBe("Ø 1,5 pro Woche");
  });

  it("ganze Zahlen ohne „,0“, Label für Screenreader", () => {
    const r = trainingsProWoche(v(t("a", new Date(2026, 10, 17, 10))), heute);
    expect(schnittText(r)).toBe("Ø 1 pro Woche");
    expect(r.wochen[10].label).toBe("Woche ab 16. November: 1 Training");
    expect(r.wochen[11].label).toBe("Diese Woche: 0 Trainings");
  });
});
