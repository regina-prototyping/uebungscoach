# Übungscoach – Spezifikation

Stand: 16. November 2026 · Version 1 und Version 2 (Übungen und Programme bearbeiten) sind umgesetzt, dazu Signaltöne, Sicherung und Trainingsverlauf.

## Ziel

Eine Handy-App, die per Sprachansage durch Physio-Übungen führt: Sie sagt jede Übung an, zählt Wiederholungen mit oder Haltezeiten herunter und geht automatisch zur nächsten Übung weiter. Mehrere Programme (z. B. Rücken, Arme mit Theraband) lassen sich anlegen und auswählen.

## Datenmodell

Ein **Programm** hat einen Namen, optional eine Startposition und eine geordnete Liste von **Übungen**.

| Feld | Gilt für | Bedeutung | Beispiel |
| --- | --- | --- | --- |
| Name | Programm, Übung | Anzeige- und Ansagetext | Rücken; Becken kippen |
| Startposition | Programm (optional) | Wird ganz am Anfang angesagt | Auf dem Rücken liegen |
| Hinweis | Übung (optional) | Wird vor der Übung angesagt | Bauch einziehen |
| Typ | Übung | `reps` (Wiederholungen) · `sides` (pro Seite) · `hold` (Halten) | hold |
| Wiederholungen | Übung | Anzahl je Satz (bei `sides`: je Seite) | 15 |
| Haltedauer (s) | nur `hold` | Countdown je Wiederholung | 5 |
| Sätze | Übung | Wie oft der ganze Block wiederholt wird | 2 |
| Tempo (s) | Übung (optional) | Dauer einer Wiederholung beim Mitzählen | 3 |
| Satzpause (s) | Übung (optional) | Pause zwischen zwei Sätzen | 30 |
| Absenken (s) | Übung (optional) | Pause zwischen zwei Haltephasen | 3 |

Optionale Zeitwerte fallen auf die globalen Einstellungen zurück. Neue Programme sind nur neue Daten, keine neue Programmierung.

## Standardwerte (in der App einstellbar)

| Einstellung | Standard |
| --- | --- |
| Tempo pro Wiederholung | 3 s |
| Vorbereitung vor jeder Übung | 5 s (verlängert sich automatisch, wenn die Ansage länger dauert) |
| Pause zwischen Sätzen | 30 s |
| Absenken zwischen Haltephasen | 3 s |

## Ablauf eines Trainings

Das Training läuft ohne Antippen durch; Eingreifen ist nur zum Pausieren oder Springen nötig.

1. Programm wählen, „Training starten“ tippen.
2. **Vorbereitung:** Ansage von Startposition (nur bei der ersten Übung), Name, Hinweis und Menge der Übung, z. B. „Nächste Übung: Beine seitlich kippen. 2 Sätze, je Seite 5 Wiederholungen.“ Danach Countdown mit Pieptönen bei 3, 2, 1.
3. **Durchführung** je nach Typ:
   - `reps`: die App zählt laut „1 … 15“, eine Zahl pro Tempo-Intervall.
   - `sides`: „Satz 1 von 2. Links, 5 Mal.“ – zählen – „Seite wechseln. Rechts, 5 Mal.“ – zählen.
   - `hold`: „Hoch und halten“ bzw. „Hoch, 3“, Countdown der Haltedauer (Pieptöne bei 3, 2, 1), „Ab“, Absenkzeit, nächste Wiederholung.
4. **Satzpause** (wenn weitere Sätze folgen): „Satz 1 geschafft. 30 Sekunden Pause.“, Countdown mit Pieptönen, dann der nächste Satz.
5. Nächste Übung ab Schritt 2.
6. Nach der letzten Übung: „Training geschafft. Gut gemacht!“

## Muss-Funktionen Version 1

- [x] Programmauswahl (mehrere Programme)
- [x] Geführter Ablauf mit Sprachansagen und Pieptönen wie oben
- [x] Große Anzeige: aktuelle Übung, Zähler bzw. Countdown im Fortschrittsring, Satz x von y, nächste Übung, Restzeit
- [x] Steuerung: Pause/Weiter (Symbol wechselt!), Zurück (Anfang der aktuellen bzw. vorherigen Übung), Nächste Übung, Beenden mit Rückfrage
- [x] Bildschirm bleibt während des Trainings an (Wake Lock)
- [x] Standardwerte global einstellbar und im Browser gespeichert, pro Übung überschreibbar
- [x] Als App auf dem Handy-Startbildschirm installierbar (PWA)

