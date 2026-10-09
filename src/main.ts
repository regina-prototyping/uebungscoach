import "./stil/theme.css";
import "./stil/app.css";
import { PROGRAMME } from "./data/programme";
import { ladeEinstellungen } from "./einstellungen";
import { zeigeStart } from "./ansichten/start";

const app = document.getElementById("app")!;
const einstellungen = ladeEinstellungen();

function startseite(): void {
  zeigeStart(app, {
    programme: PROGRAMME,
    einstellungen,
    onStart: () => {
      // Trainingsbildschirm folgt in Schritt 4
    },
    onEinstellungen: () => {
      // Einstellungen folgen in Schritt 5
    },
  });
}

startseite();
