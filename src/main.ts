import "./stil/theme.css";
import "./stil/app.css";
import { PROGRAMME } from "./data/programme";
import { ladeEinstellungen } from "./einstellungen";
import { zeigeStart } from "./ansichten/start";
import { TrainingAnsicht } from "./ansichten/training";
import { Spieler, type Ereignis } from "./logik/spieler";
import type { Programm } from "./logik/typen";
import { sprich, still, waehleStimme } from "./geraet/sprache";
import { piep, tonBereit } from "./geraet/piep";
import { wachFreigeben, wachHalten } from "./geraet/wachhalten";

const app = document.getElementById("app")!;
const einstellungen = ladeEinstellungen();

let spieler: Spieler | null = null;
let ansicht: TrainingAnsicht | null = null;
let timer = 0;
/** Lief das Training, als „Beenden“ getippt wurde? */
let liefVorDialog = false;

/** Führt die Anweisungen des Spielers aus. */
function ausfuehren(ereignisse: Ereignis[]): void {
  for (const e of ereignisse) {
    if (e.typ === "sagen") sprich(e.text);
    else if (e.typ === "still") still();
    else if (e.typ === "piep") piep();
    else if (e.typ === "fertig") wachFreigeben();
  }
  if (spieler && ansicht) ansicht.aktualisieren(spieler);
}

function startseite(): void {
  window.clearInterval(timer);
  still();
  wachFreigeben();
  spieler = null;
  ansicht = null;
  zeigeStart(app, {
    programme: PROGRAMME,
    einstellungen,
    onStart: training,
    onEinstellungen: () => {
      // Einstellungen folgen in Schritt 5
    },
  });
  window.scrollTo(0, 0);
}

/** Läuft direkt im Klick auf „Training starten“ bzw. „Nochmal“. */
function training(prog: Programm): void {
  tonBereit();
  waehleStimme();
  spieler = new Spieler(prog, einstellungen);
  ansicht = new TrainingAnsicht(app, prog.name, {
    pause: () => {
      tonBereit();
      if (!spieler!.running) void wachHalten();
      ausfuehren(spieler!.togglePause(performance.now()));
    },
    zurueck: () => ausfuehren(spieler!.back(performance.now())),
    weiter: () => ausfuehren(spieler!.skip(performance.now())),
    beenden: () => {
      if (spieler!.fertig) return startseite();
      liefVorDialog = spieler!.running;
      if (liefVorDialog) ausfuehren(spieler!.togglePause(performance.now()));
      ansicht!.dialog(true);
    },
    nochmal: () => training(prog),
    uebersicht: startseite,
  });
  ansicht.onDialogZu = () => {
    tonBereit();
    if (liefVorDialog) ausfuehren(spieler!.togglePause(performance.now()));
  };
  window.scrollTo(0, 0);
  void wachHalten();
  // Erste Ansage MUSS synchron im Antippen kommen, sonst bleibt das Handy stumm
  ausfuehren(spieler.start(performance.now()));
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    if (spieler) ausfuehren(spieler.tick(performance.now()));
  }, 100);
}

// Geht der Bildschirm aus oder wechselt man die App, pausiert das Training.
// Beim Zurückkommen den Bildschirm wieder wach halten.
document.addEventListener("visibilitychange", () => {
  if (!spieler || spieler.fertig) return;
  if (document.visibilityState === "hidden") {
    if (spieler.running) ausfuehren(spieler.togglePause(performance.now()));
  } else {
    void wachHalten();
  }
});

startseite();
