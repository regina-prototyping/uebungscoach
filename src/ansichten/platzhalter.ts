import { esc } from "./hilfen";

/** Vorläufiger Bildschirm für Teile, die noch gebaut werden. */
export function zeigePlatzhalter(root: HTMLElement, titel: string, text: string, onFertig: () => void): void {
  root.innerHTML = `
    <section class="screen">
      <div class="topbar">
        <h1 class="title">${esc(titel)}</h1>
        <button type="button" class="pill-btn" data-aktion="fertig">Fertig</button>
      </div>
      <p class="muted">${esc(text)}</p>
    </section>`;
  root.querySelector("[data-aktion=fertig]")!.addEventListener("click", onFertig);
}
