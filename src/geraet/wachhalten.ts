/* Hält den Bildschirm während des Trainings an (Screen Wake Lock API).
   Der Browser gibt die Sperre frei, sobald die Seite unsichtbar wird;
   deshalb nach „visibilitychange“ erneut anfordern. */

let sperre: WakeLockSentinel | null = null;

export async function wachHalten(): Promise<void> {
  try {
    if ("wakeLock" in navigator) sperre = await navigator.wakeLock.request("screen");
  } catch {
    sperre = null;
  }
}

export function wachFreigeben(): void {
  sperre?.release().catch(() => {});
  sperre = null;
}
