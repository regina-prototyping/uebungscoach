# Übungscoach

Web-App, die per Sprachansage durch Physio-Übungen führt: Sie sagt jede Übung an, zählt Wiederholungen mit oder Haltezeiten herunter und geht automatisch weiter.

- Was die App können soll: [`docs/spezifikation.md`](docs/spezifikation.md)
- Design: [`design/`](design/)
- Funktionierender Prototyp: [`prototyp/`](prototyp/)
- Hinweise für Claude Code: [`CLAUDE.md`](CLAUDE.md)

## Entwickeln

```bash
npm install      # Werkzeuge installieren (einmalig)
npm run dev      # App lokal starten, Änderungen erscheinen sofort
npm test         # Tests der Ablauflogik ausführen
npm run build    # fertige App in dist/ erzeugen (macht Vercel automatisch)
```

- Mitgelieferte Übungen und Programme (beim ersten Start übernommen): `src/data/programme.ts`
- Ablauflogik: `src/logik/` (Plan, Spieler, Anzeige, Datenfunktionen, Formularregeln) – getestet in `tests/`
- Speichern im Browser: `src/daten-speicher.ts`, `src/einstellungen.ts`
- Bildschirme: `src/ansichten/`, Navigation mit Zurück-Geste: `src/navigation.ts`
- Ton, Piepen, Bildschirm wach halten: `src/geraet/`

Übungen und Programme werden in der App angelegt und lokal im Browser gespeichert. Wer die Website-Daten in Chrome löscht, verliert sie (Export/Import ist geplant).
