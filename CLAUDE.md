# Übungscoach

Eine Web-App (PWA), die per Sprachansage durch Physio-Übungen führt. Die Nutzerin ist Regina; sie lernt an diesem Projekt, wie man eine App mit Claude Code baut. Erkläre deshalb kurz und verständlich, was du tust und warum, ohne Fachjargon vorauszusetzen. Antworte auf Deutsch.

## Wichtige Dateien

- `docs/spezifikation.md` – was die App können muss (Datenmodell, Ablauf, Funktionen von Version 1 und 2, Signaltöne, Entscheidungen). **Die Quelle der Wahrheit für Funktionen.** Neue Funktionen zuerst hier eintragen.
- **GitHub Issues** im Repository – die Ideen- und Aufgabenliste, ein Issue pro Feature (mit den schon getroffenen Entscheidungen). Eine neue Sitzung beginnt typischerweise mit „Lies CLAUDE.md und Issue #…“.
- `design/` – das abgestimmte Design:
  - `tokens.json` – Farben, Schrift, Abstände, Rundungen, Schatten mit Verwendungshinweisen
  - `theme.css` – dieselben Werte als CSS-Variablen
  - `screens/` – Entwürfe als statisches HTML: 1–4 Version 1 (Start, Training, Satzpause, Einstellungen), 5–9 Version 2 (Startseite mit Bearbeiten, Menü, Programm bearbeiten, Übung auswählen/bearbeiten, Übungsbibliothek); gemeinsame Bausteine in `bausteine.css`. Wo die Spezifikation später Abweichendes beschlossen hat (z. B. kompakte Startseite mit Programm-Ansicht), gilt die Spezifikation und die App.
- `prototyp/uebungscoach-prototyp.html` – der ursprüngliche Prototyp; nur noch als Referenz.

## Aufbau des Codes

- `src/data/programme.ts` – mitgelieferte Übungen und Programme (werden beim ersten Start in den Browser-Speicher übernommen).
- `src/logik/` – reine Logik ohne Bildschirm und Ton, **mit Tests in `tests/`**: `plan.ts` (Programm → Abschnitte), `spieler.ts` (Zeitlauf, Pause/Zurück/Weiter, Ereignisse „sagen/piep/signal/still/fertig“), `anzeige.ts` (was im Training angezeigt wird), `daten.ts` (Übungen/Programme ändern, rein, für Rückgängig), `uebung-form.ts`, `format.ts`, `typen.ts`.
- `src/geraet/` – Sprachausgabe (`sprache.ts`, mit Wachhund und Ausweichversuchen), Töne (`piep.ts`, Countdown und Signaltöne), Bildschirm wach halten.
- `src/ansichten/` – die Bildschirme (Start, Menü, Programm-Ansicht, Programm bearbeiten, Übung auswählen/bearbeiten, Bibliothek, Einstellungen, Training, Rückgängig-Leiste).
- `src/navigation.ts` – jeder Bildschirm ist ein Eintrag im Browser-Verlauf, damit die Android-Zurück-Geste funktioniert; im Training fragt sie erst nach.
- `src/main.ts` – verbindet alles; `src/daten-speicher.ts`, `src/einstellungen.ts` – Speichern im Browser (`localStorage`).

## Technik-Entscheidungen

- Reine Web-App, kein Native. Läuft im Handy-Browser (Zielgerät: Google Pixel 9 mit Chrome) und ist als PWA installierbar.
- Vorschlag: Vite + TypeScript ohne UI-Framework, `vite-plugin-pwa` für Manifest und Offline-Fähigkeit, Vitest für Tests. Wenn du etwas anderes für klar besser hältst, begründe es kurz, bevor du es umsetzt.
- Programme als Daten in einer eigenen Datei (z. B. `src/data/programme.ts` oder JSON), nicht im Code verstreut.
- Hosting über Vercel, verbunden mit diesem GitHub-Repository; jeder Push auf `main` wird automatisch veröffentlicht.

## Erkenntnisse aus dem Prototyp (unbedingt beachten)

- **Sprachausgabe (Web Speech API) muss im Moment des Antippens starten.** Die erste Ansage nach „Training starten“ muss synchron im Klick-Handler kommen. Eine Verzögerung (z. B. `setTimeout`) führte dazu, dass das Handy für die ganze Sitzung stumm blieb.
- **`speechSynthesis.cancel()` nur aufrufen, wenn wirklich etwas spricht** (`speaking || pending`). Ein `cancel()` direkt vor `speak()` hat die nächste Ansage verschluckt.
- **Chrome auf Android kann die Sprachausgabe „angehalten“ hängen lassen** (z. B. nach Hintergrund oder automatischem Neuladen beim Update): `speak()` reiht dann nur ein, nichts ist zu hören, auch nicht bei „Stimme testen“. Deshalb vor jeder Ansage `speechSynthesis.resume()` und ein Wachhund, der bei Stillstand `cancel()`/`resume()` macht und neu spricht (`src/geraet/sprache.ts`).
- **Android meldet manchmal `synthesis-failed` für die ausdrücklich gewählte Stimme** (Pixel 9, „Deutsch Deutschland“), obwohl Stimmen gefunden werden und Pieptöne gehen. Der Fehler kommt teils erst *nach* `onstart`. Dann ohne feste Stimme (nur `lang = "de-DE"`) und zuletzt mit der Standardstimme neu versuchen. Die Diagnosezeile unter „Stimme testen“ zeigt Zustand, verwendete Einstellung und letzten Fehler, darunter die App-Version (Build-Zeit in UTC, Commit und Adresse, z. B. `uebungscoach.vercel.app`).
- **In der Claude-App (eingebettete Ansicht) gibt es keine Sprachausgabe**, im normalen Browser schon. Immer im echten Browser auf dem Handy testen.
- **Pieptöne über die Web Audio API funktionieren zuverlässig**; den `AudioContext` beim ersten Antippen erzeugen bzw. fortsetzen.
- **SVG-Elemente kennen die `.hidden`-Eigenschaft nicht** – Attribut per `toggleAttribute("hidden", …)` setzen. (Daran lag der Fehler, dass Pause und Weiter dasselbe Symbol zeigten.)
- **Bildschirm wach halten** mit `navigator.wakeLock.request("screen")`; nach `visibilitychange` erneut anfordern. Geht der Bildschirm aus, stoppen Timer und Ansagen.
- Timer über `performance.now()`-Differenzen statt gezählter Intervalle, damit nichts driftet.
- Deutsche Stimme bevorzugen (`lang` beginnt mit `de`), `voiceschanged` abwarten. In den Einstellungen gibt es „Stimme testen“ und eine Diagnosezeile (Anzahl Stimmen, gewählte Stimme).

