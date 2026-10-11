import { findeProgramm } from "../logik/daten";
import { dose } from "../logik/format";
import type { Daten } from "../logik/typen";
import { esc, ICON } from "./hilfen";

interface AuswahlOptionen {
  daten: Daten;
  programmId: string;
  onWaehlen: (uebungId: string) => void;
  onNeu: () => void;
  onAbbrechen: () => void;
}

/** „Übung hinzufügen“: Auswahl aus der Bibliothek, oben „Neue Übung anlegen“. */
export function zeigeAuswahl(root: HTMLElement, opt: AuswahlOptionen): void {
  const p = findeProgramm(opt.daten, opt.programmId)!;
  const zeilen = opt.daten.uebungen
    .map((u) => {
      const schon = p.uebungen.includes(u.id) ? " · schon im Programm" : "";
      return `
        <button type="button" class="zeile zeile-wahl" data-id="${esc(u.id)}">
          <span class="zeile-text"><span class="zeile-name">${esc(u.name || "Ohne Namen")}</span><span class="caption-normal muted zahl">${dose(u)}${schon}</span></span>
          <span class="stepper-btn symbol-plus">${ICON.plus}</span>
        </button>`;
    })
    .join("");
  root.innerHTML = `
    <section class="screen bearbeiten">
      <div class="topbar">
        <h1 class="title">Übung hinzufügen</h1>
        <button type="button" class="text-btn" data-a="abbrechen">Abbrechen</button>
      </div>
      <p class="muted unter-titel">Zu „${esc(p.name || "Neues Programm")}“</p>
      <button type="button" class="btn-soft" data-a="neu">${ICON.plus}Neue Übung anlegen</button>
      ${zeilen ? `<h2 class="abschnitt">Aus deinen Übungen</h2><section class="card felder">${zeilen}</section>` : ""}
    </section>`;
  root.querySelector("[data-a=abbrechen]")!.addEventListener("click", opt.onAbbrechen);
  root.querySelector("[data-a=neu]")!.addEventListener("click", opt.onNeu);
  root.querySelectorAll<HTMLButtonElement>("[data-id]").forEach((b) => b.addEventListener("click", () => opt.onWaehlen(b.dataset.id!)));
}
