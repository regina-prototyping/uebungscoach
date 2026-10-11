import { verwendetIn } from "../logik/daten";
import { dose } from "../logik/format";
import type { Daten } from "../logik/typen";
import { esc, ICON, MENU_ICON } from "./hilfen";

interface BibliothekOptionen {
  daten: Daten;
  onOeffnen: (uebungId: string) => void;
  onNeu: () => void;
  onFertig: () => void;
}

/** Übungsbibliothek: alle Übungen mit den Programmen, in denen sie vorkommen. */
export function zeigeBibliothek(root: HTMLElement, opt: BibliothekOptionen): void {
  const zeilen = opt.daten.uebungen
    .map((u) => {
      const programme = [...new Set(verwendetIn(opt.daten, u.id).map((p) => p.name || "Neues Programm"))];
      const verwendung = programme.length
        ? `<span class="caption-normal verwendet">In: ${esc(programme.join(", "))}</span>`
        : `<span class="caption-normal unbenutzt">In keinem Programm</span>`;
      return `
        <button type="button" class="zeile zeile-wahl" data-id="${esc(u.id)}">
          <span class="zeile-text">
            <span class="zeile-name">${esc(u.name || "Ohne Namen")}</span>
            <span class="caption-normal muted zahl">${dose(u)}</span>
            ${verwendung}
          </span>
          <span class="zeit-pfeil">${MENU_ICON.rechts}</span>
        </button>`;
    })
    .join("");
  root.innerHTML = `
    <section class="screen bearbeiten">
      <div class="topbar">
        <h1 class="title">Übungen</h1>
        <button type="button" class="pill-btn" data-a="fertig">Fertig</button>
      </div>
      <button type="button" class="btn-soft" data-a="neu">${ICON.plus}Neue Übung anlegen</button>
      ${zeilen ? `<section class="card felder">${zeilen}</section>` : `<p class="muted">Noch keine Übungen.</p>`}
      <p class="caption-normal muted verwendung">Löschen kannst du nur Übungen, die in keinem Programm vorkommen – in der Übung ganz unten.</p>
    </section>`;
  root.querySelector("[data-a=fertig]")!.addEventListener("click", opt.onFertig);
  root.querySelector("[data-a=neu]")!.addEventListener("click", opt.onNeu);
  root.querySelectorAll<HTMLButtonElement>("[data-id]").forEach((b) => b.addEventListener("click", () => opt.onOeffnen(b.dataset.id!)));
}
