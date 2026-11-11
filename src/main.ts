import "./stil/theme.css";
import "./stil/app.css";
import { ladeAnsageModus, ladeEinstellungen, speichereAnsageModus, speichereEinstellungen } from "./einstellungen";
import { datenDauerhaftAufheben, ladeDaten, speichereDaten } from "./daten-speicher";
import {
  findeProgramm,
  programmAendern,
  programmAnlegen,
  programmAufraeumen,
  programmLoeschen,
  trainingsplan,
  uebungAendern,
  uebungAnlegen,
  uebungAufraeumen,
  uebungDuplizieren,
  uebungEntfernen,
  uebungHinzufuegen,
  uebungLoeschen,
  uebungVerschieben,
  findeUebung,
} from "./logik/daten";
import { zeigeStart } from "./ansichten/start";
import { zeigeMenue } from "./ansichten/menue";
import { ProgrammAnsicht } from "./ansichten/programm";
import { zeigeProgrammAnsicht } from "./ansichten/programm-ansicht";
import { zeigeAuswahl } from "./ansichten/auswahl";
import { UebungAnsicht } from "./ansichten/uebung";
import { zeigeBibliothek } from "./ansichten/bibliothek";
import { schliesseRueckgaengig, zeigeRueckgaengig } from "./ansichten/rueckgaengig";
import { zeigeEinstellungen } from "./ansichten/einstellungen";
import { TrainingAnsicht } from "./ansichten/training";
import { hoerbar, Spieler, type Ereignis } from "./logik/spieler";
import type { Daten, Trainingsplan } from "./logik/typen";
import { beiAnsageStatus, sprich, still, stimmenStatus, waehleStimme } from "./geraet/sprache";
import { piep, SIGNAL_VORSCHAU, signalTon, tonBereit } from "./geraet/piep";
import { wachFreigeben, wachHalten } from "./geraet/wachhalten";
import { aktuellesZiel, ersetze, geheZu, starteNavigation, zurueck, type Ziel } from "./navigation";

const app = document.getElementById("app")!;
let einstellungen = ladeEinstellungen();
let ansageModus = ladeAnsageModus();
let vorschauTimer = 0;
let daten = ladeDaten();
// Falls die App beim Anlegen eines Programms geschlossen wurde: aufräumen
for (const p of daten.programme) daten = programmAufraeumen(daten, p.id);
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

/** Zuletzt angezeigtes Ziel – zum Aufräumen beim Verlassen. */
let vorher: Ziel = { name: "start" };

/**
 * Übernimmt eine neue Fassung der Daten und speichert sie sofort.
 * Eine offene Rückgängig-Leiste verschwindet, damit Rückgängig keine
 * späteren Änderungen überschreibt.
 */
function aendern(neu: Daten): void {
  if (neu === daten) return;
  schliesseRueckgaengig();
  daten = neu;
  speichereDaten(daten);
}

/** Ändert die Daten mit „Rückgängig“-Leiste; Rückgängig stellt die vorige Fassung her. */
function aendernMitRueckgaengig(neu: Daten, text: string): void {
  const alt = daten;
  aendern(neu);
  zeigeRueckgaengig(text, () => {
    daten = alt;
    speichereDaten(daten);
    anzeigen(aktuellesZiel());
  });
}

/** Führt die Anweisungen des Spielers aus. */
function ausfuehren(ereignisse: Ereignis[]): void {
  for (const e of ereignisse) {
    if (!hoerbar(e, ansageModus)) continue;
    if (e.typ === "signal") signalTon(e.signal);
    else if (e.typ === "sagen") sprich(e.text);
    else if (e.typ === "still") still();
    else if (e.typ === "piep") piep();
    else if (e.typ === "fertig") wachFreigeben();
  }
  if (spieler && ansicht) ansicht.aktualisieren(spieler);
}

