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

/** Startbildschirm: kompakte Programmkarten mit Schnellstart. */
export function zeigeStart(root: HTMLElement, opt: StartOptionen): void {
  root.innerHTML = `
    <section class="screen start">
      <div class="topbar">
        <span class="app-name">Übungscoach</span>
        <button type="button" class="icon-btn" data-aktion="menue" aria-label="Menü">${MENU_ICON.menue}</button>
      </div>
      <h1 class="display">Was trainierst du heute?</h1>
      ${opt.programme.map((p, i) => (p.exercises.length ? kompakteKarte(p, i, opt.einstellungen) : leereKarte(p))).join("")}
      <button type="button" class="karte-zeile karte-neu" data-aktion="neu">
        <span class="karte-text"><span class="leer-titel">Neues Programm</span></span>
        <span class="karten-aktion karten-aktion-zweit">${ICON.plus}</span>
      </button>
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

/** Kompakte Karte: Antippen öffnet das Programm, ▶ startet sofort. */
function kompakteKarte(p: Trainingsplan, i: number, einst: Einstellungen): string {
  return `
    <article class="card karte-zeile kompakt">
      <button type="button" class="karte-text kompakt-text" data-oeffnen="${esc(p.id)}">
        <span class="kompakt-name">${esc(p.name)}</span>
        <span class="caption-normal muted">${programmInfo(p, einst)}</span>
      </button>
      <button type="button" class="karten-aktion" data-start="${i}" aria-label="${esc(p.name)} starten">${ICON.play}</button>
    </article>`;
}

/** Programm ohne Übungen: ganze Karte führt zum Bearbeiten. */
function leereKarte(p: Trainingsplan): string {
  return `
    <button type="button" class="card karte-zeile" data-bearbeiten="${esc(p.id)}">
      <span class="karte-text">
        <span class="kompakt-name">${esc(p.name || "Ohne Namen")}</span>
        <span class="caption-normal muted">Noch keine Übungen · Tippen zum Bearbeiten</span>
      </span>
      <span class="karten-aktion karten-aktion-zweit">${MENU_ICON.stiftGross}</span>
    </button>`;
}
