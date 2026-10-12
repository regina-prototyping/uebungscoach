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
 * - Meldet Android „synthesis-failed“, ist die ausdrücklich gewählte Stimme gerade nicht
 *   nutzbar. Dann ohne festgelegte Stimme (nur Sprache Deutsch) und zuletzt mit der
 *   Standardstimme des Geräts neu versuchen und das Funktionierende beibehalten.
 */

const verfuegbar = typeof window !== "undefined" && "speechSynthesis" in window;
let stimme: SpeechSynthesisVoice | null = null;

/** Wie die Ansage eingestellt wird – von genau bis zur Standardstimme des Geräts. */
type Variante = "stimme" | "deutsch" | "standard";
const VARIANTEN: Variante[] = ["stimme", "deutsch", "standard"];
const VARIANTE_TEXT: Record<Variante, string> = {
  stimme: "gewählte Stimme",
  deutsch: "ohne feste Stimme, Sprache Deutsch",
  standard: "Standardstimme des Geräts",
};
let variante: Variante = "stimme";

/** Fehler, bei denen ein Versuch mit einer anderen Einstellung helfen kann. */
const STIMMEN_FEHLER = new Set(["synthesis-failed", "synthesis-unavailable", "language-unavailable", "voice-unavailable"]);

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

type Ansage = SpeechSynthesisUtterance & { gestartet?: boolean; erledigt?: boolean };

function neueAnsage(text: string, v: Variante = variante): Ansage {
  const u: Ansage = new SpeechSynthesisUtterance(text);
  if (v !== "standard") u.lang = "de-DE";
  if (v === "stimme" && stimme) u.voice = stimme;
  u.rate = 1;
  u.onstart = () => {
    u.gestartet = true;
    laufend++;
    melde("Ansage gestartet");
  };
  u.onend = () => {
    u.erledigt = true;
    if (u.gestartet) laufend = Math.max(0, laufend - 1);
    melde("Ansage fertig");
  };
  u.onerror = (ev) => {
    u.erledigt = true;
    if (u.gestartet) laufend = Math.max(0, laufend - 1);
    // „interrupted“/„canceled“ entstehen beim gewollten Abbrechen
    if (ev.error === "interrupted" || ev.error === "canceled") return melde("Ansage abgebrochen");
    // Auch nach „gestartet“: Android meldet den Fehler teils erst danach, hörbar war dann nichts
    if (STIMMEN_FEHLER.has(ev.error)) {
      // Mit der nächsten Einstellung neu versuchen (oder der schon gewechselten)
      const i = VARIANTEN.indexOf(v);
      if (v === variante && i < VARIANTEN.length - 1) variante = VARIANTEN[i + 1];
      if (variante !== v) {
        melde(`Fehler: ${ev.error} – neuer Versuch: ${VARIANTE_TEXT[variante]}`);
        speechSynthesis.speak(neueAnsage(text, variante));
        return;
      }
    }
    melde(`Fehler: ${ev.error}`);
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
    if (u.gestartet || u.erledigt || laufend > 0) return;
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
    (variante !== "stimme" ? ` Verwendet: ${VARIANTE_TEXT[variante]}.` : "") +
    (zustand ? ` Zustand: ${zustand}.` : "") +
    (letzterStatus ? ` Zuletzt: ${letzterStatus}.` : "")
  );
}
