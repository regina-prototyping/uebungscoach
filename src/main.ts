import "./stil/theme.css";
import "./stil/app.css";
import { ladeEinstellungen, speichereEinstellungen } from "./einstellungen";
import { datenDauerhaftAufheben, ladeDaten } from "./daten-speicher";
import { trainingsplan } from "./logik/daten";
import { zeigeStart } from "./ansichten/start";
import { zeigeMenue } from "./ansichten/menue";
import { zeigePlatzhalter } from "./ansichten/platzhalter";
import { zeigeEinstellungen } from "./ansichten/einstellungen";
import { TrainingAnsicht } from "./ansichten/training";
import { Spieler, type Ereignis } from "./logik/spieler";
import type { Trainingsplan } from "./logik/typen";
import { sprich, still, stimmenStatus, waehleStimme } from "./geraet/sprache";
import { piep, tonBereit } from "./geraet/piep";
import { wachFreigeben, wachHalten } from "./geraet/wachhalten";
import { aktuellesZiel, ersetze, geheZu, starteNavigation, zurueck, type Ziel } from "./navigation";

const app = document.getElementById("app")!;
let einstellungen = ladeEinstellungen();
let daten = ladeDaten();
datenDauerhaftAufheben();

let spieler: Spieler | null = null;
let ansicht: TrainingAnsicht | null = null;
let timer = 0;
/** Lief das Training, als „Beenden“ getippt wurde? */
let liefVorDialog = false;
/** Wurde „Beenden“ bestätigt? Dann darf die Navigation das Training verlassen. */
let verlassen = false;
/** Plan für das Training, das gleich angezeigt wird. */
let naechsterPlan: Trainingsplan | null = null;

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

/** Zeichnet den Bildschirm für ein Navigationsziel. */
function anzeigen(ziel: Ziel): void {
  if (ziel.name !== "training") trainingAufraeumen();
  switch (ziel.name) {
    case "start": {
      // Kommt man aus dem Menü zurück, nur das Menü schließen (Scrollposition bleibt)
      const menue = app.querySelector(".menue-overlay");
      if (menue && app.querySelector(".start")) menue.remove();
      else startseite();
      break;
    }
    case "menue":
      if (!app.querySelector(".start")) startseite();
      zeigeMenue(app, {
        onSchliessen: zurueck,
        // ersetzen statt öffnen: Zurück führt dann zur Startseite, nicht ins Menü
        onUebungen: () => ersetze({ name: "uebungen" }),
        onEinstellungen: () => ersetze({ name: "einstellungen" }),
      });
      break;
    case "einstellungen":
      einstellungsSeite();
      break;
    case "uebungen":
      zeigePlatzhalter(app, "Übungen", "Die Übungsbibliothek kommt in Schritt 5.", zurueck);
      window.scrollTo(0, 0);
      break;
    case "programm":
      zeigePlatzhalter(app, "Programm", "Programm bearbeiten kommt in Schritt 3.", zurueck);
      window.scrollTo(0, 0);
      break;
    case "training":
      if (naechsterPlan) training(naechsterPlan);
      else if (!spieler) ersetze({ name: "start" });
      naechsterPlan = null;
      break;
  }
}

function trainingAufraeumen(): void {
  if (!spieler) return;
  window.clearInterval(timer);
  still();
  wachFreigeben();
  spieler = null;
  ansicht = null;
  verlassen = false;
}

function startseite(): void {
  zeigeStart(app, {
    programme: daten.programme.map((p) => trainingsplan(daten, p.id)!),
    einstellungen,
    // läuft synchron im Klick – wichtig für die erste Ansage
    onStart: (plan) => {
      naechsterPlan = plan;
      geheZu({ name: "training", id: plan.id });
    },
    onBearbeiten: (id) => geheZu({ name: "programm", id }),
    onNeuesProgramm: () => geheZu({ name: "programm", id: "neu" }),
    onMenue: () => geheZu({ name: "menue" }),
  });
  window.scrollTo(0, 0);
}

function einstellungsSeite(): void {
  zeigeEinstellungen(app, {
    werte: einstellungen,
    onAendern: (neu) => {
      einstellungen = neu;
      speichereEinstellungen(neu);
    },
    onFertig: zurueck,
    onStimmeTesten: () => {
      tonBereit();
      still();
      sprich("Hallo! So klingen die Ansagen. Eins, zwei, drei.");
      piep();
    },
    stimmenStatus,
  });
  window.scrollTo(0, 0);
}

/** Läuft direkt im Klick auf „Training starten“ bzw. „Nochmal“. */
function training(prog: Trainingsplan): void {
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
    beenden: () => (spieler!.fertig ? trainingVerlassen() : beendenFragen()),
    nochmal: () => training(prog),
    uebersicht: trainingVerlassen,
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

/** Zurück zur Startseite, ohne Rückfrage. */
function trainingVerlassen(): void {
  verlassen = true;
  zurueck();
}

/** Rückfrage „Training beenden?“ zeigen (z. B. bei der Zurück-Geste). */
function beendenFragen(): void {
  if (!spieler || !ansicht || ansicht.dialogOffen) return;
  liefVorDialog = spieler.running;
  if (liefVorDialog) ausfuehren(spieler.togglePause(performance.now()));
  ansicht.dialog(true);
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

// Escape schließt das Menü (z. B. am Computer)
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && aktuellesZiel().name === "menue") zurueck();
});

starteNavigation({
  anzeigen,
  // Zurück-Geste im laufenden Training: erst nachfragen
  zurueckAbfangen: (von) => {
    if (von.name !== "training" || !spieler || spieler.fertig || verlassen) return false;
    beendenFragen();
    return true;
  },
});