## Design-Regeln (Kurzfassung, Details in `design/tokens.json`)

- Leicht getönter Seitenhintergrund (`ground` #F6F4F6), weiße Karten (`surface`) mit dezentem Schatten, Rundung `radius-lg` 20 px, runde Knöpfe und Chips. Gemeinsamer Kartenaufbau auf der Startseite: Text links, runde 48-px-Aktion rechts.
- `primary` (#921A5B) = aktive Phase (Wiederholung, Halten) und **die** Aktionsfarbe (Start, Pause, Hauptbutton). `rest` (#A65A0A) **nur** für Vorbereitung, Satzpause, Absenken – nirgends sonst.
- Schrift- und Abstandsstufen nur über Tokens (`--text-xs…xl` in rem, `--weight-*`, `--space-1…10` im 4er-Raster), keine negativen Margins. 800 nur für die Ring-Zahl; Überschriften 700, Titel/Buttons 600, Metatext 15/22 px 400.
- Barrierefreiheit: Rückfragen als natives `<dialog>` mit `showModal()`, Ausgeblendetes per `hidden`, kein `aria-live` am Sekundenzähler (Ansagen über `.sr-only`-Element), sichtbarer `:focus-visible`-Ring, `prefers-reduced-motion` global.
- Die große Zahl im Fortschrittsring ist das Wichtigste im Training; aus 1–2 m lesbar. Ziffern mit `tabular-nums`.
- Schrift: Figtree (Google Fonts).
- Touch-Ziele mindestens 44 px, Steuerknöpfe 64 px, Pause-Button 72 px hoch.

## Arbeitsweise

- **Eine Sitzung pro Feature.** Zu Beginn `CLAUDE.md`, die Spezifikation und das zugehörige GitHub-Issue lesen.
- Vor größeren Schritten einen kurzen Plan zeigen und auf Reginas OK warten. Bei sichtbaren Änderungen zuerst Entwürfe (Screenshots) zeigen.
- Kleine, nachvollziehbare Commits mit deutschen Commit-Nachrichten. Neue Funktionen und Entscheidungen in `docs/spezifikation.md` festhalten.
- Logik mit Tests absichern (`npm test`), vor jedem Push `npx tsc --noEmit`, `npm test` und `npm run build`.
- Nach jeder sichtbaren Änderung sagen, wie Regina sie auf dem Handy ausprobieren kann.

## Ablauf bis aufs Handy

1. Arbeit auf dem Feature-Branch der Sitzung, Push → Vercel baut eine **Vorschau** (Link in den Vercel-Deployments bzw. als Kommentar im Pull Request). Vorschauen brauchen den Vercel-Login und haben **eigenen Speicher** (Reginas Übungen fehlen dort).
2. Pull Request nach `main`; Regina übernimmt ihn selbst („Merge pull request“). Ist ein früherer PR des Branches schon gemerged, den Branch neu von `main` beginnen.
3. Vercel veröffentlicht `main` unter **`uebungscoach.vercel.app`** – dort ist Reginas App installiert, dort liegen ihre Daten. Die App aktualisiert sich beim nächsten Öffnen mit Internet; sonst App ganz schließen und neu öffnen.
4. **Kontrolle:** In den Einstellungen ganz unten steht „App-Version: Build-Zeit (UTC) · Commit · Adresse“. Stimmt der Commit nicht, ist das Update nicht angekommen.
5. Ob Vercel erfolgreich war, zeigt der Commit-Status auf GitHub (`/commits/<sha>/status`). Einmal scheiterte die Veröffentlichung von `main` ohne Build-Link, vermutlich am Tageslimit des kostenlosen Tarifs – deshalb nicht unnötig oft pushen. Es gab zwei Vercel-Projekte (`uebungscoach` und `uebungscoach-9hpx`); nur `uebungscoach` wird gebraucht.

## Testen ohne Handy

- Die Arbeitsumgebung hat Chromium mit Playwright, aber **keine Sprachausgabe** und keinen Zugriff auf `*.vercel.app`. Zum Testen `npx vite preview` lokal starten.
- Uhr vorspulen mit `page.clock`, eigene Daten per `localStorage` vorbelegen, Screenshots im Handyformat (412 × 915) zum Vergleich mit den Entwürfen.
- Sprachausgabe mit einer **Attrappe** von `speechSynthesis` nachbilden (Zustände: normal, angehalten, hängt, `synthesis-failed` vor/nach Start); Töne prüfen, indem man die gespielten Frequenzen von `OscillatorNode.start` mitschreibt.
- Was nur das echte Handy zeigen kann (Klang, Stimme, Wake Lock), ehrlich als ungeprüft benennen und Regina um einen Test mit Screenshot bitten.
