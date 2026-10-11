import { esc } from "./hilfen";

const DAUER_MS = 6000;
let aktuelle: { el: HTMLElement; timer: number } | null = null;

/**
 * Zeigt unten die Leiste „… gelöscht · Rückgängig“ für einige Sekunden.
 * Sie hängt am <body>, damit sie einen Bildschirmwechsel übersteht.
 */
export function zeigeRueckgaengig(text: string, onRueckgaengig: () => void): void {
  schliesseRueckgaengig();
  const el = document.createElement("div");
  el.className = "leiste";
  el.setAttribute("role", "status");
  el.innerHTML = `<span>${esc(text)}</span><button type="button">Rückgängig</button>`;
  el.querySelector("button")!.addEventListener("click", () => {
    schliesseRueckgaengig();
    onRueckgaengig();
  });
  document.body.appendChild(el);
  aktuelle = { el, timer: window.setTimeout(schliesseRueckgaengig, DAUER_MS) };
}

export function schliesseRueckgaengig(): void {
  if (!aktuelle) return;
  window.clearTimeout(aktuelle.timer);
  aktuelle.el.remove();
  aktuelle = null;
}
