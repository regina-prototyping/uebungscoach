import { aendern, FELDER } from "../einstellungen";
import type { Einstellungen } from "../logik/typen";
import { LAUTSPRECHER } from "./hilfen";

interface EinstellungenOptionen {
  werte: Einstellungen;
  onAendern: (neu: Einstellungen) => void;
  onFertig: () => void;
  onStimmeTesten: () => void;
  stimmenStatus: () => string;
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

      <button type="button" class="btn-soft" data-a="stimme">${LAUTSPRECHER}Stimme testen</button>
      <p class="caption-normal muted diagnose" data-e="diagnose">${opt.stimmenStatus()}</p>
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
  root.querySelector("[data-a=stimme]")!.addEventListener("click", () => {
    opt.onStimmeTesten();
    diagnose.textContent = opt.stimmenStatus();
  });
}
