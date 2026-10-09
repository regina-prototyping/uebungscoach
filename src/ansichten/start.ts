import { dose } from "../logik/format";
import { buildPlan, gesamtDauer } from "../logik/plan";
import type { Einstellungen, Trainingsplan } from "../logik/typen";
import { esc, ICON, MENU_ICON } from "./hilfen";

interface StartOptionen {
  programme: Trainingsplan[];
  einstellungen: Einstellungen;
  onStart: (prog: Trainingsplan) => void;
  onBearbeiten: (programmId: string) => void;
  onNeuesProgramm: () => void;
  onMenue: () => void;
}

/** Startbildschirm: Programmkarten mit „Training starten“ und „Bearbeiten“. */
export function zeigeStart(root: HTMLElement, opt: StartOptionen): void {
  root.innerHTML = `
    <section class="screen start">
      <div class="topbar">
        <span class="app-name">Übungscoach</span>
        <button type="button" class="icon-btn" data-aktion="menue" aria-label="Menü">${MENU_ICON.menue}</button>
      </div>
      <h1 class="display">Was trainierst du heute?</h1>
      ${opt.programme.map((p, i) => (p.exercises.length ? programmKarte(p, i, opt.einstellungen) : leereKarte(p))).join("")}
      <button type="button" class="card zeilen-karte" data-aktion="neu">
        <span class="symbolfeld symbolfeld-primary">${ICON.plus}</span>
        <span class="leer-titel">Neues Programm</span>
      </button>
    </section>`;

  root.querySelector("[data-aktion=menue]")!.addEventListener("click", opt.onMenue);
  root.querySelector("[data-aktion=neu]")!.addEventListener("click", opt.onNeuesProgramm);
  root.querySelectorAll<HTMLButtonElement>("[data-start]").forEach((btn) => {
    // Wichtig: onStart läuft direkt im Klick, damit die erste Ansage sofort kommt
    btn.addEventListener("click", () => opt.onStart(opt.programme[Number(btn.dataset.start)]));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-bearbeiten]").forEach((btn) => {
    btn.addEventListener("click", () => opt.onBearbeiten(btn.dataset.bearbeiten!));
  });
}

function programmKarte(p: Trainingsplan, i: number, einst: Einstellungen): string {
  const minuten = Math.ceil(gesamtDauer(buildPlan(p, einst)) / 60);
  const anzahl = p.exercises.length === 1 ? "1 Übung" : `${p.exercises.length} Übungen`;
  return `
    <article class="card programm">
      <div class="programm-kopf">
        <div class="programm-titel">
          <h2 class="heading">${esc(p.name)}</h2>
          <button type="button" class="link-btn" data-bearbeiten="${esc(p.id)}">${MENU_ICON.stift}Bearbeiten</button>
        </div>
        <span class="muted klein">${anzahl} · ca. ${minuten} Min${p.start ? ` · Start: ${esc(p.start)}` : ""}</span>
      </div>
      <ul class="uebungsliste">
        ${p.exercises.map((e) => `<li><span class="uebung-name">${esc(e.name)}</span><span class="zahl muted">${dose(e)}</span></li>`).join("")}
      </ul>
      <button type="button" class="btn-primary" data-start="${i}">${ICON.play}Training starten</button>
    </article>`;
}

/** Programm ohne Übungen: ganze Karte führt zum Bearbeiten. */
function leereKarte(p: Trainingsplan): string {
  return `
    <button type="button" class="card zeilen-karte" data-bearbeiten="${esc(p.id)}">
      <span class="symbolfeld">${MENU_ICON.stiftGross}</span>
      <span class="leer-text">
        <span class="leer-titel">${esc(p.name || "Ohne Namen")}</span>
        <span class="caption-normal muted">Noch keine Übungen · Tippen zum Bearbeiten</span>
      </span>
    </button>`;
}
