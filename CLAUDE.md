# Übungscoach

Eine Web-App (PWA), die per Sprachansage durch Physio-Übungen führt. Die Nutzerin ist Regina; sie lernt an diesem Projekt, wie man eine App mit Claude Code baut. Erkläre deshalb kurz und verständlich, was du tust und warum, ohne Fachjargon vorauszusetzen. Antworte auf Deutsch.

## Wichtige Dateien

- `docs/spezifikation.md` – was die App können muss (Datenmodell, Ablauf, Muss-Funktionen, Programme). **Die Quelle der Wahrheit für Funktionen.**
- `design/` – das abgestimmte Design:
  - `tokens.json` – Farben, Schrift, Abstände, Rundungen, Schatten mit Verwendungshinweisen
  - `theme.css` – dieselben Werte als CSS-Variablen
  - `screens/` – die vier Bildschirme als statisches HTML (im Browser öffnen): Start, Training, Satzpause, Einstellungen
- `prototyp/uebungscoach-prototyp.html` – funktionierender Prototyp in einer Datei. Die Ablauflogik (`buildPlan`, Spieler mit `tick`, Zurück/Weiter) ist erprobt und soll übernommen, aber sauber aufgeteilt werden. Das Aussehen des Prototyps ist überholt; es gilt `design/`.

## Technik-Entscheidungen

- Reine Web-App, kein Native. Läuft im Handy-Browser (Zielgerät: Google Pixel 9 mit Chrome) und ist als PWA installierbar.
- Vorschlag: Vite + TypeScript ohne UI-Framework, `vite-plugin-pwa` für Manifest und Offline-Fähigkeit, Vitest für Tests. Wenn du etwas anderes für klar besser hältst, begründe es kurz, bevor du es umsetzt.
- Programme als Daten in einer eigenen Datei (z. B. `src/data/programme.ts` oder JSON), nicht im Code verstreut.
- Hosting über Vercel, verbunden mit diesem GitHub-Repository; jeder Push auf `main` wird automatisch veröffentlicht.

## Erkenntnisse aus dem Prototyp (unbedingt beachten)

- **Sprachausgabe (Web Speech API) muss im Moment des Antippens starten.** Die erste Ansage nach „Training starten“ muss synchron im Klick-Handler kommen. Eine Verzögerung (z. B. `setTimeout`) führte dazu, dass das Handy für die ganze Sitzung stumm blieb.
- **`speechSynthesis.cancel()` nur aufrufen, wenn wirklich etwas spricht** (`speaking || pending`). Ein `cancel()` direkt vor `speak()` hat die nächste Ansage verschluckt.
- **Chrome auf Android kann die Sprachausgabe „angehalten“ hängen lassen** (z. B. nach Hintergrund oder automatischem Neuladen beim Update): `speak()` reiht dann nur ein, nichts ist zu hören, auch nicht bei „Stimme testen“. Deshalb vor jeder Ansage `speechSynthesis.resume()` und ein Wachhund, der bei Stillstand `cancel()`/`resume()` macht und neu spricht (`src/geraet/sprache.ts`).
- **Android meldet manchmal `synthesis-failed` für die ausdrücklich gewählte Stimme** (Pixel 9, „Deutsch Deutschland“), obwohl Stimmen gefunden werden und Pieptöne gehen. Dann ohne feste Stimme (nur `lang = "de-DE"`) und zuletzt mit der Standardstimme neu versuchen. Die Diagnosezeile unter „Stimme testen“ zeigt Zustand, verwendete Einstellung und letzten Fehler.
- **In der Claude-App (eingebettete Ansicht) gibt es keine Sprachausgabe**, im normalen Browser schon. Immer im echten Browser auf dem Handy testen.
- **Pieptöne über die Web Audio API funktionieren zuverlässig**; den `AudioContext` beim ersten Antippen erzeugen bzw. fortsetzen.
- **SVG-Elemente kennen die `.hidden`-Eigenschaft nicht** – Attribut per `toggleAttribute("hidden", …)` setzen. (Daran lag der Fehler, dass Pause und Weiter dasselbe Symbol zeigten.)
- **Bildschirm wach halten** mit `navigator.wakeLock.request("screen")`; nach `visibilitychange` erneut anfordern. Geht der Bildschirm aus, stoppen Timer und Ansagen.
- Timer über `performance.now()`-Differenzen statt gezählter Intervalle, damit nichts driftet.
- Deutsche Stimme bevorzugen (`lang` beginnt mit `de`), `voiceschanged` abwarten. In den Einstellungen gibt es „Stimme testen“ und eine Diagnosezeile (Anzahl Stimmen, gewählte Stimme).

## Design-Regeln (Kurzfassung, Details in `design/tokens.json`)

- Weißer Hintergrund, weiße Karten mit weichem Schatten (`shadow-soft`), große Rundungen (`radius-lg` 28 px), runde Knöpfe und Chips.
- `primary` (#921A5B) = aktive Phase (Wiederholung, Halten) und der eine wichtigste Button. `rest` (#A65A0A) = Vorbereitung, Satzpause, Absenken.
- Die große Zahl im Fortschrittsring ist das Wichtigste im Training; aus 1–2 m lesbar. Ziffern mit `tabular-nums`.
- Schrift: Figtree (Google Fonts).
- Touch-Ziele mindestens 44 px, Steuerknöpfe 64 px, Pause-Button 72 px hoch.

## Arbeitsweise

- Vor größeren Schritten einen kurzen Plan zeigen und auf Reginas OK warten.
- Kleine, nachvollziehbare Commits mit deutschen Commit-Nachrichten.
- Die Ablauflogik (Plan aus Programm erzeugen, Zurück/Weiter) mit Tests absichern.
- Nach jeder sichtbaren Änderung sagen, wie Regina sie auf dem Handy ausprobieren kann.
