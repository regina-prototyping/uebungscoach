import { dose, fmtTime } from "./format";
import type { Spieler } from "./spieler";

/** Farbwelt: „aktiv“ = primary (Wiederholung, Halten), „ruhe“ = rest (Vorbereitung, Pause, Absenken). */
export type Phase = "aktiv" | "ruhe" | "fertig";

export interface Anzeige {
  phase: Phase;
  titel: string;
  hinweis: string;
  chips: string[];
  /** Kleine Überschrift im Ring, z. B. „Wiederholung“. */
  label: string;
  /** Große Anzeige im Ring: Zahl oder Wort. */
  gross: string;
  grossIstWort: boolean;
  /** Text unter der großen Anzeige. */
  unter: string;
  /** Füllung des Rings, 0 bis 1. */
  ring: number;
  /** Füllung des Gesamtbalkens, 0 bis 1. */
  gesamt: number;
  restzeit: string;
  danach: { name: string; menge: string } | null;
}

/** Leitet aus dem Zustand des Spielers ab, was auf dem Trainingsbildschirm steht. */
export function anzeige(sp: Spieler): Anzeige {
  const seg = sp.seg;
  const exs = sp.prog.exercises;
  const e = exs[seg.ex];
  const rest = sp.rest;
  const anteilRest = seg.dur ? Math.max(0, Math.min(1, (seg.dur - sp.elapsed) / seg.dur)) : 0;
  const gesamt = sp.total ? Math.min(1, sp.erledigt / sp.total) : 1;

  if (seg.kind === "done") {
    return {
      phase: "fertig",
      titel: sp.prog.name,
      hinweis: "Alle Übungen erledigt",
      chips: [],
      label: "Fertig",
      gross: "Geschafft",
      grossIstWort: true,
      unter: "Gut gemacht!",
      ring: 1,
      gesamt: 1,
      restzeit: "",
      danach: null,
    };
  }

  let phase: Phase = "ruhe";
  let label = "";
  let gross = String(rest);
  let grossIstWort = false;
  let unter = "";
  let ring = anteilRest;

  switch (seg.kind) {
    case "prep":
      label = "Gleich geht’s los";
      unter = dose(e);
      break;
    case "side":
      label = "Seite";
      gross = seg.side === "links" ? "Links" : "Rechts";
      grossIstWort = true;
      unter = `${e.reps} Mal`;
      ring = 0;
      break;
    case "rep":
      phase = "aktiv";
      label = "Wiederholung";
      gross = String(seg.rep);
      unter = `von ${e.reps}`;
      ring = (seg.rep ?? 0) / e.reps;
      break;
    case "hold":
      phase = "aktiv";
      label = "Halten";
      unter = `Wiederholung ${seg.rep} von ${e.reps}`;
      break;
    case "lower":
      label = "Absenken";
      unter = `${seg.rep} von ${e.reps} geschafft`;
      break;
    case "pause":
      label = "Satzpause";
      unter = "Sekunden";
      break;
  }

  let hinweis = e.hint ?? "";
  if (seg.kind === "prep" && seg.ex === 0 && sp.prog.start) hinweis = `Start: ${sp.prog.start}${hinweis ? ` · ${hinweis}` : ""}`;
  if (seg.kind === "pause") hinweis = `Satz ${seg.set} geschafft`;

  const chips = [`Übung ${seg.ex + 1} von ${exs.length}`];
  chips.push(seg.kind === "pause" ? `Gleich Satz ${seg.set + 1} von ${e.sets}` : `Satz ${seg.set} von ${e.sets}`);
  if (seg.side) chips.push(seg.side === "links" ? "Linke Seite" : "Rechte Seite");

  // In der Satzpause kein „Danach“: dort zählt nur die aktuelle Übung (ruhiger Bildschirm)
  let danach: Anzeige["danach"];
  if (seg.kind === "pause") danach = null;
  else if (exs[seg.ex + 1]) danach = { name: exs[seg.ex + 1].name, menge: dose(exs[seg.ex + 1]) };
  else danach = { name: "Training geschafft", menge: "" };

  return {
    phase,
    titel: e.name,
    hinweis,
    chips,
    label,
    gross,
    grossIstWort,
    unter,
    ring,
    gesamt,
    restzeit: `noch ${fmtTime(sp.total - sp.erledigt)}`,
    danach,
  };
}

/**
 * Kurzer Satz für Screenreader. Ändert sich nur bei Übungs- oder Satzwechsel,
 * Pausenbeginn und Trainingsende – nicht bei jeder Sekunde oder Wiederholung.
 * `schluessel` gibt an, ob sich etwas Ansagewürdiges geändert hat.
 */
export function screenreaderAnsage(sp: Spieler): { schluessel: string; text: string } {
  const seg = sp.seg;
  const exs = sp.prog.exercises;
  const e = exs[seg.ex];
  if (seg.kind === "done") return { schluessel: "fertig", text: "Training geschafft" };
  if (seg.kind === "pause") return { schluessel: `${seg.ex}-${seg.set}-pause`, text: `Satzpause: Satz ${seg.set} geschafft` };
  const text = seg.set === 1 ? `Übung ${seg.ex + 1} von ${exs.length}: ${e.name}` : `Satz ${seg.set} von ${e.sets}: ${e.name}`;
  return { schluessel: `${seg.ex}-${seg.set}`, text };
}
