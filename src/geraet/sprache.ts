/*
 * Sprachausgabe über die Web Speech API.
 * Lehren aus dem Prototyp:
 * - Die erste Ansage muss direkt im Klick-Handler kommen, sonst bleibt das Handy stumm.
 * - cancel() nur, wenn wirklich etwas spricht – sonst wird die nächste Ansage verschluckt.
 * - In der Claude-App (eingebettete Ansicht) gibt es keine Sprachausgabe.
 * Lehren aus Version 2:
 * - Chrome auf Android kann nach Hintergrund oder Neuladen „angehalten“ hängen bleiben;
 *   Ansagen landen dann in einer Warteschlange, die nie abgespielt wird. Daher vor
 *   jeder Ansage resume() und ein Wachhund, der bei Stillstand zurücksetzt.
 */

const verfuegbar = typeof window !== "undefined" && "speechSynthesis" in window;
let stimme: SpeechSynthesisVoice | null = null;

/** Wie lange eine Ansage höchstens auf ihren Start warten darf (ms). */
const WACHHUND_MS = 1500;

/** Ansagen, die gerade hörbar laufen (gestartet, aber noch nicht beendet). */
let laufend = 0;
/** Letztes Ereignis für die Diagnosezeile. */
let letzterStatus = "";
let statusBeobachter: ((status: string) => void) | null = null;

function melde(status: string): void {
  letzterStatus = status;
  statusBeobachter?.(status);
}

/** Meldet Statusänderungen (für die Diagnose in den Einstellungen). */
export function beiAnsageStatus(f: ((status: string) => void) | null): void {
  statusBeobachter = f;
}

/** Wählt eine deutsche Stimme; bevorzugt Stimmen, die ohne Internet auf dem Gerät laufen. */
export function waehleStimme(): void {
  if (!verfuegbar) return;
  const deutsch = speechSynthesis.getVoices().filter((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith("de"));
  const deDE = deutsch.filter((v) => /^de-de$/i.test(v.lang.replace("_", "-")));
  stimme =
    deDE.find((v) => v.localService) ??
    deutsch.find((v) => v.localService) ??
    deDE.find((v) => /Anna|Helena|Petra|Google/i.test(v.name)) ??
    deDE[0] ??
    deutsch[0] ??
    null;
}

if (verfuegbar) {
  waehleStimme();
  // Stimmen werden oft erst später geladen
  speechSynthesis.addEventListener("voiceschanged", waehleStimme);
}

function neueAnsage(text: string): SpeechSynthesisUtterance & { gestartet?: boolean } {
  const u: SpeechSynthesisUtterance & { gestartet?: boolean } = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  if (stimme) u.voice = stimme;
  u.rate = 1;
  u.onstart = () => {
    u.gestartet = true;
    laufend++;
    melde("Ansage gestartet");
  };
  u.onend = () => {
    if (u.gestartet) laufend = Math.max(0, laufend - 1);
    melde("Ansage fertig");
  };
  u.onerror = (ev) => {
    if (u.gestartet) laufend = Math.max(0, laufend - 1);
    // „interrupted“/„canceled“ entstehen beim gewollten Abbrechen
    melde(ev.error === "interrupted" || ev.error === "canceled" ? "Ansage abgebrochen" : `Fehler: ${ev.error}`);
  };
  return u;
}

export function sprich(text: string): void {
  if (!verfuegbar || !text) return;
  // Hängt die Sprachausgabe im Zustand „angehalten“, wieder aufwecken
  if (speechSynthesis.paused) speechSynthesis.resume();
  const u = neueAnsage(text);
  speechSynthesis.speak(u);
  melde("Ansage angefordert");
  // Wachhund: Startet die Ansage nicht, obwohl nichts anderes läuft, hängt die Sprachausgabe.
  // Dann zurücksetzen und einmal neu versuchen.
  window.setTimeout(() => {
    if (u.gestartet || laufend > 0) return;
    melde("Sprachausgabe hing – neuer Versuch");
    speechSynthesis.cancel();
    speechSynthesis.resume();
    laufend = 0;
    speechSynthesis.speak(neueAnsage(text));
  }, WACHHUND_MS);
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
  const name = stimme ? `${stimme.name}${stimme.localService ? " (auf dem Gerät)" : " (über Internet)"}` : "keine";
  const zustand = [speechSynthesis.paused && "angehalten", speechSynthesis.speaking && "spricht", speechSynthesis.pending && "wartet"]
    .filter(Boolean)
    .join(", ");
  return (
    `Sprachausgabe: ${n} Stimmen gefunden, deutsche Stimme: ${name}.` +
    (zustand ? ` Zustand: ${zustand}.` : "") +
    (letzterStatus ? ` Zuletzt: ${letzterStatus}.` : "")
  );
}
