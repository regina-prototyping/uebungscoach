import { doseSpoken, speechSecs } from "./format";
import type { Abschnitt, Einstellungen, Seite, Trainingsplan, Uebung } from "./typen";

type Zeitwert = "tempo" | "setPause" | "lower";

/** Eigener Wert der Übung, sonst der globale Standardwert. */
function wert(e: Uebung, key: Zeitwert, einst: Einstellungen): number {
  return e[key] ?? einst[key];
}

/**
 * Zerlegt ein Programm in eine Liste von Abschnitten
 * (Vorbereitung, Wiederholungen, Halten, Absenken, Satzpause, Ende).
 * Der Spieler arbeitet diese Liste der Reihe nach ab.
 */
export function buildPlan(prog: Trainingsplan, einst: Einstellungen): Abschnitt[] {
  const segs: Abschnitt[] = [];
  const exs = prog.exercises;

  exs.forEach((e, i) => {
    const label = i === 0 ? "Erste Übung" : i === exs.length - 1 ? "Letzte Übung" : "Nächste Übung";
    const intro =
      (i === 0 && prog.start ? `${prog.start}. ` : "") +
      `${label}: ${e.name}.` +
      (e.hint ? ` ${e.hint}.` : "") +
      ` ${doseSpoken(e)}`;
    // Vorbereitung verlängert sich, wenn die Ansage länger dauert
    segs.push({ ex: i, set: 1, kind: "prep", dur: Math.max(einst.prep, speechSecs(intro) + 3), say: intro });

    for (let s = 1; s <= e.sets; s++) {
      const seiten: (Seite | undefined)[] = e.proSeite ? ["links", "rechts"] : [undefined];
      seiten.forEach((side, si) => {
        if (side) {
          const say =
            si === 0
              ? (e.sets > 1 ? `Satz ${s} von ${e.sets}. ` : "") + `Links, ${e.reps} Mal.`
              : `Seite wechseln. Rechts, ${e.reps} Mal.`;
          segs.push({ ex: i, set: s, side, kind: "side", dur: Math.max(3, speechSecs(say) + 1), say });
        }
        for (let r = 1; r <= e.reps; r++) {
          if (e.art === "hold") {
            segs.push({ ex: i, set: s, side, kind: "hold", rep: r, dur: e.hold ?? 0, say: r === 1 ? "Hoch und halten" : `Hoch, ${r}` });
            segs.push({ ex: i, set: s, side, kind: "lower", rep: r, dur: wert(e, "lower", einst), say: "Ab" });
          } else {
            segs.push({ ex: i, set: s, side, kind: "rep", rep: r, dur: wert(e, "tempo", einst), say: String(r) });
          }
        }
      });
      if (s < e.sets) {
        const p = wert(e, "setPause", einst);
        segs.push({ ex: i, set: s, kind: "pause", dur: p, say: `Satz ${s} geschafft. ${p} Sekunden Pause.` });
      }
    }
  });

  const last = exs.length - 1;
  segs.push({ ex: last, set: exs[last]?.sets ?? 1, kind: "done", dur: 0, say: "Training geschafft. Gut gemacht!" });
  return segs;
}

/** Gesamtdauer eines Plans in Sekunden. */
export function gesamtDauer(segs: Abschnitt[]): number {
  return segs.reduce((a, s) => a + s.dur, 0);
}

/** Ungefähre Dauer eines Programms in ganzen Minuten (aufgerundet). */
export function dauerMinuten(prog: Trainingsplan, einst: Einstellungen): number {
  return Math.ceil(gesamtDauer(buildPlan(prog, einst)) / 60);
}

/** Kurzinfo wie „3 Übungen · ca. 8 Min“. */
export function programmInfo(prog: Trainingsplan, einst: Einstellungen): string {
  const n = prog.exercises.length;
  if (!n) return "Noch keine Übungen";
  return `${n === 1 ? "1 Übung" : `${n} Übungen`} · ca. ${dauerMinuten(prog, einst)} Min`;
}
