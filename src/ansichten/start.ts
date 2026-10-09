import { dose } from "../logik/format";
import { buildPlan, gesamtDauer } from "../logik/plan";
import type { Einstellungen, Programm } from "../logik/typen";
import { esc, ICON } from "./hilfen";

interface StartOptionen {
  programme: Programm[];
  einstellungen: Einstellungen;
  onStart: (prog: Programm) => void;
  onEinstellungen: () => void;
}

/** Startbildschirm: Programmkarten mit „Training starten“. */
export function zeigeStart(root: HTMLElement, opt: StartOptionen): void {
  root.innerHTML = `
    <section class="screen start">
      <div class="topbar">
        <span class="app-name">Übungscoach</span>
        <button type="button" class="icon-btn" data-aktion="einstellungen" aria-label="Einstellungen">${ICON.regler}</button>
      </div>
      <h1 class="display">Was trainierst du heute?</h1>
      ${opt.programme.map((p, i) => (p.exercises.length ? programmKarte(p, i, opt.einstellungen) : leereKarte(p))).join("")}
    </section>`;

  root.querySelector("[data-aktion=einstellungen]")!.addEventListener("click", opt.onEinstellungen);
  root.querySelectorAll<HTMLButtonElement>("[data-start]").forEach((btn) => {
    // Wichtig: onStart läuft direkt im Klick, damit die erste Ansage sofort kommt
    btn.addEventListener("click", () => opt.onStart(opt.programme[Number(btn.dataset.start)]));
  });
}

function programmKarte(p: Programm, i: number, einst: Einstellungen): string {
  const minuten = Math.ceil(gesamtDauer(buildPlan(p, einst)) / 60);
  const anzahl = p.exercises.length === 1 ? "1 Übung" : `${p.exercises.length} Übungen`;
  return `
    <article class="card programm">
      <div class="programm-kopf">
        <div class="programm-titel">
          <h2 class="heading">${esc(p.name)}</h2>
          <span class="label muted">ca. ${minuten} Min</span>
        </div>
        <span class="muted klein">${anzahl}${p.start ? ` · Start: ${esc(p.start)}` : ""}</span>
      </div>
      <ul class="uebungsliste">
        ${p.exercises.map((e) => `<li><span class="uebung-name">${esc(e.name)}</span><span class="zahl muted">${dose(e)}</span></li>`).join("")}
      </ul>
      <button type="button" class="btn-primary" data-start="${i}">${ICON.play}Training starten</button>
    </article>`;
}

function leereKarte(p: Programm): string {
  return `
    <article class="card leer">
      <span class="symbolfeld">${ICON.plus}</span>
      <div class="leer-text">
        <span class="leer-titel">${esc(p.name)}</span>
        <span class="caption-normal muted">Übungen noch nicht eingetragen</span>
      </div>
    </article>`;
}
