import { dose } from "../logik/format";
import { programmInfo } from "../logik/plan";
import type { Einstellungen, Trainingsplan } from "../logik/typen";
import { ersterMonat, kalender, kalenderZusammenfassung, schnittText, trainingsProWoche, zuletztText, type Verlauf } from "../logik/verlauf";
import { esc, ICON, MENU_ICON } from "./hilfen";
import { wochenDiagramm } from "./wochen-diagramm";

interface ProgrammAnsichtOptionen {
  plan: Trainingsplan;
  einstellungen: Einstellungen;
  verlauf: Verlauf;
  angeheftet: boolean;
  onAnheften: () => void;
  onStart: (plan: Trainingsplan) => void;
  onBearbeiten: () => void;
  onZurueck: () => void;
}

const ZURUECK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`;
const PFEIL = {
  links: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`,
  rechts: MENU_ICON.rechts,
};
/** Stecknadel; gefüllt = angeheftet. */
function nadel(an: boolean): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="${an ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6l-1 6 3 3H7l3-3z"/><path d="M12 13v7"/></svg>`;
}
const WOCHENTAGE = ["M", "D", "M", "D", "F", "S", "S"];

/** Programm ansehen: Übungen mit Menge, „Bearbeiten“, „Training starten“ und der Kalender der Trainings. */
export function zeigeProgrammAnsicht(root: HTMLElement, opt: ProgrammAnsichtOptionen): void {
  const p = opt.plan;
  const letzte = p.exercises.length - 1;
  const zeilen = p.exercises
    .map(
      (e, i) => `
        <li class="zs-zeile">
          <span class="zs-spur" aria-hidden="true">
            <span class="zs-nr zahl">${i + 1}</span>
            ${i < letzte ? `<span class="zs-linie"></span>` : ""}
          </span>
          <span class="zeile-text zs-text">
            <span class="zeile-name">${esc(e.name)}</span>
            <span class="caption-normal muted zahl">${dose(e)}${e.hint ? ` · ${esc(e.hint)}` : ""}</span>
          </span>
        </li>`,
    )
    .join("");
  const info = [programmInfo(p, opt.einstellungen), p.start ? `Start: ${esc(p.start)}` : ""].filter(Boolean).join(" · ");
  const anheftenText = opt.angeheftet ? "Von der Startseite lösen" : "Oben auf der Startseite anheften";
  root.innerHTML = `
    <section class="screen programm-ansicht">
      <header class="ansicht-kopf">
        <div class="topbar">
          <button type="button" class="text-btn zurueck-btn" data-a="zurueck">${ZURUECK_ICON}Übersicht</button>
          <div class="kopf-rechts">
            <button type="button" class="kopf-icon" data-a="anheften" aria-pressed="${opt.angeheftet}" aria-label="${anheftenText}" title="${anheftenText}">${nadel(opt.angeheftet)}</button>
            <button type="button" class="link-btn" data-a="bearbeiten">${MENU_ICON.stift}Bearbeiten</button>
          </div>
        </div>
        <div class="ansicht-titel">
          <h1 class="ansicht-name">${esc(p.name)}</h1>
          <span class="ansicht-info">${info}</span>
        </div>
        <button type="button" class="hero-start" data-a="start">${ICON.play}Training starten</button>
      </header>
      <ol class="zeitstrahl">${zeilen}</ol>
      <section class="kalender" aria-label="Trainings im Kalender"></section>
      ${wochenAbschnitt(opt.verlauf, p.id)}
    </section>`;
  root.querySelector("[data-a=zurueck]")!.addEventListener("click", opt.onZurueck);
  root.querySelector("[data-a=bearbeiten]")!.addEventListener("click", opt.onBearbeiten);
  root.querySelector("[data-a=anheften]")!.addEventListener("click", opt.onAnheften);
  // läuft synchron im Klick – wichtig für die erste Ansage
  root.querySelector("[data-a=start]")!.addEventListener("click", () => opt.onStart(p));

  // Kalender: beginnt beim aktuellen Monat; blättern bis zum ersten Training
  const heute = new Date();
  const frueheste = ersterMonat(opt.verlauf, p.id, heute);
  const zuletzt = zuletztText(opt.verlauf, p.id, heute);
  let jahr = heute.getFullYear();
  let monat = heute.getMonth();
  const kal = root.querySelector<HTMLElement>(".kalender")!;
  const zeichne = (fokus?: "vor" | "zurueck") => {
    const k = kalender(opt.verlauf, p.id, jahr, monat, heute);
    const amAnfang = jahr * 12 + monat <= frueheste.jahr * 12 + frueheste.monat;
    const amEnde = jahr === heute.getFullYear() && monat === heute.getMonth();
    const felder = k.tage
      .map((t) => {
        const kl = ["kal-tag", t.anzahl ? "an" : "", t.heute ? "heute" : "", t.zukunft ? "zukunft" : ""].filter(Boolean).join(" ");
        const zwei = t.anzahl > 1 ? `<span class="kal-mehr" aria-hidden="true">${t.anzahl}</span>` : "";
        return `<span class="${kl}" role="listitem" aria-label="${t.label}"${t.heute ? ` aria-current="date"` : ""}><span aria-hidden="true">${t.tag}</span>${zwei}</span>`;
      })
      .join("");
    kal.innerHTML = `
      <div class="kal-kopf">
        <h2 class="kal-titel" aria-live="polite">${k.titel}</h2>
        <div class="kal-knoepfe">
          <button type="button" class="icon-btn" data-kal="zurueck" aria-label="Voriger Monat" ${amAnfang ? "disabled" : ""}>${PFEIL.links}</button>
          <button type="button" class="icon-btn" data-kal="vor" aria-label="Nächster Monat" ${amEnde ? "disabled" : ""}>${PFEIL.rechts}</button>
        </div>
      </div>
      <div class="kal-raster" aria-hidden="true">${WOCHENTAGE.map((w) => `<span class="kal-wt">${w}</span>`).join("")}</div>
      <div class="kal-raster" role="list">${'<span class="kal-leer" aria-hidden="true"></span>'.repeat(k.versatz)}${felder}</div>
      <p class="kal-summe zahl">${kalenderZusammenfassung(k, zuletzt)}</p>`;
    kal.querySelector("[data-kal=zurueck]")!.addEventListener("click", () => {
      if (--monat < 0) [monat, jahr] = [11, jahr - 1];
      zeichne("zurueck");
    });
    kal.querySelector("[data-kal=vor]")!.addEventListener("click", () => {
      if (++monat > 11) [monat, jahr] = [0, jahr + 1];
      zeichne("vor");
    });
    // Fokus bleibt beim Blättern auf dem Knopf (oder dem anderen, wenn dieser jetzt gesperrt ist)
    if (fokus) {
      const ziel = kal.querySelector<HTMLButtonElement>(`[data-kal=${fokus}]:not([disabled])`) ?? kal.querySelector<HTMLButtonElement>("[data-kal]:not([disabled])");
      ziel?.focus();
    }
  };
  zeichne();
}

/** „Trainings pro Woche“ unter dem Kalender – nur, wenn das Programm schon einmal trainiert wurde. */
function wochenAbschnitt(v: Verlauf, programmId: string): string {
  if (!v.trainings.some((t) => t.programmId === programmId)) return "";
  const r = trainingsProWoche(v, new Date(), [programmId]);
  const text = [`${r.gesamt === 1 ? "1 Training" : `${r.gesamt} Trainings`} in 12 Wochen`, schnittText(r)].filter(Boolean).join(" · ");
  return `
    <section class="wochen" aria-labelledby="wochen-titel">
      <h2 class="kal-titel" id="wochen-titel">Trainings pro Woche</h2>
      ${wochenDiagramm(r)}
      <p class="kal-summe zahl">${text}</p>
    </section>`;
}
