import { describe, expect, it } from "vitest";
import { MITGELIEFERT } from "../src/data/programme";
import { STANDARD } from "../src/einstellungen";
import { beschreibung, dateiname, sicherungErstellen, sicherungLesen } from "../src/logik/sicherung";

const jetzt = new Date(2026, 10, 12, 14, 30);
const eigene = { tempo: 4, prep: 8, setPause: 45, lower: 2 };

function text(x: unknown): string {
  return JSON.stringify(x);
}

describe("Sicherung", () => {
  it("enthält Daten, Einstellungen, Ansage-Modus und Formatnummer", () => {
    const s = sicherungErstellen(MITGELIEFERT, eigene, "toene", jetzt);
    expect(s).toMatchObject({ app: "uebungscoach", format: 1, daten: MITGELIEFERT, einstellungen: eigene, ansagen: "toene" });
    expect(new Date(s.erstellt).getTime()).toBe(jetzt.getTime());
  });

  it("Dateiname mit Datum", () => {
    expect(dateiname(jetzt)).toBe("uebungscoach-sicherung-2026-11-12.json");
    expect(dateiname(new Date(2027, 0, 3), "txt")).toBe("uebungscoach-sicherung-2027-01-03.txt");
  });

  it("speichern und wieder lesen ergibt dasselbe", () => {
    const s = sicherungErstellen(MITGELIEFERT, eigene, "toene", jetzt);
    expect(sicherungLesen(text(s))).toEqual({ ok: true, sicherung: s });
  });

  it("lehnt Dateien ab, die keine Sicherung sind", () => {
    for (const t of ["", "hallo", "[]", "null", text({ version: 1, uebungen: [], programme: [] })]) {
      expect(sicherungLesen(t)).toEqual({ ok: false, fehler: "Das ist keine Sicherung vom Übungscoach." });
    }
  });

  it("meldet Sicherungen aus einer neueren App-Version", () => {
    const s = { ...sicherungErstellen(MITGELIEFERT, eigene, "sprache", jetzt), format: 2 };
    const r = sicherungLesen(text(s));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fehler).toContain("neueren App-Version");
  });

  it("lehnt beschädigte Daten ab", () => {
    const s = sicherungErstellen(MITGELIEFERT, eigene, "sprache", jetzt);
    const kaputt = [
      { ...s, daten: { ...s.daten, uebungen: "nichts" } },
      { ...s, daten: { ...s.daten, version: 7 } },
      // Programm verweist auf eine Übung, die es nicht gibt
      { ...s, daten: { ...s.daten, programme: [{ id: "p", name: "P", uebungen: ["gibt-es-nicht"] }] } },
    ];
    for (const k of kaputt) {
      const r = sicherungLesen(text(k));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.fehler).toContain("beschädigt");
    }
  });

  it("ungültige oder fehlende Einstellungen fallen auf den Standard bzw. die Grenzen zurück", () => {
    const s = sicherungErstellen(MITGELIEFERT, eigene, "sprache", jetzt);
    const r = sicherungLesen(text({ ...s, einstellungen: { tempo: "schnell", prep: 999, setPause: 45 }, ansagen: "laut" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sicherung.einstellungen).toEqual({ ...STANDARD, prep: 30, setPause: 45 });
      expect(r.sicherung.ansagen).toBe("sprache");
    }
    const ohne = sicherungLesen(text({ ...s, einstellungen: undefined }));
    expect(ohne.ok && ohne.sicherung.einstellungen).toEqual(STANDARD);
  });

  it("Beschreibung für die Rückfrage", () => {
    const s = sicherungErstellen(MITGELIEFERT, eigene, "sprache", jetzt);
    const n = MITGELIEFERT.uebungen.length;
    expect(beschreibung(s)).toBe(`vom 12.11.2026, 14:30 · ${n} Übungen, ${MITGELIEFERT.programme.length} Programme`);
    const eins = { ...s, erstellt: "", daten: { version: 1 as const, uebungen: [MITGELIEFERT.uebungen[0]], programme: [] } };
    expect(beschreibung(eins)).toBe("1 Übung, 0 Programme");
  });
});