/** Zeichnet den Bildschirm für ein Navigationsziel. */
function anzeigen(ziel: Ziel): void {
  if (ziel.name !== "training") trainingAufraeumen();
  // Neues Programm ohne Namen beim Verlassen verwerfen bzw. benennen
  if (vorher.name === "programm" && !(ziel.name === "programm" && ziel.id === vorher.id) && ziel.name !== "auswahl" && ziel.name !== "uebung") {
    aendern(programmAufraeumen(daten, vorher.id));
  }
  // Neue Übung ohne Namen beim Verlassen verwerfen
  if (vorher.name === "uebung" && !(ziel.name === "uebung" && ziel.id === vorher.id)) {
    aendern(uebungAufraeumen(daten, vorher.id));
  }
  vorher = ziel;
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
      zeigeBibliothek(app, {
        daten,
        onOeffnen: (id) => geheZu({ name: "uebung", id }),
        onNeu: () => {
          const { daten: neu, id } = uebungAnlegen(daten);
          aendern(neu);
          geheZu({ name: "uebung", id, neu: true });
        },
        onFertig: zurueck,
      });
      window.scrollTo(0, 0);
      break;
    case "ansicht": {
      const plan = trainingsplan(daten, ziel.id);
      if (!plan) return ersetze({ name: "start" });
      zeigeProgrammAnsicht(app, {
        plan,
        einstellungen,
        onStart: trainingStarten,
        onBearbeiten: () => geheZu({ name: "programm", id: ziel.id }),
        onZurueck: zurueck,
      });
      window.scrollTo(0, 0);
      break;
    }
    case "programm":
      if (!findeProgramm(daten, ziel.id)) return ersetze({ name: "start" });
      programmSeite(ziel.id, !!ziel.neu);
      break;
    case "auswahl":
      if (!findeProgramm(daten, ziel.programmId)) return ersetze({ name: "start" });
      auswahlSeite(ziel.programmId);
      break;
    case "uebung":
      if (!findeUebung(daten, ziel.id)) return zurueck();
      uebungSeite(ziel.id, !!ziel.neu);
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

/** Läuft synchron im Klick – wichtig für die erste Ansage. */
function trainingStarten(plan: Trainingsplan): void {
  naechsterPlan = plan;
  geheZu({ name: "training", id: plan.id });
}

function startseite(): void {
  zeigeStart(app, {
    programme: daten.programme.map((p) => trainingsplan(daten, p.id)!),
    einstellungen,
    onStart: trainingStarten,
    onOeffnen: (id) => geheZu({ name: "ansicht", id }),
    onBearbeiten: (id) => geheZu({ name: "programm", id }),
    onNeuesProgramm: () => {
      const { daten: neu, id } = programmAnlegen(daten);
      aendern(neu);
      geheZu({ name: "programm", id, neu: true });
    },
    onMenue: () => geheZu({ name: "menue" }),
  });
  window.scrollTo(0, 0);
}

function programmSeite(id: string, neu: boolean): void {
  new ProgrammAnsicht(app, {
    daten: () => daten,
    programmId: id,
    neu,
    onName: (name) => aendern(programmAendern(daten, id, { name })),
    onStart: (start) => aendern(programmAendern(daten, id, { start })),
    onVerschieben: (i, richtung) => aendern(uebungVerschieben(daten, id, i, richtung)),
    onEntfernen: (i) => {
      const uebungId = findeProgramm(daten, id)!.uebungen[i];
      const name = findeUebung(daten, uebungId)?.name || "Übung";
      aendernMitRueckgaengig(uebungEntfernen(daten, id, i), `„${name}“ entfernt`);
    },
    onUebungOeffnen: (uebungId) => geheZu({ name: "uebung", id: uebungId }),
    onHinzufuegen: () => geheZu({ name: "auswahl", programmId: id }),
    onLoeschen: () => {
      const name = findeProgramm(daten, id)!.name || "Programm";
      aendernMitRueckgaengig(programmLoeschen(daten, id), `„${name}“ gelöscht`);
      zurueck();
    },
    onFertig: zurueck,
  });
  window.scrollTo(0, 0);
}

function auswahlSeite(programmId: string): void {
  zeigeAuswahl(app, {
    daten,
    programmId,
    onWaehlen: (uebungId) => {
      aendern(uebungHinzufuegen(daten, programmId, uebungId));
      zurueck();
    },
    onNeu: () => {
      // Neue Übung sofort anlegen und ins Programm setzen; ohne Namen wird sie beim Verlassen verworfen
      const { daten: neu, id } = uebungAnlegen(daten);
      aendern(uebungHinzufuegen(neu, programmId, id));
      ersetze({ name: "uebung", id, neu: true });
    },
    onAbbrechen: zurueck,
  });
  window.scrollTo(0, 0);
}

function uebungSeite(id: string, neu: boolean): void {
  new UebungAnsicht(app, {
    daten: () => daten,
    einstellungen,
    uebungId: id,
    neu,
    onAendern: (aenderung) => aendern(uebungAendern(daten, id, aenderung)),
    onDuplizieren: () => {
      const { daten: d, id: kopie } = uebungDuplizieren(daten, id);
      aendern(d);
      ersetze({ name: "uebung", id: kopie });
    },
    onLoeschen: () => {
      const name = findeUebung(daten, id)?.name || "Übung";
      const d = uebungLoeschen(daten, id);
      if (!d) return;
      aendernMitRueckgaengig(d, `„${name}“ gelöscht`);
      zurueck();
    },
    onFertig: zurueck,
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
    beiAnsageStatus,
    modus: ansageModus,
    onModus: (m) => {
      ansageModus = m;
      speichereAnsageModus(m);
    },
    onToeneAnhoeren: (anzeigen) => {
      tonBereit();
      window.clearTimeout(vorschauTimer);
      // Ein Signal nach dem anderen, mit kurzer Pause dazwischen
      const naechstes = (i: number) => {
        if (i >= SIGNAL_VORSCHAU.length) return anzeigen("Alle Töne gespielt.");
        const { signal, text } = SIGNAL_VORSCHAU[i];
        anzeigen(`${i + 1}/${SIGNAL_VORSCHAU.length}: ${text}`);
        signalTon(signal);
        vorschauTimer = window.setTimeout(() => naechstes(i + 1), 1600);
      };
      naechstes(0);
    },
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
