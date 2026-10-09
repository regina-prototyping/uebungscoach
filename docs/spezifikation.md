# Übungscoach – Spezifikation

Stand: 9. Oktober 2026 · Version 1 ist umgesetzt, Version 2 (Übungen und Programme bearbeiten) ist in Planung.

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

- [ ] Programmauswahl (mehrere Programme)
- [ ] Geführter Ablauf mit Sprachansagen und Pieptönen wie oben
- [ ] Große Anzeige: aktuelle Übung, Zähler bzw. Countdown im Fortschrittsring, Satz x von y, nächste Übung, Restzeit
- [ ] Steuerung: Pause/Weiter (Symbol wechselt!), Zurück (Anfang der aktuellen bzw. vorherigen Übung), Nächste Übung, Beenden mit Rückfrage
- [ ] Bildschirm bleibt während des Trainings an (Wake Lock)
- [ ] Standardwerte global einstellbar und im Browser gespeichert, pro Übung überschreibbar
- [ ] Als App auf dem Handy-Startbildschirm installierbar (PWA)

## Bewusst später

- Sicherung: Programme und Übungen als Datei exportieren und importieren
- Spracheingabe von Übungen
- Trainingsverlauf und Statistik
- Bilder oder Videos zu den Übungen
- Synchronisation zwischen Geräten
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
- [ ] Neues Programm anlegen (Name, optional Startposition)
- [ ] Programm bearbeiten: Name, Startposition, Übungen
- [ ] Übung hinzufügen: Auswahl aus der Bibliothek; ganz oben „+ Neue Übung“, die nach dem Speichern direkt im Programm landet
- [ ] Reihenfolge der Übungen ändern (verschieben)
- [ ] Übung aus dem Programm entfernen (sie bleibt in der Bibliothek)
- [ ] Programm löschen
- [ ] Das Rückenprogramm ist wie jedes andere bearbeitbar

**Übungsbibliothek**
- [ ] Liste aller Übungen
- [ ] Übung anlegen, bearbeiten, duplizieren, löschen
- [ ] Beim Bearbeiten ist sichtbar, in welchen Programmen die Übung vorkommt

**Allgemein**
- [ ] Löschen ohne Rückfrage, dafür mit „Rückgängig“: unten erscheint für einige Sekunden eine Leiste, z. B. „Übung gelöscht · Rückgängig“
- [ ] Speicherung lokal im Browser. Beim ersten Start übernimmt die App die mitgelieferten Programme und Übungen (Rücken, Arme mit Theraband) in den Speicher; danach gilt nur noch die gespeicherte Fassung
- [ ] Ein Programm ohne Übungen kann nicht gestartet werden

### Offene Fragen (vor den Entwürfen klären)

- Wo erreicht man die Bearbeitung? Vorschlag: „Bearbeiten“ auf jeder Programmkarte, eine Karte „+ Neues Programm“ auf dem Startbildschirm und ein Zugang zur Übungsbibliothek.
- Was passiert beim Löschen einer Übung, die in Programmen verwendet wird? Vorschlag: Sie verschwindet auch aus diesen Programmen; die Rückgängig-Leiste nennt die Anzahl („aus 2 Programmen entfernt“).
- Darf dieselbe Übung zweimal im selben Programm vorkommen?
- Verschieben per Ziehen (Drag & Drop) oder per Pfeil-Knöpfen ↑ ↓? Pfeile sind auf dem Handy zuverlässiger, Ziehen ist schneller.

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
