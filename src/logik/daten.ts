/*
 * Ändern von Übungen und Programmen. Alle Funktionen sind „rein“: Sie verändern
 * die übergebenen Daten nicht, sondern liefern eine neue Fassung. Für
 * „Rückgängig“ genügt es daher, die vorige Fassung aufzuheben.
 */
import type { Daten, Programm, Trainingsplan, Uebung } from "./typen";

export function neueId(): string {
  return crypto.randomUUID();
}

export function findeUebung(d: Daten, id: string): Uebung | undefined {
  return d.uebungen.find((u) => u.id === id);
}

export function findeProgramm(d: Daten, id: string): Programm | undefined {
  return d.programme.find((p) => p.id === id);
}

/** Programm mit eingesetzten Übungen; fehlende Übungen werden übersprungen. */
export function trainingsplan(d: Daten, programmId: string): Trainingsplan | undefined {
  const p = findeProgramm(d, programmId);
  if (!p) return undefined;
  const exercises = p.uebungen.map((id) => findeUebung(d, id)).filter((u): u is Uebung => !!u);
  return { id: p.id, name: p.name, start: p.start, exercises };
}

/** Programme, in denen eine Übung vorkommt. */
export function verwendetIn(d: Daten, uebungId: string): Programm[] {
  return d.programme.filter((p) => p.uebungen.includes(uebungId));
}

/* ---------- Übungen ---------- */

export const NEUE_UEBUNG: Omit<Uebung, "id"> = { name: "", art: "reps", proSeite: false, reps: 10, sets: 2 };

export function uebungAnlegen(d: Daten, werte: Partial<Omit<Uebung, "id">> = {}): { daten: Daten; id: string } {
  const id = neueId();
  const u: Uebung = { ...NEUE_UEBUNG, ...werte, id };
  return { daten: { ...d, uebungen: [...d.uebungen, u] }, id };
}

/**
 * Ändert Felder einer Übung. Ein Feld mit dem Wert `undefined` wird entfernt
 * (z. B. eigene Zeit zurücksetzen).
 */
export function uebungAendern(d: Daten, id: string, aenderung: Partial<Omit<Uebung, "id">>): Daten {
  return {
    ...d,
    uebungen: d.uebungen.map((u) => {
      if (u.id !== id) return u;
      const neu: Record<string, unknown> = { ...u, ...aenderung };
      for (const [k, v] of Object.entries(neu)) if (v === undefined) delete neu[k];
      return neu as unknown as Uebung;
    }),
  };
}

/** Legt eine Kopie direkt hinter dem Original an. */
export function uebungDuplizieren(d: Daten, id: string): { daten: Daten; id: string } {
  const original = findeUebung(d, id);
  if (!original) return { daten: d, id };
  const kopie: Uebung = { ...original, id: neueId(), name: `${original.name} (Kopie)` };
  const i = d.uebungen.indexOf(original);
  const uebungen = [...d.uebungen.slice(0, i + 1), kopie, ...d.uebungen.slice(i + 1)];
  return { daten: { ...d, uebungen }, id: kopie.id };
}

/** Löscht eine Übung – aber nur, wenn sie in keinem Programm vorkommt. Sonst `null`. */
export function uebungLoeschen(d: Daten, id: string): Daten | null {
  if (verwendetIn(d, id).length) return null;
  return { ...d, uebungen: d.uebungen.filter((u) => u.id !== id) };
}

/* ---------- Programme ---------- */

export function programmAnlegen(d: Daten, name = ""): { daten: Daten; id: string } {
  const id = neueId();
  return { daten: { ...d, programme: [...d.programme, { id, name, uebungen: [] }] }, id };
}

function programmSetzen(d: Daten, id: string, f: (p: Programm) => Programm): Daten {
  return { ...d, programme: d.programme.map((p) => (p.id === id ? f(p) : p)) };
}

/** Ändert Name oder Startposition. Leere Startposition wird entfernt. */
export function programmAendern(d: Daten, id: string, aenderung: { name?: string; start?: string }): Daten {
  return programmSetzen(d, id, (p) => {
    const neu: Programm = { ...p, ...aenderung };
    if (!neu.start?.trim()) delete neu.start;
    return neu;
  });
}

/**
 * Beim Verlassen eines Programms: Ohne Namen und ohne Übungen wird es
 * verworfen; ohne Namen, aber mit Übungen heißt es „Neues Programm“.
 */
export function programmAufraeumen(d: Daten, id: string): Daten {
  const p = findeProgramm(d, id);
  if (!p || p.name.trim()) return d;
  if (!p.uebungen.length) return programmLoeschen(d, id);
  return programmAendern(d, id, { name: "Neues Programm" });
}

export function programmLoeschen(d: Daten, id: string): Daten {
  return { ...d, programme: d.programme.filter((p) => p.id !== id) };
}

export function uebungHinzufuegen(d: Daten, programmId: string, uebungId: string): Daten {
  return programmSetzen(d, programmId, (p) => ({ ...p, uebungen: [...p.uebungen, uebungId] }));
}

/** Entfernt die Übung an Position `index` aus dem Programm (sie bleibt in der Bibliothek). */
export function uebungEntfernen(d: Daten, programmId: string, index: number): Daten {
  return programmSetzen(d, programmId, (p) => ({ ...p, uebungen: p.uebungen.filter((_, i) => i !== index) }));
}

/** Verschiebt die Übung an Position `index` um eins nach oben (−1) oder unten (+1). */
export function uebungVerschieben(d: Daten, programmId: string, index: number, richtung: -1 | 1): Daten {
  return programmSetzen(d, programmId, (p) => {
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= p.uebungen.length) return p;
    const liste = [...p.uebungen];
    [liste[index], liste[ziel]] = [liste[ziel], liste[index]];
    return { ...p, uebungen: liste };
  });
}

/* ---------- Prüfen geladener Daten ---------- */

/** Prüft grob, ob gespeicherte Daten die erwartete Form haben. */
export function sindGueltig(x: unknown): x is Daten {
  if (!x || typeof x !== "object") return false;
  const d = x as Daten;
  return (
    d.version === 1 &&
    Array.isArray(d.uebungen) &&
    Array.isArray(d.programme) &&
    d.uebungen.every((u) => typeof u?.id === "string" && typeof u.name === "string" && (u.art === "reps" || u.art === "hold")) &&
    d.programme.every((p) => typeof p?.id === "string" && typeof p.name === "string" && Array.isArray(p.uebungen))
  );
}
