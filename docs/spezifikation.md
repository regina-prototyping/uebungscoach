# Übungscoach – Spezifikation v1

Stand: 8. Oktober 2026

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

- Übungen und Programme direkt in der App anlegen und bearbeiten
- Spracheingabe von Übungen
- Trainingsverlauf und Statistik
- Bilder oder Videos zu den Übungen
- Synchronisation zwischen Geräten
- Dunkles Farbschema
- Weiterlaufen bei gesperrtem Bildschirm (ginge nur als native App)

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
