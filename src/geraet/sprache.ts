/*
 * Sprachausgabe über die Web Speech API.
 * Lehren aus dem Prototyp:
 * - Die erste Ansage muss direkt im Klick-Handler kommen, sonst bleibt das Handy stumm.
 * - cancel() nur, wenn wirklich etwas spricht – sonst wird die nächste Ansage verschluckt.
 * - In der Claude-App (eingebettete Ansicht) gibt es keine Sprachausgabe.
 */

const verfuegbar = typeof window !== "undefined" && "speechSynthesis" in window;
let stimme: SpeechSynthesisVoice | null = null;

/** Wählt eine deutsche Stimme (bevorzugt bekannte gute Stimmen). */
export function waehleStimme(): void {
  if (!verfuegbar) return;
  const alle = speechSynthesis.getVoices();
  stimme =
    alle.find((v) => v.lang === "de-DE" && /Anna|Helena|Petra|Google/i.test(v.name)) ??
    alle.find((v) => (v.lang || "").toLowerCase().startsWith("de")) ??
    null;
}

if (verfuegbar) {
  waehleStimme();
  // Stimmen werden oft erst später geladen
  speechSynthesis.addEventListener("voiceschanged", waehleStimme);
}

export function sprich(text: string): void {
  if (!verfuegbar || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  if (stimme) u.voice = stimme;
  u.rate = 1;
  speechSynthesis.speak(u);
}

/** Bricht eine laufende Ansage ab – aber nur, wenn wirklich etwas spricht. */
export function still(): void {
  if (verfuegbar && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
}

/** Diagnosezeile für die Einstellungen. */
export function stimmenStatus(): string {
  if (!verfuegbar) return "Sprachausgabe: in diesem Browser nicht verfügbar.";
  waehleStimme();
  const n = speechSynthesis.getVoices().length;
  return `Sprachausgabe: ${n} Stimmen gefunden, deutsche Stimme: ${stimme ? stimme.name : "keine"}`;
}
