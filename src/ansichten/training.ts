import { anzeige, screenreaderAnsage } from "../logik/anzeige";
import type { Spieler } from "../logik/spieler";
import { esc, STEUER_ICON } from "./hilfen";

/** Umfang des Rings: 2 · π · 130 */
const UMFANG = 816.8;

export interface TrainingAktionen {
  pause: () => void;
  zurueck: () => void;
  weiter: () => void;
  beenden: () => void;
  nochmal: () => void;
  uebersicht: () => void;
}

/**
 * Trainingsbildschirm. Wird einmal aufgebaut; `aktualisieren` setzt danach
 * nur noch Texte und Werte (wird alle 100 ms aufgerufen).
 */
export class TrainingAnsicht {
  private el: Record<string, HTMLElement | SVGElement> = {};
  private dialogEl: HTMLDialogElement;
  /** Element, das vor dem Öffnen des Dialogs den Fokus hatte. */
  private fokusVorDialog: HTMLElement | null = null;
  /** Zuletzt angesagter Abschnitt (für den Screenreader). */
  private letzteAnsage = "";

  constructor(root: HTMLElement, programmName: string, aktion: TrainingAktionen) {
    root.innerHTML = `
      <section class="screen training" data-phase="ruhe">
        <p class="sr-only" aria-live="polite" data-e="ansage"></p>
        <div class="t-kopf">
          <button type="button" class="text-btn" data-a="beenden">Beenden</button>
          <span class="t-programm">${esc(programmName)}</span>
          <span class="t-restzeit zahl" data-e="restzeit"></span>
        </div>
        <div class="balken"><div class="balken-fuellung" data-e="balken"></div></div>

        <div class="t-info">
          <h1 class="title" data-e="titel"></h1>
          <p class="t-hinweis" data-e="hinweis"></p>
          <div class="chips" data-e="chips"></div>
        </div>

        <div class="ring-karte">
          <div class="ring">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <defs>
                <!-- Verlauf über den Ring: oben links dunkel, unten rechts hell; Farben je Phase aus dem CSS -->
                <linearGradient id="ring-verlauf" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0" class="ring-von"/>
                  <stop offset="1" class="ring-bis"/>
                </linearGradient>
              </defs>
              <circle cx="150" cy="150" r="130" class="ring-leer"/>
              <circle cx="150" cy="150" r="130" class="ring-voll" data-e="ring"
                stroke-dasharray="${UMFANG}" stroke-dashoffset="${UMFANG}" transform="rotate(-90 150 150)"/>
            </svg>
            <div class="ring-inhalt">
              <span class="ring-label" data-e="label"></span>
              <span class="ring-zahl zahl" data-e="gross"></span>
              <span class="ring-unter" data-e="unter"></span>
            </div>
          </div>
        </div>

        <div class="danach" data-e="danach">
          <span class="danach-label">Danach</span>
          <span class="danach-name" data-e="danachName"></span>
          <span class="muted zahl" data-e="danachMenge"></span>
        </div>

        <div class="steuerung" data-e="steuerung">
          <button type="button" class="rund-btn" data-a="zurueck" aria-label="Zurück">${STEUER_ICON.zurueck}</button>
          <button type="button" class="pause-btn" data-a="pause">${STEUER_ICON.pause}${STEUER_ICON.play}<span data-e="pauseText">Pause</span></button>
          <button type="button" class="rund-btn" data-a="weiter" aria-label="Nächste Übung">${STEUER_ICON.weiter}</button>
        </div>

        <div class="ende-knoepfe" data-e="ende" hidden>
          <button type="button" class="btn-primary" data-a="nochmal">Nochmal</button>
          <button type="button" class="btn-zweit" data-a="uebersicht">Zur Übersicht</button>
        </div>

        <dialog class="card dialog" data-e="dialog" aria-labelledby="dialog-titel">
          <h2 class="heading" id="dialog-titel">Training beenden?</h2>
          <p class="muted">Dein Fortschritt in diesem Training wird nicht gespeichert.</p>
          <button type="button" class="btn-primary" data-a="weitertrainieren">Weitertrainieren</button>
          <button type="button" class="btn-zweit" data-a="wirklichBeenden">Beenden</button>
        </dialog>
      </section>`;

    root.querySelectorAll<HTMLElement | SVGElement>("[data-e]").forEach((n) => (this.el[n.dataset.e!] = n));
    this.el.screen = root.querySelector(".training")!;
    this.el.iconPause = root.querySelector("[data-icon=pause]")!;
    this.el.iconPlay = root.querySelector("[data-icon=play]")!;
    this.dialogEl = root.querySelector("dialog")!;
    // Escape bzw. Zurück-Geste bei offenem Dialog: wie „Weitertrainieren“
    this.dialogEl.addEventListener("cancel", (ev) => {
      ev.preventDefault();
      this.dialog(false);
    });

    const handler: Record<string, () => void> = {
      beenden: aktion.beenden,
      zurueck: aktion.zurueck,
      pause: aktion.pause,
      weiter: aktion.weiter,
      nochmal: aktion.nochmal,
      uebersicht: aktion.uebersicht,
      weitertrainieren: () => this.dialog(false),
      wirklichBeenden: () => {
        this.dialogEl.close();
        aktion.uebersicht();
      },
    };
    root.querySelectorAll<HTMLButtonElement>("[data-a]").forEach((b) => b.addEventListener("click", handler[b.dataset.a!]));
  }

