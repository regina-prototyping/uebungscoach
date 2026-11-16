import { programmInfo } from "../logik/plan";
import type { Einstellungen, Trainingsplan } from "../logik/typen";
import type { Raster } from "../logik/verlauf";
import { esc, ICON, MENU_ICON } from "./hilfen";

interface StartOptionen {
  programme: Trainingsplan[];
  /** IDs der (bis zu zwei) Programme, die oben als Karten stehen. */
  oben: string[];
  /** Verlauf der letzten 2 Wochen. */
  raster: Raster;
  einstellungen: Einstellungen;
  onStart: (prog: Trainingsplan) => void;
  onOeffnen: (programmId: string) => void;
  onBearbeiten: (programmId: string) => void;
  onNeuesProgramm: () => void;
  onMenue: () => void;
}

/** Startbildschirm: zwei Programme als Karten, darunter Verlauf und die übrigen Programme. */
export function zeigeStart(root: HTMLElement, opt: StartOptionen): void {
  const oben = opt.oben.map((id) => opt.programme.find((p) => p.id === id)).filter((p): p is Trainingsplan => !!p);
  const weitere = opt.programme.filter((p) => !opt.oben.includes(p.id));
  root.innerHTML = `
    <section class="screen start">
      <div class="topbar">
        <span class="app-name">Übungscoach</span>
        <button type="button" class="icon-btn" data-aktion="menue" aria-label="Menü">${MENU_ICON.menue}</button>
      </div>
      <h1 class="display">Was trainierst du heute?</h1>
      ${oben.length ? `<div class="karten${oben.length === 1 ? " karten-eins" : ""}">${oben.map((p, i) => karte(p, i, opt.einstellungen)).join("")}</div>` : ""}
      ${oben.length ? verlauf(opt.raster) : ""}
      <div class="gruppe weitere">
        <h2 class="abschnitt">${oben.length ? "Weitere Programme" : "Programme"}</h2>
        <div class="prog-liste">
          ${weitere.map(zeile).join("")}
          <button type="button" class="prog-zeile prog-klein prog-neu" data-aktion="neu">
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
    btn.addEventListener("click", () => opt.onStart(oben[Number(btn.dataset.start)]));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-oeffnen]").forEach((btn) => {
    btn.addEventListener("click", () => opt.onOeffnen(btn.dataset.oeffnen!));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-bearbeiten]").forEach((btn) => {
    btn.addEventListener("click", () => opt.onBearbeiten(btn.dataset.bearbeiten!));
  });
}

/** Programmkarte: ▶ startet sofort, die Liste öffnet die Programm-Ansicht. Die zweite Karte ist hell. */
function karte(p: Trainingsplan, i: number, einst: Einstellungen): string {
  const name = esc(p.name || "Ohne Namen");
  return `
    <article class="karte${i === 1 ? " karte-hell" : ""}">
      <div class="karte-text">
        <h2 class="karte-name">${name}</h2>
        <span class="karte-info zahl">${programmInfo(p, einst).replace("ca. ", "")}</span>
      </div>
      <div class="karte-knoepfe">
        <button type="button" class="karte-start" data-start="${i}" aria-label="${name} starten">${ICON.play}</button>
        <button type="button" class="karte-ansehen" data-oeffnen="${esc(p.id)}" aria-label="${name} ansehen">${MENU_ICON.liste}</button>
      </div>
    </article>`;
}

/** Verlauf der letzten 14 Tage: je Programm eine Zeile Kästchen, mit Lücke zwischen den Wochen. */
function verlauf(r: Raster): string {
  const halb = r.kopf.length / 2;
  const reihe = (zellen: string[]) =>
    `<div class="vl-reihe" aria-hidden="true">${zellen.slice(0, halb).join("")}<span></span>${zellen.slice(halb).join("")}</div>`;
  const letzte = r.kopf.length - 1;
  const kopf = reihe(r.kopf.map((w, i) => `<span class="vl-wt${i === letzte ? " heute" : ""}">${w}</span>`));
  const zeilen = r.zeilen
    .map((z) => {
      const tage = z.tage.filter(Boolean).length;
      const zellen = z.tage.map((an, i) => `<span class="vl-k${an ? " an" : ""}${i === letzte ? " heute" : ""}"></span>`);
      return `
        <div class="vl-zeile" role="img" aria-label="${esc(z.name)}: an ${tage} von ${z.tage.length} Tagen trainiert${z.tage[letzte] ? ", auch heute" : ""}">
          <span class="vl-name" aria-hidden="true">${esc(z.name)} <span class="zahl">· ${z.anzahl} ×</span></span>
          ${reihe(zellen)}
        </div>`;
    })
    .join("");
  const gesamt = r.gesamt ? `<b class="zahl">${r.gesamt}</b> ${r.gesamt === 1 ? "Training" : "Trainings"}` : "Noch keine Trainings";
  return `
    <section class="gruppe verlauf" aria-label="Verlauf der letzten 2 Wochen">
      <div class="vl-kopf">
        <h2 class="abschnitt">Letzte 2 Wochen</h2>
        <span class="vl-summe">${gesamt}</span>
      </div>
      ${kopf}
      ${zeilen}
    </section>`;
}

/** Schmale Listenzeile: Programme mit Übungen öffnen die Ansicht, leere führen zum Bearbeiten. */
function zeile(p: Trainingsplan): string {
  const leer = p.exercises.length === 0;
  const ziel = leer ? `data-bearbeiten="${esc(p.id)}"` : `data-oeffnen="${esc(p.id)}"`;
  const n = p.exercises.length;
  const info = leer ? "Noch keine Übungen" : n === 1 ? "1 Übung" : `${n} Übungen`;
  return `
    <button type="button" class="prog-zeile prog-klein" ${ziel}>
      <span class="zeile-name">${esc(p.name || "Ohne Namen")}</span>
      <span class="caption-normal muted">· ${info}</span>
      ${MENU_ICON.rechts}
    </button>`;
}
