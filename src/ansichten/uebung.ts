import { FELDER } from "../einstellungen";
import { findeUebung, verwendetIn } from "../logik/daten";
import type { Daten, Einstellungen, Uebung } from "../logik/typen";
import {
  begrenzen,
  eigeneZeitenText,
  GRENZEN,
  relevanteZeiten,
  ZEIT_LABEL,
  type EigeneZeit,
} from "../logik/uebung-form";
import { esc, FORM_ICON } from "./hilfen";

type Aenderung = Partial<Omit<Uebung, "id">>;

interface UebungOptionen {
  daten: () => Daten;
  einstellungen: Einstellungen;
  uebungId: string;
  neu: boolean;
  onAendern: (aenderung: Aenderung) => void;
  onDuplizieren: () => void;
  onLoeschen: () => void;
  onFertig: () => void;
}

const ZEIT_HILFE: Record<EigeneZeit, string> = {
  tempo: "Sekunden pro Wiederholung",
  lower: "Sekunden zwischen Haltephasen",
  setPause: "Sekunden zwischen zwei Sätzen",
};

function stepper(key: string, label: string, hilfe: string): string {
  return `
    <div class="feld" data-feld="${key}">
      <div class="feld-text"><span class="feld-label">${label}</span><span class="caption-normal muted" data-hilfe="${key}">${hilfe}</span></div>
      <button type="button" class="stepper-btn" data-k="${key}" data-d="-1" aria-label="${label} verringern">−</button>
      <output class="feld-wert zahl" data-wert="${key}" aria-live="polite"></output>
      <button type="button" class="stepper-btn" data-k="${key}" data-d="1" aria-label="${label} erhöhen">+</button>
    </div>`;
}

/** Bildschirm „Übung bearbeiten“. Änderungen werden sofort gespeichert. */
export class UebungAnsicht {
  private root: HTMLElement;
  private offen = false;

  constructor(
    root: HTMLElement,
    private opt: UebungOptionen,
  ) {
    this.root = root;
    const u = this.uebung;
    root.innerHTML = `
      <section class="screen bearbeiten">
        <div class="topbar">
          <h1 class="title">${opt.neu ? "Neue Übung" : "Übung"}</h1>
          <button type="button" class="pill-btn" data-a="fertig">Fertig</button>
        </div>

        <section class="card felder">
          <label class="eingabe-feld">
            <span class="feld-label">Name</span>
            <input class="eingabe" data-e="name" value="${esc(u.name)}" placeholder="z. B. Seitstütz" autocomplete="off" enterkeyhint="next">
          </label>
          <label class="eingabe-feld">
            <span class="feld-label">Hinweis <span class="optional">· optional</span></span>
            <input class="eingabe" data-e="hint" value="${esc(u.hint ?? "")}" placeholder="wird vor der Übung angesagt" autocomplete="off" enterkeyhint="done">
          </label>
        </section>

        <section class="card felder">
          <div class="eingabe-feld">
            <span class="feld-label" id="art-label">Art</span>
            <div class="auswahl-chips" role="radiogroup" aria-labelledby="art-label">
              <button type="button" class="wahl-chip" role="radio" data-art="reps">Wiederholungen</button>
              <button type="button" class="wahl-chip" role="radio" data-art="hold">Halten</button>
            </div>
          </div>
          <div class="feld">
            <div class="feld-text"><span class="feld-label" id="seite-label">Pro Seite</span><span class="caption-normal muted">Erst links, dann rechts</span></div>
            <button type="button" class="schalter" role="switch" data-e="seite" aria-labelledby="seite-label"></button>
          </div>
          ${stepper("reps", "Wiederholungen", "pro Satz")}
          ${stepper("hold", "Haltedauer", "Sekunden")}
          ${stepper("sets", "Sätze", "")}
        </section>

        <section class="card felder">
          <button type="button" class="feld zeit-kopf" data-a="zeiten" aria-expanded="false" aria-controls="eigene-zeiten">
            <span class="feld-text"><span class="feld-label">Eigene Zeiten</span><span class="caption-normal muted" data-e="zeitenText"></span></span>
            <span class="zeit-pfeil" data-e="pfeil"></span>
          </button>
          <div id="eigene-zeiten" data-e="zeiten" hidden>
            ${(["tempo", "lower", "setPause"] as EigeneZeit[])
              .map(
                (k) => `
              <div class="feld" data-feld="${k}">
                <div class="feld-text">
                  <span class="feld-label">${ZEIT_LABEL[k]}</span>
                  <span class="caption-normal muted">${ZEIT_HILFE[k]}</span>
                  <button type="button" class="zuruecksetzen" data-reset="${k}">Zurücksetzen</button>
                </div>
                <button type="button" class="stepper-btn" data-k="${k}" data-d="-1" aria-label="${ZEIT_LABEL[k]} verringern">−</button>
                <output class="feld-wert zahl" data-wert="${k}" aria-live="polite"></output>
                <button type="button" class="stepper-btn" data-k="${k}" data-d="1" aria-label="${ZEIT_LABEL[k]} erhöhen">+</button>
              </div>`,
              )
              .join("")}
          </div>
        </section>

        <p class="caption-normal muted verwendung" data-e="verwendung"></p>
        <button type="button" class="btn-soft" data-a="duplizieren">${FORM_ICON.kopie}Duplizieren</button>
        <button type="button" class="text-btn loeschen-btn" data-a="loeschen" hidden>Übung löschen</button>
      </section>`;

    const name = root.querySelector<HTMLInputElement>("[data-e=name]")!;
    const hint = root.querySelector<HTMLInputElement>("[data-e=hint]")!;
    name.addEventListener("input", () => opt.onAendern({ name: name.value }));
    hint.addEventListener("input", () => opt.onAendern({ hint: hint.value.trim() ? hint.value : undefined }));
    name.addEventListener("keydown", (ev) => ev.key === "Enter" && hint.focus());
    hint.addEventListener("keydown", (ev) => ev.key === "Enter" && hint.blur());

    root.querySelector("[data-a=fertig]")!.addEventListener("click", opt.onFertig);
    root.querySelector("[data-a=duplizieren]")!.addEventListener("click", opt.onDuplizieren);
    root.querySelector("[data-a=loeschen]")!.addEventListener("click", opt.onLoeschen);
    root.querySelector("[data-a=zeiten]")!.addEventListener("click", () => {
      this.offen = !this.offen;
      this.aktualisieren();
    });
    root.querySelector(".screen")!.addEventListener("click", (ev) => this.klick(ev));

    this.aktualisieren();
    if (opt.neu) name.focus();
  }

