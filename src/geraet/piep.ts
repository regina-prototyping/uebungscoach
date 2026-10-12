import type { Signal } from "../logik/spieler";

/* Pieptöne über die Web Audio API – funktioniert zuverlässig, wenn der
   AudioContext beim ersten Antippen erzeugt bzw. fortgesetzt wird. */

let ctx: AudioContext | null = null;

/** Im Klick-Handler aufrufen. */
export function tonBereit(): void {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function piep(freq = 740, laenge = 0.13): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + laenge);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + laenge + 0.02);
}

/** Ein einzelner Ton: Frequenz (Hz), Beginn und Länge (s) relativ zu jetzt. */
function ton(freq: number, beginn: number, laenge: number, lautstaerke = 0.35, form: OscillatorType = "sine"): void {
  if (!ctx) return;
  const t = ctx.currentTime + beginn;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = form;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(lautstaerke, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + laenge);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + laenge + 0.02);
}


/** Klang der Signale (siehe Spezifikation, Abschnitt „Signaltöne“). */
export function signalTon(s: Signal): void {
  switch (s) {
    case "neueUebung": // Gong: drei aufsteigende Töne
      ton(523, 0, 0.22, 0.3, "triangle");
      ton(659, 0.18, 0.22, 0.3, "triangle");
      ton(784, 0.36, 0.6, 0.35, "triangle");
      break;
    case "los": // langer hoher Ton
      ton(988, 0, 0.45, 0.35);
      break;
    case "ab": // tiefer Ton
      ton(392, 0, 0.4, 0.4);
      break;
    case "seite": // zwei abwechselnde Töne
      ton(659, 0, 0.16);
      ton(880, 0.17, 0.16);
      ton(659, 0.34, 0.2);
      break;
    case "satzpause": // zwei absteigende Töne
      ton(880, 0, 0.22, 0.3, "triangle");
      ton(587, 0.22, 0.45, 0.3, "triangle");
      break;
    case "ende": // kleine Melodie aufwärts – beginnt höher als der Gong, damit man sie nicht verwechselt
      ton(784, 0, 0.14, 0.3, "triangle");
      ton(988, 0.13, 0.14, 0.3, "triangle");
      ton(1175, 0.26, 0.14, 0.3, "triangle");
      ton(1568, 0.39, 0.7, 0.35, "triangle");
      break;
    case "takt": // leiser kurzer Klick
      ton(1400, 0, 0.04, 0.12);
      break;
  }
}

/** Für „Töne anhören“: Name und Beschreibung aller Signale in sinnvoller Reihenfolge. */
export const SIGNAL_VORSCHAU: { signal: Signal; text: string }[] = [
  { signal: "neueUebung", text: "Neue Übung – hinschauen" },
  { signal: "los", text: "Los" },
  { signal: "takt", text: "Takt (nur bei „Nur Töne“)" },
  { signal: "ab", text: "Ab" },
  { signal: "seite", text: "Seite wechseln" },
  { signal: "satzpause", text: "Satz geschafft, Pause" },
  { signal: "ende", text: "Training geschafft" },
];
