import { describe, expect, it } from "vitest";
import { MITGELIEFERT } from "../src/data/programme";
import { trainingsplan } from "../src/logik/daten";
import { hoerbar, Spieler, type Ereignis } from "../src/logik/spieler";
import type { Einstellungen } from "../src/logik/typen";

const STANDARD: Einstellungen = { tempo: 3, prep: 5, setPause: 30, lower: 3 };
const ruecken = trainingsplan(MITGELIEFERT, "ruecken")!;

/** Spult die Zeit in 100-ms-Schritten vor und sammelt alle Ereignisse. */
function vorspulen(sp: Spieler, uhr: { t: number }, sekunden: number): Ereignis[] {
  const out: Ereignis[] = [];
  const ende = uhr.t + sekunden * 1000;
  while (uhr.t < ende) {
    uhr.t += 100;
    out.push(...sp.tick(uhr.t));
  }
  return out;
}
const gesagt = (ev: Ereignis[]) => ev.flatMap((e) => (e.typ === "sagen" ? [e.text] : []));
const pieps = (ev: Ereignis[]) => ev.filter((e) => e.typ === "piep").length;
const signale = (ev: Ereignis[]) => ev.flatMap((e) => (e.typ === "signal" ? [e.signal] : []));

function neu() {
  const uhr = { t: 1000 };
  const sp = new Spieler(ruecken, STANDARD);
  const start = sp.start(uhr.t);
  return { sp, uhr, start };
}

describe("Spieler", () => {
  it("sagt beim Start sofort die erste Ansage", () => {
    const { start } = neu();
    expect(gesagt(start)).toEqual([
      "Auf dem Rücken liegen. Erste Übung: Becken kippen. Bauch einziehen. 2 Sätze, 15 Wiederholungen.",
    ]);
  });

  it("piept in der Vorbereitung bei 3, 2, 1 und zählt dann", () => {
    const { sp, uhr } = neu();
    const ev = vorspulen(sp, uhr, 10.05); // Vorbereitung dauert 10 s
    expect(pieps(ev)).toBe(3);
    expect(gesagt(ev)).toEqual(["1"]);
    expect(sp.seg).toMatchObject({ kind: "rep", rep: 1 });
    expect(gesagt(vorspulen(sp, uhr, 6))).toEqual(["2", "3"]);
  });

  it("hält in der Pause die Zeit an", () => {
    const { sp, uhr } = neu();
    vorspulen(sp, uhr, 4);
    expect(sp.togglePause(uhr.t)).toEqual([{ typ: "still" }]);
    const vorher = sp.elapsed;
    expect(vorspulen(sp, uhr, 60)).toEqual([]);
    expect(sp.elapsed).toBe(vorher);
    expect(gesagt(sp.togglePause(uhr.t))).toEqual(["Weiter"]);
    expect(sp.running).toBe(true);
  });

  it("Weiter direkt nach einem Sprung wiederholt die Ansage des Abschnitts", () => {
    const { sp, uhr } = neu();
    sp.togglePause(uhr.t);
    sp.skip(uhr.t);
    expect(gesagt(sp.togglePause(uhr.t))).toEqual([
      "Nächste Übung: Beine seitlich kippen. 2 Sätze, je Seite 5 Wiederholungen.",
    ]);
  });

  it("Nächste Übung springt zur Vorbereitung der folgenden Übung", () => {
    const { sp, uhr } = neu();
    vorspulen(sp, uhr, 20);
    const ev = sp.skip(uhr.t);
    expect(ev[0]).toEqual({ typ: "still" });
    expect(sp.seg).toMatchObject({ kind: "prep", ex: 1 });
    expect(sp.elapsed).toBe(0);
  });

  it("Nächste Übung bei der letzten Übung beendet das Training", () => {
    const { sp, uhr } = neu();
    sp.skip(uhr.t);
    sp.skip(uhr.t);
    const ev = sp.skip(uhr.t);
    expect(sp.fertig).toBe(true);
    expect(sp.running).toBe(false);
    expect(gesagt(ev)).toEqual(["Training geschafft. Gut gemacht!"]);
    expect(ev).toContainEqual({ typ: "fertig" });
  });

  it("Zurück springt an den Anfang der aktuellen Übung", () => {
    const { sp, uhr } = neu();
    sp.skip(uhr.t);
    vorspulen(sp, uhr, 15);
    expect(sp.seg.ex).toBe(1);
    sp.back(uhr.t);
    expect(sp.idx).toBe(sp.uebungsStart(1));
  });

  it("Zurück am Anfang einer Übung springt zur vorherigen", () => {
    const { sp, uhr } = neu();
    sp.skip(uhr.t);
    vorspulen(sp, uhr, 1);
    sp.back(uhr.t);
    expect(sp.idx).toBe(sp.uebungsStart(0));
  });

  it("Zurück bei der ersten Übung bleibt am Anfang", () => {
    const { sp, uhr } = neu();
    sp.back(uhr.t);
    expect(sp.idx).toBe(0);
  });

  it("läuft ohne Antippen bis zum Ende durch", () => {
    const { sp, uhr } = neu();
    const ev = vorspulen(sp, uhr, sp.total + 30);
    expect(sp.fertig).toBe(true);
    expect(gesagt(ev).at(-1)).toBe("Training geschafft. Gut gemacht!");
    expect(ev.filter((e) => e.typ === "fertig")).toHaveLength(1);
    // nach dem Ende passiert nichts mehr
    expect(vorspulen(sp, uhr, 10)).toEqual([]);
  });

  it("piept beim Halten bei 3, 2, 1", () => {
    const { sp, uhr } = neu();
    sp.skip(uhr.t);
    sp.skip(uhr.t); // Brücke
    vorspulen(sp, uhr, sp.seg.dur + 0.05);
    expect(sp.seg).toMatchObject({ kind: "hold", rep: 1 });
    const ev = vorspulen(sp, uhr, 5);
    expect(pieps(ev)).toBe(3);
    expect(gesagt(ev)).toEqual(["Ab"]);
  });

  it("verliert nach langer Unterbrechung höchstens einen Abschnitt", () => {
    const { sp, uhr } = neu();
    uhr.t += 60_000; // z. B. Bildschirm war aus
    sp.tick(uhr.t);
    expect(sp.idx).toBe(1);
    expect(sp.elapsed).toBeLessThanOrEqual(0.5);
  });

  it("berechnet Gesamt- und Restzeit", () => {
    const { sp, uhr } = neu();
    expect(sp.erledigt).toBe(0);
    vorspulen(sp, uhr, 4);
    expect(sp.erledigt).toBeCloseTo(4, 5);
    expect(sp.rest).toBe(6);
  });
});

