import { buildPlan, gesamtDauer } from "./plan";
import type { Abschnitt, Einstellungen, Trainingsplan } from "./typen";

/**
 * Anweisungen des Spielers an Ton und Anzeige.
 * Der Spieler selbst spricht und piept nicht – so bleibt er testbar.
 */
export type Ereignis =
  | { typ: "sagen"; text: string }
  | { typ: "piep" }
  /** Laufende Ansage abbrechen (nur wenn wirklich etwas spricht). */
  | { typ: "still" }
  | { typ: "fertig" };

/** Abschnitte, in denen bei 3, 2, 1 gepiept wird. */
const MIT_PIEP = new Set(["prep", "pause", "hold"]);

/**
 * Führt durch den Plan eines Programms. Die Zeit (`now`, in Millisekunden,
 * z. B. aus `performance.now()`) kommt immer von außen.
 */
export class Spieler {
  readonly prog: Trainingsplan;
  readonly segs: Abschnitt[];
  readonly total: number;
  idx = 0;
  /** Vergangene Sekunden im aktuellen Abschnitt. */
  elapsed = 0;
  running = false;
  private last = 0;

  constructor(prog: Trainingsplan, einst: Einstellungen) {
    this.prog = prog;
    this.segs = buildPlan(prog, einst);
    this.total = gesamtDauer(this.segs);
  }

  get seg(): Abschnitt {
    return this.segs[this.idx];
  }

  get fertig(): boolean {
    return this.seg.kind === "done";
  }

  /** Restsekunden im aktuellen Abschnitt (aufgerundet). */
  get rest(): number {
    return Math.max(0, Math.ceil(this.seg.dur - this.elapsed));
  }

  /** Schon absolvierte Sekunden des ganzen Trainings. */
  get erledigt(): number {
    return gesamtDauer(this.segs.slice(0, this.idx)) + Math.min(this.elapsed, this.seg.dur);
  }

  /**
   * Startet von vorn. Die zurückgegebene erste Ansage muss sofort
   * (synchron im Klick-Handler) gesprochen werden.
   */
  start(now: number): Ereignis[] {
    this.idx = 0;
    this.elapsed = 0;
    this.running = true;
    this.last = now;
    return [{ typ: "still" }, ...this.betreten()];
  }

  /** Regelmäßig aufrufen (z. B. alle 100 ms). */
  tick(now: number): Ereignis[] {
    const dt = (now - this.last) / 1000;
    this.last = now;
    if (!this.running) return [];
    const out: Ereignis[] = [];
    const seg = this.seg;
    const vorher = Math.ceil(seg.dur - this.elapsed);
    this.elapsed += dt;
    const nachher = Math.ceil(seg.dur - this.elapsed);
    if (MIT_PIEP.has(seg.kind) && nachher < vorher && nachher >= 1 && nachher <= 3) out.push({ typ: "piep" });
    if (this.elapsed >= seg.dur) {
      // Kleiner Übertrag, damit nichts driftet; nach langer Unterbrechung höchstens 0,5 s
      this.elapsed = Math.min(this.elapsed - seg.dur, 0.5);
      this.idx++;
      out.push(...this.betreten());
    }
    return out;
  }

  /** Pause bzw. Weiter. */
  togglePause(now: number): Ereignis[] {
    if (this.fertig) return [];
    this.running = !this.running;
    this.last = now;
    if (!this.running) return [{ typ: "still" }];
    return [{ typ: "sagen", text: this.elapsed < 0.3 ? this.seg.say : "Weiter" }];
  }

  /** Zurück: an den Anfang der Übung; steht man schon dort, zur vorherigen. */
  back(now: number): Ereignis[] {
    const cur = this.seg.ex;
    const start = this.uebungsStart(cur);
    if (this.idx === start && this.elapsed < 2 && cur > 0) return this.springen(this.uebungsStart(cur - 1), now);
    return this.springen(start, now);
  }

  /** Zur nächsten Übung; bei der letzten Übung ans Ende. */
  skip(now: number): Ereignis[] {
    if (this.fertig) return [];
    const cur = this.seg.ex;
    if (cur >= this.prog.exercises.length - 1) return this.springen(this.segs.length - 1, now);
    return this.springen(this.uebungsStart(cur + 1), now);
  }

  /** Index der Vorbereitung einer Übung. */
  uebungsStart(ex: number): number {
    return this.segs.findIndex((s) => s.ex === ex && s.kind === "prep");
  }

  private springen(idx: number, now: number): Ereignis[] {
    this.idx = idx;
    this.elapsed = 0;
    this.last = now;
    const out: Ereignis[] = [{ typ: "still" }];
    if (this.running || this.fertig) out.push(...this.betreten());
    return out;
  }

  private betreten(): Ereignis[] {
    if (this.fertig) {
      this.running = false;
      return [{ typ: "sagen", text: this.seg.say }, { typ: "fertig" }];
    }
    return [{ typ: "sagen", text: this.seg.say }];
  }
}
