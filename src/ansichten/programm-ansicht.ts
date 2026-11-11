import { dose } from "../logik/format";
import { programmInfo } from "../logik/plan";
import type { Einstellungen, Trainingsplan } from "../logik/typen";
import { esc, ICON, MENU_ICON } from "./hilfen";

interface ProgrammAnsichtOptionen {
  plan: Trainingsplan;
  einstellungen: Einstellungen;
  onStart: (plan: Trainingsplan) => void;
  onBearbeiten: () => void;
  onZurueck: () => void;
}

const ZURUECK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`;

/** Programm ansehen: Übungen mit Menge, „Bearbeiten“ und „Training starten“. */
export function zeigeProgrammAnsicht(root: HTMLElement, opt: ProgrammAnsichtOptionen): void {
  const p = opt.plan;
  const zeilen = p.exercises
    .map(
      (e, i) => `
        <li class="ansicht-zeile">
          <span class="ansicht-nr zahl">${i + 1}</span>
          <span class="zeile-text">
            <span class="zeile-name">${esc(e.name)}</span>
            <span class="caption-normal muted zahl">${dose(e)}${e.hint ? ` · ${esc(e.hint)}` : ""}</span>
          </span>
        </li>`,
    )
    .join("");
  root.innerHTML = `
    <section class="screen programm-ansicht">
      <div class="topbar">
        <button type="button" class="text-btn zurueck-btn" data-a="zurueck">${ZURUECK_ICON}Übersicht</button>
        <button type="button" class="link-btn" data-a="bearbeiten">${MENU_ICON.stift}Bearbeiten</button>
      </div>
      <div class="ansicht-kopf">
        <h1 class="display">${esc(p.name)}</h1>
        <span class="muted">${programmInfo(p, opt.einstellungen)}</span>
        ${p.start ? `<span class="muted">Start: ${esc(p.start)}</span>` : ""}
      </div>
      <ol class="card ansicht-liste">${zeilen}</ol>
      <button type="button" class="btn-primary" data-a="start">${ICON.play}Training starten</button>
    </section>`;
  root.querySelector("[data-a=zurueck]")!.addEventListener("click", opt.onZurueck);
  root.querySelector("[data-a=bearbeiten]")!.addEventListener("click", opt.onBearbeiten);
  // läuft synchron im Klick – wichtig für die erste Ansage
  root.querySelector("[data-a=start]")!.addEventListener("click", () => opt.onStart(p));
}
