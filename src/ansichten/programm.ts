import { findeProgramm, findeUebung } from "../logik/daten";
import { dose } from "../logik/format";
import type { Daten } from "../logik/typen";
import { esc, ICON, LISTE_ICON } from "./hilfen";

interface ProgrammOptionen {
  daten: () => Daten;
  programmId: string;
  neu: boolean;
  onName: (name: string) => void;
  onStart: (start: string) => void;
  onVerschieben: (index: number, richtung: -1 | 1) => void;
  onEntfernen: (index: number) => void;
  onUebungOeffnen: (uebungId: string) => void;
  onHinzufuegen: () => void;
  onLoeschen: () => void;
  onFertig: () => void;
}

/** Bildschirm „Programm bearbeiten“. Änderungen werden sofort gespeichert. */
export class ProgrammAnsicht {
  private liste: HTMLElement;
  private anzahl: HTMLElement;

  constructor(
    root: HTMLElement,
    private opt: ProgrammOptionen,
  ) {
    const p = findeProgramm(opt.daten(), opt.programmId)!;
    root.innerHTML = `
      <section class="screen bearbeiten">
        <div class="topbar">
          <h1 class="title">${opt.neu ? "Neues Programm" : "Programm"}</h1>
          <button type="button" class="pill-btn" data-a="fertig">Fertig</button>
        </div>

        <section class="card felder">
          <label class="eingabe-feld">
            <span class="feld-label">Name</span>
            <input class="eingabe" data-e="name" value="${esc(p.name)}" placeholder="z. B. Schulter" autocomplete="off" enterkeyhint="next">
          </label>
          <label class="eingabe-feld">
            <span class="feld-label">Startposition <span class="optional">· optional</span></span>
            <input class="eingabe" data-e="start" value="${esc(p.start ?? "")}" placeholder="z. B. Auf dem Rücken liegen" autocomplete="off" enterkeyhint="done">
          </label>
        </section>

        <h2 class="abschnitt" data-e="anzahl"></h2>
        <section class="card felder" data-e="liste"></section>

        <button type="button" class="btn-soft" data-a="hinzufuegen">${ICON.plus}Übung hinzufügen</button>
        <button type="button" class="text-btn loeschen-btn" data-a="loeschen">Programm löschen</button>
      </section>`;

    this.liste = root.querySelector("[data-e=liste]")!;
    this.anzahl = root.querySelector("[data-e=anzahl]")!;
    const name = root.querySelector<HTMLInputElement>("[data-e=name]")!;
    const start = root.querySelector<HTMLInputElement>("[data-e=start]")!;
    name.addEventListener("input", () => opt.onName(name.value));
    start.addEventListener("input", () => opt.onStart(start.value));
    // Enter schließt die Tastatur bzw. springt weiter
    name.addEventListener("keydown", (ev) => ev.key === "Enter" && start.focus());
    start.addEventListener("keydown", (ev) => ev.key === "Enter" && start.blur());

    root.querySelector("[data-a=fertig]")!.addEventListener("click", opt.onFertig);
    root.querySelector("[data-a=hinzufuegen]")!.addEventListener("click", opt.onHinzufuegen);
    root.querySelector("[data-a=loeschen]")!.addEventListener("click", opt.onLoeschen);
    this.liste.addEventListener("click", (ev) => this.klick(ev));

    this.listeZeichnen();
    if (opt.neu) name.focus();
  }

  /** Zeichnet nur die Übungsliste neu (die Textfelder behalten den Fokus). */
  listeZeichnen(fokus?: { index: number; aktion: string }): void {
    const d = this.opt.daten();
    const ids = findeProgramm(d, this.opt.programmId)?.uebungen ?? [];
    this.anzahl.textContent = `Übungen · ${ids.length}`;
    if (!ids.length) {
      this.liste.innerHTML = `<p class="leer-hinweis muted">Noch keine Übungen. Füge unten die erste hinzu.</p>`;
      return;
    }
    this.liste.innerHTML = ids
      .map((id, i) => {
        const u = findeUebung(d, id);
        const name = u ? esc(u.name || "Ohne Namen") : "Unbekannte Übung";
        return `
          <div class="zeile">
            <button type="button" class="zeile-text zeile-link" data-a="oeffnen" data-i="${i}" ${u ? "" : "disabled"}>
              <span class="zeile-name">${name}</span><span class="caption-normal muted zahl">${u ? dose(u) : ""}</span>
            </button>
            <button type="button" class="stepper-btn" data-a="hoch" data-i="${i}" aria-label="${name} nach oben" ${i === 0 ? "disabled" : ""}>${LISTE_ICON.hoch}</button>
            <button type="button" class="stepper-btn" data-a="runter" data-i="${i}" aria-label="${name} nach unten" ${i === ids.length - 1 ? "disabled" : ""}>${LISTE_ICON.runter}</button>
            <button type="button" class="stepper-btn" data-a="entfernen" data-i="${i}" aria-label="${name} aus dem Programm entfernen">${LISTE_ICON.entfernen}</button>
          </div>`;
      })
      .join("");
    if (fokus) {
      const b = this.liste.querySelector<HTMLButtonElement>(`[data-a=${fokus.aktion}][data-i="${fokus.index}"]`);
      (b && !b.disabled ? b : this.liste.querySelector<HTMLButtonElement>(`[data-i="${fokus.index}"]`))?.focus();
    }
  }

  private klick(ev: Event): void {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>("button[data-a]");
    if (!b || b.disabled) return;
    const i = Number(b.dataset.i);
    if (b.dataset.a === "hoch" || b.dataset.a === "runter") {
      const richtung = b.dataset.a === "hoch" ? -1 : 1;
      this.opt.onVerschieben(i, richtung);
      this.listeZeichnen({ index: i + richtung, aktion: b.dataset.a });
    } else if (b.dataset.a === "entfernen") {
      this.opt.onEntfernen(i);
      this.listeZeichnen();
    } else if (b.dataset.a === "oeffnen") {
      const id = findeProgramm(this.opt.daten(), this.opt.programmId)!.uebungen[i];
      this.opt.onUebungOeffnen(id);
    }
  }
}
