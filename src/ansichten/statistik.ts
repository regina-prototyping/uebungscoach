import type { Daten } from "../logik/typen";
import { schnittText, trainingsProWoche, type Verlauf } from "../logik/verlauf";
import { esc, MENU_ICON } from "./hilfen";
import { obergrenze, wochenDiagramm, wochenLinie } from "./wochen-diagramm";

interface StatistikOptionen {
  daten: Daten;
  verlauf: Verlauf;
  onOeffnen: (programmId: string) => void;
  onFertig: () => void;
}

const anzahlText = (n: number) => (n === 1 ? "1 Training" : `${n} Trainings`);

/** Bildschirm „Statistik“: Trainings pro Woche der letzten 12 Wochen, gesamt und je Programm. */
export function zeigeStatistik(root: HTMLElement, opt: StatistikOptionen): void {
  const heute = new Date();
  const ids = opt.daten.programme.map((p) => p.id);
  const gesamt = trainingsProWoche(opt.verlauf, heute, ids);
  const diese = gesamt.wochen[gesamt.wochen.length - 1].anzahl;
  const programme = opt.daten.programme
    .map((p) => ({ p, r: trainingsProWoche(opt.verlauf, heute, [p.id]) }))
    .filter((x) => x.r.gesamt > 0)
    .sort((a, b) => b.r.gesamt - a.r.gesamt);
  const max = Math.max(0, ...programme.map((x) => obergrenze(x.r)));
  const zeilen = programme
    .map(
      ({ p, r }) => `
        <button type="button" class="prog-zeile st-zeile" data-id="${esc(p.id)}">
          <span class="zeile-text">
            <span class="zeile-name">${esc(p.name || "Ohne Namen")}</span>
            <span class="caption-normal muted zahl">${[anzahlText(r.gesamt), schnittText(r)].filter(Boolean).join(" · ")}</span>
          </span>
          ${wochenLinie(r, max)}
          ${MENU_ICON.rechts}
        </button>`,
    )
    .join("");
  const inhalt = gesamt.gesamt
    ? `
      <section class="gruppe st-gesamt" aria-labelledby="st-titel">
        <div class="vl-kopf">
          <h2 class="abschnitt" id="st-titel">Trainings pro Woche</h2>
          <span class="vl-summe zahl"><b>${gesamt.gesamt}</b> in 12 Wochen</span>
        </div>
        ${wochenDiagramm(gesamt)}
        <p class="muted zahl st-text">${[schnittText(gesamt), `diese Woche bisher ${diese}`].filter(Boolean).join(" · ")}</p>
      </section>
      <section class="gruppe" aria-labelledby="st-prog">
        <h2 class="abschnitt" id="st-prog">Nach Programm</h2>
        <div class="prog-liste">${zeilen}</div>
      </section>`
    : `<p class="muted hinweis-text">Noch keine Trainings in den letzten 12 Wochen. Sobald du ein Training bis „Training geschafft“ machst, erscheint es hier.</p>`;
  root.innerHTML = `
    <section class="screen statistik">
      <div class="topbar">
        <h1 class="title">Statistik</h1>
        <button type="button" class="pill-btn" data-a="fertig">Fertig</button>
      </div>
      ${inhalt}
    </section>`;
  root.querySelector("[data-a=fertig]")!.addEventListener("click", opt.onFertig);
  root.querySelectorAll<HTMLButtonElement>(".st-zeile").forEach((b) => b.addEventListener("click", () => opt.onOeffnen(b.dataset.id!)));
}
