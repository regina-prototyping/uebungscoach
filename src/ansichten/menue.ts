import { esc, ICON, MENU_ICON, SICHERUNG_ICON } from "./hilfen";

interface MenueOptionen {
  onUebungen: () => void;
  onEinstellungen: () => void;
  onSicherung: () => void;
  onSchliessen: () => void;
}

/** Menü-Panel über der aktuellen Seite (fast bildschirmfüllend, links ein Streifen frei). */
export function zeigeMenue(root: HTMLElement, opt: MenueOptionen): void {
  const eintrag = (aktion: string, icon: string, titel: string, text: string) => `
    <button type="button" class="menue-eintrag" data-aktion="${aktion}">
      <span class="symbolfeld">${icon}</span>
      <span class="leer-text"><span class="leer-titel">${esc(titel)}</span><span class="caption-normal muted">${esc(text)}</span></span>
      ${MENU_ICON.rechts}
    </button>`;
  const overlay = document.createElement("div");
  overlay.className = "menue-overlay";
  overlay.innerHTML = `
    <div class="menue-streifen" data-aktion="schliessen"></div>
    <nav class="menue-panel" aria-label="Menü">
      <div class="topbar">
        <span class="title">Menü</span>
        <button type="button" class="icon-btn" data-aktion="schliessen" aria-label="Menü schließen">${MENU_ICON.schliessen}</button>
      </div>
      <div class="menue-liste">
        ${eintrag("uebungen", MENU_ICON.liste, "Übungen", "Alle Übungen anlegen und bearbeiten")}
        ${eintrag("einstellungen", ICON.regler, "Einstellungen", "Tempo, Pausen, Stimme")}
        ${eintrag("sicherung", SICHERUNG_ICON.menue, "Sicherung", "Daten speichern und laden")}
      </div>
    </nav>`;
  root.appendChild(overlay);
  overlay.querySelectorAll("[data-aktion=schliessen]").forEach((n) => n.addEventListener("click", opt.onSchliessen));
  overlay.querySelector("[data-aktion=uebungen]")!.addEventListener("click", opt.onUebungen);
  overlay.querySelector("[data-aktion=einstellungen]")!.addEventListener("click", opt.onEinstellungen);
  overlay.querySelector("[data-aktion=sicherung]")!.addEventListener("click", opt.onSicherung);
  overlay.querySelector<HTMLButtonElement>(".menue-panel .icon-btn")!.focus();
}