  /** Rückfrage „Training beenden?“ zeigen oder verbergen. */
  dialog(offen: boolean): void {
    const d = this.dialogEl;
    if (offen) {
      if (d.open) return;
      this.fokusVorDialog = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      // showModal: Hintergrund ist gesperrt, Fokus bleibt im Dialog
      d.showModal();
      d.querySelector<HTMLButtonElement>("[data-a=weitertrainieren]")!.focus();
      return;
    }
    if (d.open) d.close();
    // Fokus zurück auf den auslösenden Knopf (bei der Zurück-Geste: „Beenden“)
    const ziel = this.fokusVorDialog?.isConnected && this.fokusVorDialog !== document.body ? this.fokusVorDialog : null;
    (ziel ?? d.parentElement!.querySelector<HTMLButtonElement>("[data-a=beenden]")!).focus();
    this.onDialogZu?.();
  }

  get dialogOffen(): boolean {
    return this.dialogEl.open;
  }

  /** Wird aufgerufen, wenn „Weitertrainieren“ gewählt wurde. */
  onDialogZu?: () => void;

  aktualisieren(sp: Spieler): void {
    const a = anzeige(sp);
    const fertig = a.phase === "fertig";
    this.el.screen.dataset.phase = a.phase;
    const ansage = screenreaderAnsage(sp);
    if (ansage.schluessel !== this.letzteAnsage) {
      this.letzteAnsage = ansage.schluessel;
      this.el.ansage.textContent = ansage.text;
    }
    this.el.restzeit.textContent = a.restzeit;
    this.el.balken.style.width = `${a.gesamt * 100}%`;
    this.el.titel.textContent = a.titel;
    this.el.hinweis.textContent = a.hinweis;
    this.el.hinweis.toggleAttribute("hidden", !a.hinweis);
    const chips = a.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("");
    if (this.el.chips.innerHTML !== chips) this.el.chips.innerHTML = chips;
    this.el.chips.toggleAttribute("hidden", fertig);

    this.el.label.textContent = a.label;
    this.el.gross.textContent = a.gross;
    this.el.gross.classList.toggle("wort", a.grossIstWort);
    this.el.unter.textContent = a.unter;
    this.el.ring.setAttribute("stroke-dashoffset", String(UMFANG * (1 - a.ring)));

    this.el.danach.toggleAttribute("hidden", !a.danach);
    if (a.danach) {
      this.el.danachName.textContent = a.danach.name;
      this.el.danachMenge.textContent = a.danach.menge;
      this.el.danachMenge.toggleAttribute("hidden", !a.danach.menge);
    }

    // SVG-Elemente kennen die .hidden-Eigenschaft nicht – Attribut direkt setzen
    this.el.iconPause.toggleAttribute("hidden", !sp.running);
    this.el.iconPlay.toggleAttribute("hidden", sp.running);
    this.el.pauseText.textContent = sp.running ? "Pause" : "Weiter";

    this.el.steuerung.toggleAttribute("hidden", fertig);
    this.el.ende.toggleAttribute("hidden", !fertig);
  }
}