## Bewusst später

- Spracheingabe von Übungen
- Weitere Statistik, z. B. ein Diagramm „Trainings pro Woche“ (geht auch rückwirkend, weil jedes Training mit Zeitpunkt gespeichert ist)
- Bilder oder Videos zu den Übungen
- Synchronisation zwischen Geräten (Konto mit automatischer Speicherung, siehe Issue #15)
- Dunkles Farbschema
- Weiterlaufen bei gesperrtem Bildschirm (ginge nur als native App)

## Version 2: Übungen und Programme bearbeiten

### Grundidee

Übungen liegen in einer gemeinsamen **Übungsbibliothek**. Ein **Programm** wird aus Übungen dieser Bibliothek zusammengestellt. Dieselbe Übung kann in mehreren Programmen vorkommen. Wird eine Übung geändert, gilt die Änderung in allen Programmen, die sie verwenden.

Wer dieselbe Übung in zwei Programmen unterschiedlich ausführen will (z. B. 2 × 10 und 3 × 8), legt eine zweite Übung an. Dafür gibt es „Übung duplizieren“.

### Datenmodell ab Version 2

**Übung**

| Feld | Pflicht | Gilt bei | Eingabe | Bereich |
| --- | --- | --- | --- | --- |
| Name | ja | immer | Textfeld | – |
| Hinweis | nein | immer | Textfeld, wird vor der Übung angesagt | – |
| Art | ja | immer | Chips: Wiederholungen · Halten | – |
| Pro Seite | ja | immer | Schalter (Standard: aus) | – |
| Wiederholungen | ja | immer (bei „pro Seite“: je Seite) | Plus/Minus | 1–50 |
| Haltedauer (s) | ja | nur Halten | Plus/Minus | 1–120 |
| Sätze | ja | immer | Plus/Minus | 1–10 |
| Tempo (s) | nein | nur Wiederholungen | unter „Eigene Zeiten“ | wie Einstellungen |
| Absenken (s) | nein | nur Halten | unter „Eigene Zeiten“ | wie Einstellungen |
| Satzpause (s) | nein | nur bei mehr als 1 Satz | unter „Eigene Zeiten“ | wie Einstellungen |

**Programm**

| Feld | Pflicht | Bedeutung |
| --- | --- | --- |
| Name | ja | z. B. „Rücken“ |
| Startposition | nein | wird ganz am Anfang angesagt |
| Übungen | – | geordnete Liste von Übungen aus der Bibliothek |

Die bisherigen Typen werden so abgebildet: `reps` = Wiederholungen ohne Seiten, `sides` = Wiederholungen pro Seite, `hold` = Halten ohne Seiten. Neu ist **Halten pro Seite**.

### Art und „pro Seite“ im Ablauf

| | Pro Seite: aus | Pro Seite: an |
| --- | --- | --- |
| **Wiederholungen** | „1“ … „15“ | „Links, 5 Mal.“ – „1“ … „5“ – „Seite wechseln. Rechts, 5 Mal.“ – „1“ … „5“ |
| **Halten** | „Hoch und halten“ – Countdown – „Ab“ – Absenken – „Hoch, 2“ … | „Links, 5 Mal.“ – Halten wie links daneben, 5 × – „Seite wechseln. Rechts, 5 Mal.“ – 5 × |

Bei mehreren Sätzen beginnt jede linke Seite mit „Satz x von y.“ wie bisher.

### Eigene Zeiten (Progressive Disclosure)

- Tempo, Absenken und Satzpause stehen in einem zugeklappten Bereich „Eigene Zeiten“.
- Es werden nur die Felder gezeigt, die für Art und Satzanzahl sinnvoll sind.
- Ohne eigenen Wert zeigt das Feld den Standard aus den Einstellungen, z. B. „Standard (3 s)“. Plus oder Minus macht daraus einen eigenen Wert; „Zurücksetzen“ macht ihn wieder zum Standard.
- Hat eine Übung eigene Zeiten, steht das auch im zugeklappten Zustand, z. B. „Eigene Zeiten · Tempo 4 s“.

### Funktionen

**Programme**
- [x] Neues Programm anlegen (Name, optional Startposition)
- [x] Programm bearbeiten: Name, Startposition, Übungen
- [x] Übung hinzufügen: Auswahl aus der Bibliothek; ganz oben „+ Neue Übung“, die nach dem Speichern direkt im Programm landet
- [x] Reihenfolge der Übungen ändern (Pfeile ↑ ↓)
- [x] Dieselbe Übung darf mehrmals vorkommen
- [x] Übung aus dem Programm entfernen (sie bleibt in der Bibliothek)
- [x] Programm löschen
- [x] Das Rückenprogramm ist wie jedes andere bearbeitbar

**Übungsbibliothek**
- [x] Liste aller Übungen
- [x] Übung anlegen, bearbeiten, duplizieren
- [x] Übung löschen, nur wenn sie in keinem Programm vorkommt
- [x] Beim Bearbeiten ist sichtbar, in welchen Programmen die Übung vorkommt

**Allgemein**
- [x] Löschen ohne Rückfrage, dafür mit „Rückgängig“: unten erscheint für einige Sekunden eine Leiste, z. B. „Übung gelöscht · Rückgängig“
- [x] Speicherung lokal im Browser. Beim ersten Start übernimmt die App die mitgelieferten Programme und Übungen (Rücken, Arme mit Theraband) in den Speicher; danach gilt nur noch die gespeicherte Fassung
- [x] Ein Programm ohne Übungen kann nicht gestartet werden

### Entscheidungen

- **Zugang:** Jede Programmkarte auf dem Startbildschirm hat „Bearbeiten“. Unter den Programmen steht eine Karte „+ Neues Programm“. Oben rechts auf dem Startbildschirm öffnet ein Menü-Knopf (☰) ein Menü-Panel, das fast den ganzen Bildschirm bedeckt (links bleibt ein schmaler, abgedunkelter Streifen der Seite sichtbar). Es enthält „Übungen“ (Übungsbibliothek) und „Einstellungen“ und schließt über ✕ oder Tippen auf den Streifen.
- **Löschen von Übungen:** Im Programm wird eine Übung nur *entfernt*; sie bleibt in der Bibliothek. Endgültig löschen geht nur in der Bibliothek und nur für Übungen, die in keinem Programm vorkommen. Bei verwendeten Übungen steht stattdessen, in welchen Programmen sie stecken.
- **Doppelte Übungen:** Dieselbe Übung darf mehrmals im selben Programm vorkommen (z. B. Dehnung am Anfang und am Ende).
- **Verschieben:** mit Pfeil-Knöpfen ↑ ↓ an jeder Übung.
- **Startseite kompakt:** Jedes Programm ist eine kleine Karte mit Name, „3 Übungen · ca. 8 Min“ und einem ▶-Knopf zum Schnellstart; dort kein „Bearbeiten“. Antippen öffnet die **Programm-Ansicht** mit nummerierter Übungsliste, „Bearbeiten“ und „Training starten“. Leere Programme zeigen „Noch keine Übungen“ und führen direkt zum Bearbeiten.
- **Mengen stehen unter dem Übungsnamen**, nicht daneben, damit lange Namen sauber umbrechen. Halten mit einer Wiederholung ohne überflüssige „1 ×“ (z. B. „1 × 30 s je Seite“).

## Gestaltung und Barrierefreiheit (UI-Überarbeitung)

Ziel: ruhigere Typografie, einheitliche Abstände, mehr Struktur, saubere Barrierefreiheit – ohne Funktionen oder Texte zu ändern. Werte stehen in `src/stil/theme.css` und `design/tokens.json`.

- **Tokens:** Schriftgrößen `--text-xs/sm/md/lg/xl` (13/15/17/20/28 px, intern in rem, damit die Textgröße des Browsers wirkt), Stärken 400/600/700/800, Abstände `--space-1…10` im 4er-Raster. Ausnahme: die große Zahl im Ring (128 px, bzw. 48 px für Wörter) – in px, weil der Ring eine feste Größe hat; auf niedrigen Bildschirmen schrumpft sie mit dem Ring, damit Label und Untertext im Kreis bleiben.
- **Schrift:** Überschriften 28 px/600; Karten-, Listen- und Übungstitel, Buttons, Chips und App-Name 600; grauer Metatext 15/22 px/400; Uppercase-Labels 13 px/600. 800 nur für die Ring-Zahl.
- **Farben (Indigo-Design, ausgewählt auf der Design-Arbeitsfläche):** Indigo ist die Aktionsfarbe: Verlauf `#262A80 → #4A44C2` auf den großen Flächen (Programmkarte der Startseite, Kopf der Programm-Ansicht, Hauptknöpfe, Pause-Knopf, Fortschrittsbalken), Indigo `#4A44C2` für Ring-Label, Links und Fokusring, dunkles Indigo `#262A80` für Text auf zarten Flächen, zart `#ECEBFB` für Chips, Symbol-Kacheln und Nebenknöpfe. **Grau** für Vorbereitung, Satzpause und Absenken (Ring `#3D3439 → #8C8389`, Schrift `#6B5F67`, Chips `#EFECEE`): Türkis war auf dem Handy zu bunt, so bleibt Indigo die einzige Farbe; die Phase erkennt man zusätzlich am Label im Ring („WIEDERHOLUNG“ / „SATZPAUSE“).
- **Flächen:** Seitenhintergrund weiß, keine Schatten. Gegliedert wird über feine Linien und wenige Farbflächen; Listen (Einstellungen, Bearbeiten, Übungen, Sicherung) stehen ohne Boxen. Rundungen: 20 px große Flächen, 8 px kleine (Eingabefelder, „Danach“), 12 px Symbol-Kacheln.
- **Startseite:** siehe „Trainingsverlauf“ – zwei Programmkarten nebeneinander, darunter der Verlauf der letzten 2 Wochen, darunter schmal die weiteren Programme.
- **Programm-Ansicht:** Indigo-Kopf mit Zurück, Bearbeiten, Name, Info-Zeile (Übungen, Dauer, Startposition) und „Training starten“; darunter die Übungen als Zeitstrahl mit verbundenen Nummern.
- **Training:** Ring ohne Karte mit Farbverlauf (Indigo bzw. Grau je Phase), Chips in der Phasenfarbe, runde Knöpfe zartgrau, Pause-Knopf mit Indigo-Verlauf. „Danach“-Box mit zartem Verlauf in der Phasenfarbe: Label, Übungsname und Menge untereinander. **„Danach“ erscheint nur während der Übung selbst** (Wiederholen, Halten, Absenken). In Vorbereitung, Seitenwechsel und Satzpause steht nur die aktuelle Übung, damit der Bildschirm ruhig bleibt; was als Nächstes kommt, sagt die Ansage. Beim Absenken bleibt es sichtbar, damit die Box im Wechsel Halten/Absenken nicht flackert.
- **Barrierefreiheit:**
  - Der Sekundenzähler hat kein `aria-live` mehr. Ein unsichtbares Element (`.sr-only`, `aria-live="polite"`) sagt nur bei Übungs- oder Satzwechsel, Pausenbeginn und Trainingsende einen kurzen Satz an, z. B. „Übung 2 von 3: Beine seitlich kippen“, „Satzpause: Satz 1 geschafft“, „Training geschafft“ (`screenreaderAnsage` in `anzeige.ts`).
  - Rückfragen („Training beenden?“, „Sicherung laden?“) sind native `<dialog>`-Elemente mit `showModal()`: Hintergrund gesperrt, Fokus im Dialog. Escape bzw. die Android-Zurück-Geste bei offenem Dialog wirken wie „Weitertrainieren“ bzw. „Abbrechen“. Beim Öffnen liegt der Fokus auf „Weitertrainieren“ (bei der Sicherung auf „Abbrechen“, weil „Laden und ersetzen“ Daten überschreibt), beim Schließen wieder auf dem auslösenden Knopf.
  - Ausgeblendetes immer per `hidden` bzw. `display: none`.
  - Sichtbarer Fokusring (`:focus-visible`, 3 px magenta), bei der Programmkarte um die ganze Karte.
  - `prefers-reduced-motion`: alle Animationen und Übergänge praktisch aus, der Ring springt.
  - Textkontraste mindestens 4,5:1 (alle Paare im Indigo-Design mindestens 5,3:1; Ring-Enden auf Weiß mindestens 3:1).

## Signaltöne und Modus „Nur Töne“

Hintergrund: Auf dem Pixel 9 liefert die Sprachausgabe zeitweise keine Stimme (`synthesis-failed`). Außerdem soll das Training auch nur mit Blick auf den Bildschirm (z. B. Fernseher) gut funktionieren. Töne sagen deshalb an, wann man hinschauen oder handeln muss.

### Einstellung „Ansagen“

- **Sprache und Töne** (Standard): Sprachansagen wie bisher, dazu die Signaltöne – außer dem Takt-Klick.
- **Nur Töne**: keine Sprachansagen; Signaltöne und Takt-Klick.
- In den Einstellungen spielt „Töne anhören“ alle Signale nacheinander vor.

### Signale

| Wann | Signal | Klang |
| --- | --- | --- |
| Neue Übung beginnt (Vorbereitung) | Neue Übung – hinschauen | Gong: drei aufsteigende Töne |
| Vorbereitung, Halten, Satzpause enden bald | Countdown | 3 – 2 – 1 wie bisher |
| Aktivität beginnt (erste Wiederholung nach Vorbereitung, Seitenansage oder Satzpause; jedes Halten) | Los | ein langer hoher Ton |
| Halten endet (Absenken beginnt) | Ab | ein tiefer Ton |
| Seitenwechsel bzw. Seitenansage (pro Seite) | Seite | zwei abwechselnde Töne |
| Satz geschafft, Satzpause beginnt | Satzpause | zwei absteigende Töne |
| Training geschafft | Ende | kleine Melodie aufwärts |
| Jede weitere Wiederholung beim Mitzählen | Takt | leiser kurzer Klick – nur im Modus „Nur Töne“ |

Bewusst offen: ob der Takt-Klick auch zusammen mit der Sprache sinnvoll ist – ausprobieren, sobald die Stimme wieder geht.

## Sicherung

Die Daten liegen nur im Browser des Geräts. Eine Sicherungsdatei schützt vor Verlust (Website-Daten gelöscht, App deinstalliert, neues Handy) und bringt die Daten auf andere Geräte.

- **Zugang:** Menü → „Sicherung“ (eigener Bildschirm).
- **Sicherung speichern:** erstellt eine Datei `uebungscoach-sicherung-JJJJ-MM-TT.json` und öffnet auf dem Handy das Teilen-Menü (z. B. „In Drive speichern“). Chrome teilt keine `.json`-Dateien, deshalb wird dort dieselbe Datei als `.txt` geteilt. Wo Teilen nicht geht, wird die Datei heruntergeladen.
- **Inhalt:** Übungen, Programme (mit den angehefteten), Einstellungen (Tempo, Vorbereitung, Satzpause, Absenken), Ansage-Modus und der Trainingsverlauf, dazu `app: "uebungscoach"`, `format: 2` und der Zeitpunkt. Die gewählte Stimme nicht (gerätespezifisch). Sicherungen vom `format: 1` (noch ohne Verlauf) lassen sich weiter laden; der Verlauf ist danach leer.
- **Sicherung laden:** Datei auswählen (auch direkt aus Google Drive), Rückfrage mit Datum und Umfang („Sicherung vom 12.11.2026, 14:30 · 8 Übungen, 3 Programme, 25 Trainings“), dann werden **alle** Daten **ersetzt** – kein Zusammenführen. Danach „Sicherung geladen · Rückgängig“.
- **Prüfung:** Dateien, die keine Sicherung sind, beschädigt sind (`sindGueltig()`, Programme verweisen auf fehlende Übungen) oder aus einer neueren App-Version stammen, werden mit einer verständlichen Meldung abgelehnt; nichts wird geändert. Einstellungen außerhalb der erlaubten Bereiche werden begrenzt, fehlende durch die Standardwerte ersetzt.

## Trainingsverlauf (Issue #18)

Ziel: sehen, an welchen Tagen welches Programm trainiert wurde – auf der Startseite für alle Programme, in der Programm-Ansicht für das eine.

### Was gespeichert wird

- Ein Training zählt, wenn es bis „Training geschafft“ durchgelaufen ist. Abgebrochene Trainings zählen nicht.
- Gespeichert wird jedes Training einzeln: Programm, Programmname und Zeitpunkt (`localStorage`-Schlüssel `uebungscoach-verlauf`). Daraus lassen sich später weitere Auswertungen rückwirkend berechnen.
- Ein Tag ist ein Kalendertag in der Zeitzone des Handys.
- Wird ein Programm gelöscht, bleiben seine Trainings gespeichert (sie werden nur nicht mehr angezeigt).
- Der Verlauf gehört zur Sicherung.

### Startseite

1. „Was trainierst du heute?“
2. **Zwei Programmkarten nebeneinander:** die erste mit Indigo-Verlauf, die zweite zart (`primary-soft`), beide mit Name, „3 Übungen · 8 Min“, rundem ▶ (startet sofort) und Listen-Knopf (öffnet die Programm-Ansicht). Gibt es nur ein Programm mit Übungen, nimmt seine Karte die ganze Breite ein.
3. **Verlauf „Letzte 2 Wochen“:** rechts die Zahl der Trainings. Darunter einmal die Wochentage (heute in Indigo), dann je Programm der Name mit „· 9 ד und eine Reihe aus 14 abgerundeten Kästchen (ältester Tag links, heute rechts, kleine Lücke zwischen den Wochen). Trainiert = Indigo-Verlauf, nicht trainiert = zartgrau, heute ohne Training = Indigo-Rand. Zwei Trainings am selben Tag sind ein Kästchen. Alle Kästchen in derselben Farbe; welches Programm es ist, steht im Namen darüber.
   - Zeilen gibt es für die zwei Programme oben (auch ohne Training) und für jedes weitere, das in den 2 Wochen trainiert wurde.
4. **Weitere Programme** schmal: Name und Anzahl der Übungen; leere Programme führen zum Bearbeiten. Am Ende „Neues Programm“.

**Welche zwei Programme oben stehen:** zuerst die angehefteten, dann die zuletzt trainierten, dann die ersten der Liste – nur Programme mit Übungen. Die Reihenfolge der Karten folgt der Programmliste, damit sie nicht täglich die Plätze tauschen.

**Anheften:** In der Programm-Ansicht oben rechts neben „Bearbeiten“ ein Stecknadel-Knopf (gefüllt = angeheftet). Höchstens zwei Programme sind angeheftet; beim dritten fällt das am längsten angeheftete heraus. Rückmeldung über die Leiste „Oben auf der Startseite angeheftet · Rückgängig“ bzw. „Von der Startseite gelöst“. Gespeichert in den Daten (`angeheftet`), also auch in der Sicherung.

### Programm-Ansicht

- Unter den Übungen, abgesetzt durch großen Abstand und eine feine Linie, ein **Monatskalender**: Titel „November 2026“, rechts ‹ und › zum Blättern (zurück bis zum Monat des ersten Trainings, vor bis zum aktuellen Monat). Woche beginnt am Montag.
- Trainingstage als Kacheln mit Indigo-Verlauf, andere zartgrau, künftige ohne Fläche, heute umrandet. Zwei oder mehr Trainings an einem Tag: kleine Zahl („2“) an der Ecke.
- Darunter: „11 Trainings an 10 Tagen · zuletzt heute“ (bzw. „zuletzt gestern“, „zuletzt vor 3 Tagen“, „zuletzt am 2.10.2026“, „Noch nicht trainiert“).
- Barrierefreiheit: jede Kachel hat einen Text wie „Donnerstag, 12. November: 2 Trainings“; die Reihen der Startseite einen wie „Rücken: an 9 von 14 Tagen trainiert“.

## Programme

### Rücken

Startposition: auf dem Rücken liegen.

| # | Übung | Hinweis | Typ | Wiederholungen | Haltedauer | Sätze |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Becken kippen | Bauch einziehen | reps | 15 | – | 2 |
| 2 | Beine seitlich kippen | – | sides | 5 je Seite | – | 2 |
| 3 | Brücke | Oben halten | hold | 10 | 5 s | 2 |

### Arme mit Theraband

Übungen folgen.
