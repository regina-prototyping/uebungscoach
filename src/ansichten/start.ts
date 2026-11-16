import { programmInfo } from "../logik/plan";
import type { Einstellungen, Trainingsplan } from "../logik/typen";
import { esc, ICON, MENU_ICON } from "./hilfen";

interface StartOptionen {
  programme: Trainingsplan[];
  einstellungen: Einstellungen;
  onStart: (prog: Trainingsplan) => void;
  onOeffnen: (programmId: string) => void;
  onBearbeiten: (programmId: string) => void;
  onNeuesProgramm: () => void;
  onMenue: () => void;
}

/** Startbildschirm: erstes Programm groß, die übrigen als Liste. */
export function zeigeStart(root: HTMLElement, opt: StartOptionen): void {
  // Bis es eine Statistik gibt: das erste Programm mit Übungen steht groß oben
  const iGross = opt.programme.findIndex((p) => p.exercises.length > 0);
  const weitere = opt.programme.filter((_, i) => i !== iGross);
  root.innerHTML = `
    <section class="screen start">
      <div class="topbar">
        <span class="app-name">Übungscoach</span>
        <button type="button" class="icon-btn" data-aktion="menue" aria-label="Menü">${MENU_ICON.menue}</button>
      </div>
      <h1 class="display">Was trainierst du heute?</h1>
      ${iGross >= 0 ? grosseKarte(opt.programme[iGross], iGross, opt.einstellungen) : ""}
      <div class="gruppe">
        <h2 class="abschnitt">${iGross >= 0 ? "Weitere Programme" : "Programme"}</h2>
        <div class="prog-liste">
          ${weitere.map((p) => zeile(p, opt.einstellungen)).join("")}
          <button type="button" class="prog-zeile prog-neu" data-aktion="neu">
            <span class="plus-rund">${ICON.plus}</span>
            <span>Neues Programm</span>
          </button>
        </div>
      </div>
    </section>`;

  root.querySelector("[data-aktion=menue]")!.addEventListener("click", opt.onMenue);
  root.querySelector("[data-aktion=neu]")!.addEventListener("click", opt.onNeuesProgramm);
  root.querySelectorAll<HTMLButtonElement>("[data-start]").forEach((btn) => {
    // Wichtig: onStart läuft direkt im Klick, damit die erste Ansage sofort kommt
    btn.addEventListener("click", () => opt.onStart(opt.programme[Number(btn.dataset.start)]));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-oeffnen]").forEach((btn) => {
    btn.addEventListener("click", () => opt.onOeffnen(btn.dataset.oeffnen!));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-bearbeiten]").forEach((btn) => {
    btn.addEventListener("click", () => opt.onBearbeiten(btn.dataset.bearbeiten!));
  });
}

/** Große Indigo-Karte: „Training starten“ startet sofort, ☰ öffnet die Programm-Ansicht. */
function grosseKarte(p: Trainingsplan, i: number, einst: Einstellungen): string {
  return `
    <article class="hero">
      <div class="hero-text">
        <h2 class="hero-name">${esc(p.name)}</h2>
        <span class="hero-info">${programmInfo(p, einst)}</span>
      </div>
      <div class="hero-knoepfe">
        <button type="button" class="hero-start" data-start="${i}">${ICON.play}Training starten</button>
        <button type="button" class="hero-ansehen" data-oeffnen="${esc(p.id)}" aria-label="${esc(p.name)} ansehen">${MENU_ICON.liste}</button>
      </div>
    </article>`;
}

/** Listenzeile: Programme mit Übungen öffnen die Ansicht, leere führen zum Bearbeiten. */
function zeile(p: Trainingsplan, einst: Einstellungen): string {
  const leer = p.exercises.length === 0;
  const ziel = leer ? `data-bearbeiten="${esc(p.id)}"` : `data-oeffnen="${esc(p.id)}"`;
  const info = leer ? "Noch keine Übungen · Tippen zum Bearbeiten" : programmInfo(p, einst);
  return `
    <button type="button" class="prog-zeile" ${ziel}>
      <span class="zeile-text">
        <span class="zeile-name">${esc(p.name || "Ohne Namen")}</span>
        <span class="caption-normal muted">${info}</span>
      </span>
      ${MENU_ICON.rechts}
    </button>`;
}
