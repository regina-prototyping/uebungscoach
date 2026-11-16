import { aendern, FELDER } from "../einstellungen";
import type { Einstellungen } from "../logik/typen";
import type { AnsageModus } from "../logik/spieler";
import { esc, LAUTSPRECHER } from "./hilfen";

interface EinstellungenOptionen {
  werte: Einstellungen;
  onAendern: (neu: Einstellungen) => void;
  onFertig: () => void;
  onStimmeTesten: () => void;
  stimmenStatus: () => string;
  modus: AnsageModus;
  onModus: (m: AnsageModus) => void;
  onToeneAnhoeren: (anzeigen: (text: string) => void) => void;
  /** Meldet Statusänderungen der Sprachausgabe (oder hört mit `null` auf). */
  beiAnsageStatus: (f: ((status: string) => void) | null) => void;
}

/** Einstellungsbildschirm mit Plus/Minus-Feldern und „Stimme testen“. */
export function zeigeEinstellungen(root: HTMLElement, opt: EinstellungenOptionen): void {
  let werte = opt.werte;
  root.innerHTML = `
    <section class="screen einstellungen">
      <div class="topbar">
        <h1 class="title">Einstellungen</h1>
        <button type="button" class="pill-btn" data-a="fertig">Fertig</button>
      </div>

      <div class="gruppe">
        <section class="card felder">
          ${FELDER.map(
            (f) => `
            <div class="feld">
              <div class="feld-text"><span class="feld-label">${f.label}</span><span class="caption-normal muted">${f.hilfe}</span></div>
              <button type="button" class="stepper-btn" data-k="${f.key}" data-d="-1" aria-label="${f.label} verringern">−</button>
              <output class="feld-wert zahl" data-wert="${f.key}" aria-live="polite">${werte[f.key]}</output>
              <button type="button" class="stepper-btn" data-k="${f.key}" data-d="1" aria-label="${f.label} erhöhen">+</button>
            </div>`,
          ).join("")}
        </section>

        <p class="caption-normal muted hinweis-text">Gilt für alle Übungen, außer eine Übung hat einen eigenen Wert.</p>
      </div>

      <section class="card felder">
        <div class="eingabe-feld">
          <span class="feld-label" id="modus-label">Ansagen</span>
          <div class="auswahl-chips" role="radiogroup" aria-labelledby="modus-label">
            <button type="button" class="wahl-chip" role="radio" data-modus="sprache">Sprache und Töne</button>
            <button type="button" class="wahl-chip" role="radio" data-modus="toene">Nur Töne</button>
          </div>
          <span class="caption-normal muted" data-e="modusText"></span>
        </div>
      </section>

      <div class="gruppe">
        <button type="button" class="btn-soft" data-a="toene">${LAUTSPRECHER}Töne anhören</button>
        <p class="caption-normal muted diagnose" data-e="toeneText" hidden></p>
      </div>
      <div class="gruppe">
        <button type="button" class="btn-soft" data-a="stimme">${LAUTSPRECHER}Stimme testen</button>
        <p class="caption-normal muted diagnose" data-e="diagnose">${opt.stimmenStatus()}</p>
      </div>
      <p class="caption-normal muted diagnose">App-Version: ${__VERSION__} · ${esc(location.host)}</p>
    </section>`;

  const diagnose = root.querySelector<HTMLElement>("[data-e=diagnose]")!;
  // Stimmen werden manchmal erst später geladen – dann die Zeile aktualisieren
  if ("speechSynthesis" in window) {
    speechSynthesis.addEventListener("voiceschanged", () => (diagnose.textContent = opt.stimmenStatus()), { once: true });
  }

  root.querySelector(".felder")!.addEventListener("click", (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>("button[data-k]");
    if (!b) return;
    const key = b.dataset.k as keyof Einstellungen;
    werte = aendern(werte, key, Number(b.dataset.d) as 1 | -1);
    root.querySelector(`[data-wert=${key}]`)!.textContent = String(werte[key]);
    opt.onAendern(werte);
  });
  root.querySelector("[data-a=fertig]")!.addEventListener("click", opt.onFertig);
  // Ansage-Modus
  const modusText = root.querySelector<HTMLElement>("[data-e=modusText]")!;
  const modusZeigen = (m: AnsageModus) => {
    root.querySelectorAll<HTMLElement>("[data-modus]").forEach((c) => {
      const aktiv = c.dataset.modus === m;
      c.classList.toggle("aktiv", aktiv);
      c.setAttribute("aria-checked", String(aktiv));
    });
    modusText.textContent =
      m === "sprache"
        ? "Sprachansagen und Signaltöne."
        : "Keine Sprache – nur Signaltöne und ein leiser Takt beim Mitzählen.";
  };
  modusZeigen(opt.modus);
  root.querySelectorAll<HTMLButtonElement>("[data-modus]").forEach((c) =>
    c.addEventListener("click", () => {
      const m = c.dataset.modus as AnsageModus;
      opt.onModus(m);
      modusZeigen(m);
    }),
  );

  // Alle Signale nacheinander vorspielen
  const toeneText = root.querySelector<HTMLElement>("[data-e=toeneText]")!;
  root.querySelector("[data-a=toene]")!.addEventListener("click", () => {
    toeneText.hidden = false;
    opt.onToeneAnhoeren((text) => {
      if (toeneText.isConnected) toeneText.textContent = text;
    });
  });

  root.querySelector("[data-a=stimme]")!.addEventListener("click", () => {
    // Diagnose live aktualisieren, solange die Einstellungen offen sind
    opt.beiAnsageStatus(() => {
      if (diagnose.isConnected) diagnose.textContent = opt.stimmenStatus();
      else opt.beiAnsageStatus(null);
    });
    opt.onStimmeTesten();
    diagnose.textContent = opt.stimmenStatus();
  });
}
