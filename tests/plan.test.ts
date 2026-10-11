import { describe, expect, it } from "vitest";
import { MITGELIEFERT } from "../src/data/programme";
import { trainingsplan } from "../src/logik/daten";
import { dose, doseSpoken, fmtTime } from "../src/logik/format";
import { buildPlan } from "../src/logik/plan";
import type { Einstellungen, Trainingsplan, Uebung } from "../src/logik/typen";

const STANDARD: Einstellungen = { tempo: 3, prep: 5, setPause: 30, lower: 3 };

/** Kleiner Trainingsplan mit einer Übung für Tests. */
function plan1(u: Partial<Uebung>): Trainingsplan {
  return { id: "t", name: "Test", exercises: [{ id: "a", name: "A", art: "reps", proSeite: false, reps: 1, sets: 1, ...u }] };
}
const ruecken = trainingsplan(MITGELIEFERT, "ruecken")!;

describe("buildPlan mit dem Rückenprogramm", () => {
  const plan = buildPlan(ruecken, STANDARD);

  it("hat die erwartete Anzahl Abschnitte", () => {
    // Becken kippen: 1 + 15 + 1 + 15 = 32
    // Beine seitlich kippen: 1 + 2 × (1 + 5 + 1 + 5) + 1 Pause = 26
    // Brücke: 1 + 2 × 20 + 1 Pause = 42
    // Ende: 1
    expect(plan).toHaveLength(101);
  });

  it("beginnt mit Startposition, Name, Hinweis und Menge", () => {
    expect(plan[0]).toMatchObject({ kind: "prep", ex: 0 });
    expect(plan[0].say).toBe(
      "Auf dem Rücken liegen. Erste Übung: Becken kippen. Bauch einziehen. 2 Sätze, 15 Wiederholungen.",
    );
  });

  it("zählt Becken kippen von 1 bis 15, dann Satzpause", () => {
    const zahlen = plan.slice(1, 16).map((s) => s.say);
    expect(zahlen).toEqual(Array.from({ length: 15 }, (_, i) => String(i + 1)));
    expect(plan.slice(1, 16).every((s) => s.kind === "rep" && s.dur === 3)).toBe(true);
    expect(plan[16]).toMatchObject({ kind: "pause", dur: 30, say: "Satz 1 geschafft. 30 Sekunden Pause." });
    expect(plan[17]).toMatchObject({ kind: "rep", set: 2, rep: 1 });
  });

  it("nennt die Startposition nur bei der ersten Übung", () => {
    const preps = plan.filter((s) => s.kind === "prep");
    expect(preps).toHaveLength(3);
    expect(preps[1].say).toBe("Nächste Übung: Beine seitlich kippen. 2 Sätze, je Seite 5 Wiederholungen.");
    expect(preps[2].say).toBe("Letzte Übung: Brücke. Oben halten. 2 Sätze, 10 Wiederholungen, jeweils 5 Sekunden halten.");
  });

  it("führt bei „sides“ links, Seitenwechsel, rechts", () => {
    const seiten = plan.filter((s) => s.ex === 1 && s.kind === "side");
    expect(seiten.map((s) => s.say)).toEqual([
      "Satz 1 von 2. Links, 5 Mal.",
      "Seite wechseln. Rechts, 5 Mal.",
      "Satz 2 von 2. Links, 5 Mal.",
      "Seite wechseln. Rechts, 5 Mal.",
    ]);
    const links = plan.filter((s) => s.ex === 1 && s.kind === "rep" && s.side === "links" && s.set === 1);
    expect(links.map((s) => s.say)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("wechselt bei „hold“ zwischen Halten und Absenken", () => {
    const bruecke = plan.filter((s) => s.ex === 2 && s.set === 1 && (s.kind === "hold" || s.kind === "lower"));
    expect(bruecke).toHaveLength(20);
    expect(bruecke.slice(0, 4).map((s) => [s.kind, s.say, s.dur])).toEqual([
      ["hold", "Hoch und halten", 5],
      ["lower", "Ab", 3],
      ["hold", "Hoch, 2", 5],
      ["lower", "Ab", 3],
    ]);
  });

  it("endet mit „Training geschafft“", () => {
    expect(plan.at(-1)).toMatchObject({ kind: "done", dur: 0, say: "Training geschafft. Gut gemacht!" });
  });
});

describe("Einstellungen", () => {
  it("globale Werte wirken auf Tempo, Satzpause und Absenken", () => {
    const plan = buildPlan(ruecken, { tempo: 2, prep: 5, setPause: 45, lower: 4 });
    expect(plan.find((s) => s.kind === "rep")!.dur).toBe(2);
    expect(plan.find((s) => s.kind === "pause")!.dur).toBe(45);
    expect(plan.find((s) => s.kind === "lower")!.dur).toBe(4);
  });

  it("eigene Werte einer Übung haben Vorrang", () => {
    const prog = plan1({ reps: 2, sets: 2, tempo: 5, setPause: 10 });
    const plan = buildPlan(prog, STANDARD);
    expect(plan.filter((s) => s.kind === "rep").every((s) => s.dur === 5)).toBe(true);
    expect(plan.find((s) => s.kind === "pause")!.dur).toBe(10);
  });

  it("Vorbereitung dauert mindestens den eingestellten Wert", () => {
    const prog = plan1({});
    expect(buildPlan(prog, { ...STANDARD, prep: 20 })[0].dur).toBe(20);
  });

  it("Vorbereitung verlängert sich bei langer Ansage", () => {
    // 14 Wörter → ca. 7 s Ansage + 3 s = 10 s, also mehr als 5 s
    expect(buildPlan(ruecken, STANDARD)[0].dur).toBe(10);
  });

  it("ein einzelner Satz hat keine Satzpause und keine Satznummer", () => {
    const prog = plan1({ proSeite: true, reps: 2 });
    const plan = buildPlan(prog, STANDARD);
    expect(plan.some((s) => s.kind === "pause")).toBe(false);
    expect(plan.find((s) => s.kind === "side")!.say).toBe("Links, 2 Mal.");
  });
});

describe("Halten pro Seite", () => {
  const plan = buildPlan(plan1({ name: "Seitstütz", art: "hold", proSeite: true, reps: 2, hold: 10, sets: 2 }), STANDARD);

  it("hält erst links, dann rechts", () => {
    const satz1 = plan.filter((s) => s.set === 1 && s.kind !== "prep");
    expect(satz1.map((s) => [s.kind, s.side, s.say])).toEqual([
      ["side", "links", "Satz 1 von 2. Links, 2 Mal."],
      ["hold", "links", "Hoch und halten"],
      ["lower", "links", "Ab"],
      ["hold", "links", "Hoch, 2"],
      ["lower", "links", "Ab"],
      ["side", "rechts", "Seite wechseln. Rechts, 2 Mal."],
      ["hold", "rechts", "Hoch und halten"],
      ["lower", "rechts", "Ab"],
      ["hold", "rechts", "Hoch, 2"],
      ["lower", "rechts", "Ab"],
      ["pause", undefined, "Satz 1 geschafft. 30 Sekunden Pause."],
    ]);
    expect(satz1.find((s) => s.kind === "hold")!.dur).toBe(10);
  });

  it("nennt die Menge mit „je Seite“", () => {
    expect(plan[0].say).toBe("Erste Übung: Seitstütz. 2 Sätze, je Seite 2 Wiederholungen, jeweils 10 Sekunden halten.");
    expect(dose(plan1({ art: "hold", proSeite: true, reps: 3, hold: 10, sets: 2 }).exercises[0])).toBe("2 × 3 × 10 s je Seite");
  });
});

describe("Formatierung", () => {
  it("Mengen wie auf dem Startbildschirm", () => {
    expect(ruecken.exercises.map(dose)).toEqual(["2 × 15", "2 × 5 je Seite", "2 × 10 × 5 s"]);
  });
  it("Mengen als Ansage", () => {
    expect(doseSpoken(plan1({ reps: 8 }).exercises[0])).toBe("8 Wiederholungen.");
  });
  it("Zeit als m:ss", () => {
    expect(fmtTime(432)).toBe("7:12");
    expect(fmtTime(5)).toBe("0:05");
    expect(fmtTime(-3)).toBe("0:00");
  });
});