describe("Signaltöne", () => {
  it("Gong zu Beginn, dann Los bei der ersten Wiederholung und Takt bei den weiteren", () => {
    const { sp, uhr, start } = neu();
    expect(signale(start)).toEqual(["neueUebung"]);
    expect(signale(vorspulen(sp, uhr, 10.05))).toEqual(["los"]);
    expect(signale(vorspulen(sp, uhr, 6))).toEqual(["takt", "takt"]);
  });

  it("Satzpause nach dem letzten Mitzählen, danach wieder Los", () => {
    const { sp, uhr } = neu();
    const ev = vorspulen(sp, uhr, 10 + 15 * 3 + 30 + 0.5);
    const s = signale(ev);
    expect(s.filter((x) => x === "satzpause")).toHaveLength(1);
    expect(s.at(-1)).toBe("los");
    expect(sp.seg).toMatchObject({ kind: "rep", set: 2, rep: 1 });
  });

  it("pro Seite: Seite, Los, Takt … Seite, Los", () => {
    const { sp, uhr } = neu();
    sp.skip(uhr.t); // Beine seitlich kippen
    // Dauer bis kurz nach Beginn der ersten Wiederholung rechts
    const bisRechts = sp.segs.slice(sp.idx, sp.idx + 1 + 1 + 5 + 1).reduce((a, x) => a + x.dur, 0);
    const ev = vorspulen(sp, uhr, bisRechts + 0.5);
    expect(signale(ev)).toEqual(["seite", "los", "takt", "takt", "takt", "takt", "seite", "los"]);
  });

  it("Halten: Los zu Beginn jeder Haltephase, Ab beim Absenken", () => {
    const { sp, uhr } = neu();
    sp.skip(uhr.t);
    sp.skip(uhr.t); // Brücke
    // Vorbereitung, Halten, Absenken – dann beginnt das zweite Halten
    const bisZweitesHalten = sp.segs.slice(sp.idx, sp.idx + 3).reduce((a, x) => a + x.dur, 0);
    const ev = vorspulen(sp, uhr, bisZweitesHalten + 0.5);
    expect(signale(ev)).toEqual(["los", "ab", "los"]);
  });

  it("Ende-Melodie beim Abschluss, Gong beim Springen zur nächsten Übung", () => {
    const { sp, uhr } = neu();
    expect(signale(sp.skip(uhr.t))).toEqual(["neueUebung"]);
    sp.skip(uhr.t);
    expect(signale(sp.skip(uhr.t))).toEqual(["ende"]);
  });
});

describe("Ansage-Modus", () => {
  it("„Nur Töne“: keine Sprache, aber Takt", () => {
    expect(hoerbar({ typ: "sagen", text: "1" }, "toene")).toBe(false);
    expect(hoerbar({ typ: "signal", signal: "takt" }, "toene")).toBe(true);
    expect(hoerbar({ typ: "signal", signal: "los" }, "toene")).toBe(true);
    expect(hoerbar({ typ: "piep" }, "toene")).toBe(true);
  });

  it("„Sprache und Töne“: Sprache und Signale, aber kein Takt", () => {
    expect(hoerbar({ typ: "sagen", text: "1" }, "sprache")).toBe(true);
    expect(hoerbar({ typ: "signal", signal: "takt" }, "sprache")).toBe(false);
    expect(hoerbar({ typ: "signal", signal: "neueUebung" }, "sprache")).toBe(true);
  });
});
