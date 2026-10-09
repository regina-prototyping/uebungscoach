import { describe, expect, it } from "vitest";
import { PROGRAMME } from "../src/data/programme";
import { anzeige } from "../src/logik/anzeige";
import { Spieler } from "../src/logik/spieler";

const ruecken = PROGRAMME.find((p) => p.id === "ruecken")!;
const STANDARD = { tempo: 3, prep: 5, setPause: 30, lower: 3 };

function spielerBei(pruefe: (sp: Spieler) => boolean): Spieler {
  const sp = new Spieler(ruecken, STANDARD);
  let t = 0;
  sp.start(t);
  while (!pruefe(sp) && !sp.fertig) sp.tick((t += 100));
  return sp;
}

describe("Anzeige im Training", () => {
  it("Vorbereitung: Ruhefarbe, Countdown, Startposition im Hinweis", () => {
    const a = anzeige(spielerBei(() => true));
    expect(a).toMatchObject({
      phase: "ruhe",
      titel: "Becken kippen",
      hinweis: "Start: Auf dem Rücken liegen · Bauch einziehen",
      label: "Gleich geht’s los",
      gross: "10",
      unter: "2 × 15",
      chips: ["Übung 1 von 3", "Satz 1 von 2"],
      danach: { name: "Beine seitlich kippen", menge: "2 × 5 je Seite" },
    });
  });

  it("Wiederholung 7 wie im Entwurf", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.kind === "rep" && sp.seg.rep === 7));
    expect(a).toMatchObject({ phase: "aktiv", label: "Wiederholung", gross: "7", unter: "von 15", hinweis: "Bauch einziehen" });
    expect(a.ring).toBeCloseTo(7 / 15);
  });

  it("Satzpause wie im Entwurf", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.kind === "pause"));
    expect(a).toMatchObject({
      phase: "ruhe",
      label: "Satzpause",
      unter: "Sekunden",
      hinweis: "Satz 1 geschafft",
      chips: ["Übung 1 von 3", "Gleich Satz 2 von 2"],
      danach: { name: "Satz 2: Becken kippen", menge: "15 ×" },
    });
  });

  it("Seitenübung zeigt Links und die Seite als Chip", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.kind === "side"));
    expect(a).toMatchObject({ gross: "Links", grossIstWort: true, unter: "5 Mal" });
    expect(a.chips).toContain("Linke Seite");
  });

  it("Halten in Aktivfarbe, Absenken in Ruhefarbe", () => {
    expect(anzeige(spielerBei((sp) => sp.seg.kind === "hold"))).toMatchObject({ phase: "aktiv", label: "Halten", gross: "5" });
    expect(anzeige(spielerBei((sp) => sp.seg.kind === "lower"))).toMatchObject({ phase: "ruhe", label: "Absenken" });
  });

  it("letzte Übung kündigt das Ende an", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.ex === 2));
    expect(a.danach).toEqual({ name: "Training geschafft", menge: "" });
  });

  it("Ende zeigt „Geschafft“", () => {
    const a = anzeige(spielerBei((sp) => sp.fertig));
    expect(a).toMatchObject({ phase: "fertig", gross: "Geschafft", chips: [], danach: null, gesamt: 1 });
  });
});
