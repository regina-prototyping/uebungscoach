import { beschreibung, sicherungLesen, type Sicherung } from "../logik/sicherung";
import { esc, SICHERUNG_ICON } from "./hilfen";

interface SicherungOptionen {
  /** Erstellt die Datei und gibt sie weiter; liefert den Text für die Rückmeldung. */
  onSpeichern: () => Promise<string>;
  /** Ersetzt alle Daten durch die Sicherung. */
  onLaden: (s: Sicherung) => void;
  onFertig: () => void;
}

/** Bildschirm „Sicherung“: speichern (teilen/herunterladen) und laden. */
export function zeigeSicherung(root: HTMLElement, opt: SicherungOptionen): void {
  root.innerHTML = `
    <section class="screen sicherung">
      <div class="topbar">
        <h1 class="title">Sicherung</h1>
        <button type="button" class="pill-btn" data-a="fertig">Fertig</button>
      </div>

      <p class="muted hinweis-text">Deine Übungen, Programme und Einstellungen sind nur auf diesem Gerät gespeichert. Speichere ab und zu eine Sicherung, am besten in Google Drive.</p>

      <section class="card sicherung-karte">
        <h2 class="feld-label">Sicherung speichern</h2>
        <p class="caption-normal muted">Auf dem Handy öffnet sich das Teilen-Menü: Wähle z. B. „In Drive speichern“. Sonst wird die Datei heruntergeladen.</p>
        <button type="button" class="btn-primary" data-a="speichern">${SICHERUNG_ICON.speichern}Sicherung speichern</button>
      </section>

      <section class="card sicherung-karte">
        <h2 class="feld-label">Sicherung laden</h2>
        <p class="caption-normal muted">Ersetzt alle Übungen, Programme und Einstellungen auf diesem Gerät durch die aus der Datei.</p>
        <button type="button" class="btn-soft" data-a="laden">${SICHERUNG_ICON.laden}Sicherung laden</button>
        <input type="file" data-e="datei" hidden />
      </section>

      <p class="caption-normal meldung" data-e="meldung" role="status" hidden></p>

      <dialog class="card dialog" data-e="dialog" aria-labelledby="dialog-titel">
        <h2 class="heading" id="dialog-titel">Sicherung laden?</h2>
        <p class="zahl" data-e="dialogText"></p>
        <p class="muted">Deine aktuellen Übungen, Programme und Einstellungen werden ersetzt.</p>
        <button type="button" class="btn-primary" data-a="ersetzen">Laden und ersetzen</button>
        <button type="button" class="btn-zweit" data-a="abbrechen">Abbrechen</button>
      </dialog>
    </section>`;

  const el = (name: string) => root.querySelector<HTMLElement>(`[data-e=${name}]`)!;
  const meldung = el("meldung");
  const datei = el("datei") as HTMLInputElement;
  const dialog = el("dialog") as HTMLDialogElement;
  const ladenBtn = root.querySelector<HTMLButtonElement>("[data-a=laden]")!;
  let gelesen: Sicherung | null = null;

  const melden = (text: string, fehler = false) => {
    meldung.hidden = false;
    meldung.textContent = text;
    meldung.classList.toggle("fehler", fehler);
  };
  const dialogZeigen = (offen: boolean) => {
    if (offen) {
      dialog.showModal();
      // Fokus auf die sichere Wahl, weil „Laden und ersetzen“ Daten überschreibt
      dialog.querySelector<HTMLButtonElement>("[data-a=abbrechen]")!.focus();
    } else {
      dialog.close();
      ladenBtn.focus();
    }
  };
  // Escape bzw. Zurück-Geste: wie „Abbrechen“
  dialog.addEventListener("cancel", (ev) => {
    ev.preventDefault();
    gelesen = null;
    dialogZeigen(false);
  });

  root.querySelector("[data-a=fertig]")!.addEventListener("click", opt.onFertig);

  root.querySelector("[data-a=speichern]")!.addEventListener("click", () => {
    meldung.hidden = true;
    // Teilen muss direkt im Antippen starten – also nichts davor abwarten
    opt.onSpeichern().then((text) => text && melden(text));
  });

  ladenBtn.addEventListener("click", () => {
    meldung.hidden = true;
    datei.value = "";
    datei.click();
  });

  datei.addEventListener("change", async () => {
    const f = datei.files?.[0];
    if (!f) return;
    let text: string;
    try {
      text = await f.text();
    } catch {
      return melden("Die Datei konnte nicht gelesen werden.", true);
    }
    const r = sicherungLesen(text);
    if (!r.ok) return melden(r.fehler, true);
    gelesen = r.sicherung;
    el("dialogText").innerHTML = esc(`Sicherung ${beschreibung(gelesen)}`);
    dialogZeigen(true);
  });

  root.querySelector("[data-a=abbrechen]")!.addEventListener("click", () => {
    gelesen = null;
    dialogZeigen(false);
  });
  root.querySelector("[data-a=ersetzen]")!.addEventListener("click", () => {
    dialogZeigen(false);
    if (gelesen) opt.onLaden(gelesen);
    gelesen = null;
    melden("Sicherung geladen.");
  });
}
