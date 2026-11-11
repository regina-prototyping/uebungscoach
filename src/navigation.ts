/*
 * Navigation zwischen den Bildschirmen über den Browser-Verlauf.
 * Jeder Bildschirm ist ein Eintrag im Verlauf; die Zurück-Geste von Android
 * führt dadurch einen Bildschirm zurück, statt die App zu schließen.
 */

export type Ziel =
  | { name: "start" }
  | { name: "menue" }
  | { name: "einstellungen" }
  | { name: "uebungen" }
  | { name: "ansicht"; id: string }
  | { name: "programm"; id: string; neu?: boolean }
  | { name: "auswahl"; programmId: string }
  | { name: "uebung"; id: string; neu?: boolean }
  | { name: "training"; id: string };

interface NavOptionen {
  /** Zeichnet den Bildschirm für ein Ziel. */
  anzeigen: (ziel: Ziel) => void;
  /** Darf `true` liefern, um „Zurück“ abzufangen (z. B. Rückfrage im Training). */
  zurueckAbfangen?: (von: Ziel) => boolean;
}

let opt: NavOptionen;
let aktuell: Ziel = { name: "start" };

export function aktuellesZiel(): Ziel {
  return aktuell;
}

export function starteNavigation(o: NavOptionen): void {
  opt = o;
  // Nach dem Neuladen immer auf der Startseite beginnen
  history.replaceState({ ziel: aktuell }, "");
  window.addEventListener("popstate", (ev) => {
    const ziel: Ziel = (ev.state as { ziel?: Ziel } | null)?.ziel ?? { name: "start" };
    if (opt.zurueckAbfangen?.(aktuell)) {
      // Zurück verhindern: aktuellen Eintrag wiederherstellen
      history.pushState({ ziel: aktuell }, "");
      return;
    }
    aktuell = ziel;
    opt.anzeigen(ziel);
  });
  opt.anzeigen(aktuell);
}

/** Öffnet einen neuen Bildschirm (Zurück führt zum vorigen). */
export function geheZu(ziel: Ziel): void {
  history.pushState({ ziel }, "");
  aktuell = ziel;
  opt.anzeigen(ziel);
}

/** Ersetzt den aktuellen Bildschirm (Zurück überspringt ihn). */
export function ersetze(ziel: Ziel): void {
  history.replaceState({ ziel }, "");
  aktuell = ziel;
  opt.anzeigen(ziel);
}

/** Wie die Zurück-Geste. */
export function zurueck(): void {
  history.back();
}
