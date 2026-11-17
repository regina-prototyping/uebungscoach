import { describe, expect, it } from "vitest";
import { MITGELIEFERT } from "../src/data/programme";
import { trainingsplan } from "../src/logik/daten";
import { anzeige, screenreaderAnsage } from "../src/logik/anzeige";
import { Spieler } from "../src/logik/spieler";

const programm = trainingsplan(MITGELIEFERT, "erstes")!;
const STANDARD = { tempo: 3, prep: 5, setPause: 30, lower: 3 };

function spielerBei(pruefe: (sp: Spieler) => boolean): Spieler {
  const sp = new Spieler(programm, STANDARD);
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
      titel: "Katze-Kuh",
      hinweis: "Start: Im Vierfüßlerstand beginnen · Mit dem Atem bewegen",
      label: "Gleich geht’s los",
      gross: "10",
      unter: "2 × 15",
      chips: ["Übung 1 von 3", "Satz 1 von 2"],
      danach: null,
    });
  });

  it("„Danach“ erscheint erst während der Übung", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.kind === "rep"));
    expect(a.danach).toEqual({ name: "Vogel-Hund", menge: "2 × 5 je Seite" });
  });

  it("Wiederholung 7 wie im Entwurf", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.kind === "rep" && sp.seg.rep === 7));
    expect(a).toMatchObject({ phase: "aktiv", label: "Wiederholung", gross: "7", unter: "von 15", hinweis: "Mit dem Atem bewegen" });
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
      danach: null,
    });
  });

  it("Seitenübung zeigt Links und die Seite als Chip", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.kind === "side"));
    expect(a).toMatchObject({ gross: "Links", grossIstWort: true, unter: "5 Mal", danach: null });
    expect(a.chips).toContain("Linke Seite");
  });

  it("Halten in Aktivfarbe, Absenken in Ruhefarbe", () => {
    expect(anzeige(spielerBei((sp) => sp.seg.kind === "hold"))).toMatchObject({ phase: "aktiv", label: "Halten", gross: "5" });
    const absenken = anzeige(spielerBei((sp) => sp.seg.kind === "lower"));
    expect(absenken).toMatchObject({ phase: "ruhe", label: "Absenken" });
    expect(absenken.danach).not.toBeNull(); // kein Flackern im Wechsel Halten/Absenken
  });

  it("letzte Übung kündigt das Ende an", () => {
    const a = anzeige(spielerBei((sp) => sp.seg.ex === 2 && sp.seg.kind === "hold"));
    expect(a.danach).toEqual({ name: "Training geschafft", menge: "" });
  });

  it("Ende zeigt „Geschafft“", () => {
    const a = anzeige(spielerBei((sp) => sp.fertig));
    expect(a).toMatchObject({ phase: "fertig", gross: "Geschafft", chips: [], danach: null, gesamt: 1 });
  });
});

describe("Ansage für Screenreader", () => {
  it("nennt die Übung beim Start und bleibt während der Wiederholungen gleich", () => {
    const start = screenreaderAnsage(spielerBei(() => true));
    expect(start.text).toBe("Übung 1 von 3: Katze-Kuh");
    const rep7 = screenreaderAnsage(spielerBei((sp) => sp.seg.kind === "rep" && sp.seg.rep === 7));
    expect(rep7).toEqual(start);
  });

  it("meldet Satzpause, neuen Satz, nächste Übung und Ende", () => {
    expect(screenreaderAnsage(spielerBei((sp) => sp.seg.kind === "pause")).text).toBe("Satzpause: Satz 1 geschafft");
    expect(screenreaderAnsage(spielerBei((sp) => sp.seg.kind === "rep" && sp.seg.set === 2)).text).toBe("Satz 2 von 2: Katze-Kuh");
    expect(screenreaderAnsage(spielerBei((sp) => sp.seg.ex === 1)).text).toBe("Übung 2 von 3: Vogel-Hund");
    expect(screenreaderAnsage(spielerBei(() => false)).text).toBe("Training geschafft");
  });

  it("ändert den Schlüssel nur bei einem neuen Abschnitt", () => {
    const sp = new Spieler(programm, STANDARD);
    let t = 0;
    sp.start(t);
    const schluessel = new Set<string>();
    while (!sp.fertig) {
      schluessel.add(screenreaderAnsage(sp).schluessel);
      sp.tick((t += 100));
    }
    schluessel.add(screenreaderAnsage(sp).schluessel);
    // 3 Übungen × 2 Sätze + 3 Satzpausen + Ende
    expect(schluessel.size).toBe(10);
  });
});