  private get uebung(): Uebung {
    return findeUebung(this.opt.daten(), this.opt.uebungId)!;
  }

  private aendern(a: Aenderung): void {
    this.opt.onAendern(a);
    this.aktualisieren();
  }

  private klick(ev: Event): void {
    const t = ev.target as HTMLElement;
    const u = this.uebung;
    const art = t.closest<HTMLElement>("[data-art]");
    if (art) {
      const neu = art.dataset.art as Uebung["art"];
      // Beim Wechsel zu „Halten“ eine sinnvolle Haltedauer vorbelegen
      this.aendern(neu === "hold" && !u.hold ? { art: neu, hold: 5 } : { art: neu });
      return;
    }
    if (t.closest("[data-e=seite]")) return this.aendern({ proSeite: !u.proSeite });
    const reset = t.closest<HTMLElement>("[data-reset]");
    if (reset) return this.aendern({ [reset.dataset.reset!]: undefined });

    const b = t.closest<HTMLButtonElement>("button[data-k]");
    if (!b) return;
    const key = b.dataset.k!;
    const d = Number(b.dataset.d);
    if (key === "reps" || key === "hold" || key === "sets") {
      const g = GRENZEN[key];
      this.aendern({ [key]: begrenzen((u[key] ?? g.min) + d * g.schritt, g) });
    } else {
      const k = key as EigeneZeit;
      const f = FELDER.find((x) => x.key === k)!;
      const basis = u[k] ?? this.opt.einstellungen[k];
      this.aendern({ [k]: begrenzen(basis + d * f.schritt, f) });
    }
  }

  /** Bringt Sichtbarkeit und Werte auf den Stand der Übung. */
  aktualisieren(): void {
    const u = this.uebung;
    const $ = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;

    this.root.querySelectorAll<HTMLElement>("[data-art]").forEach((c) => {
      const aktiv = c.dataset.art === u.art;
      c.classList.toggle("aktiv", aktiv);
      c.setAttribute("aria-checked", String(aktiv));
    });
    $("[data-e=seite]").setAttribute("aria-checked", String(u.proSeite));

    $("[data-hilfe=reps]").textContent = u.proSeite ? "je Seite und Satz" : "pro Satz";
    $("[data-feld=hold]").toggleAttribute("hidden", u.art !== "hold");
    for (const k of ["reps", "hold", "sets"] as const) {
      $(`[data-wert=${k}]`).textContent = String(u[k] ?? "");
      const g = GRENZEN[k];
      $(`[data-k=${k}][data-d="-1"]`).toggleAttribute("disabled", (u[k] ?? g.min) <= g.min);
      $(`[data-k=${k}][data-d="1"]`).toggleAttribute("disabled", (u[k] ?? g.max) >= g.max);
    }

    const relevant = relevanteZeiten(u);
    for (const k of ["tempo", "lower", "setPause"] as EigeneZeit[]) {
      $(`[data-feld=${k}]`).toggleAttribute("hidden", !relevant.includes(k));
      const eigen = u[k] !== undefined;
      const wert = $(`[data-wert=${k}]`);
      wert.classList.toggle("standard", !eigen);
      wert.innerHTML = eigen ? String(u[k]) : `Standard<br>${this.opt.einstellungen[k]} s`;
      $(`[data-reset=${k}]`).toggleAttribute("hidden", !eigen);
    }
    $("[data-e=zeitenText]").textContent = eigeneZeitenText(u);
    $("[data-e=zeiten]").toggleAttribute("hidden", !this.offen);
    $("[data-a=zeiten]").setAttribute("aria-expanded", String(this.offen));
    $("[data-e=pfeil]").innerHTML = this.offen ? FORM_ICON.zu : FORM_ICON.auf;

    const programme = verwendetIn(this.opt.daten(), u.id).map((p) => p.name || "Neues Programm");
    const einmalig = [...new Set(programme)];
    $("[data-e=verwendung]").textContent = einmalig.length ? `Wird verwendet in: ${einmalig.join(", ")}` : "In keinem Programm";
    // Löschen nur, wenn die Übung in keinem Programm vorkommt
    $("[data-a=loeschen]").toggleAttribute("hidden", einmalig.length > 0);
  }
}
