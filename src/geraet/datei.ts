/*
 * Datei weitergeben: auf dem Handy über das Teilen-Menü (Drive, Mail, WhatsApp …),
 * sonst als Download.
 */

export type Weitergabe = "geteilt" | "abgebrochen" | "heruntergeladen";

/**
 * Muss direkt im Antippen aufgerufen werden (das Teilen-Menü braucht den Klick).
 * Chrome teilt keine .json-Dateien – dann wird dieselbe Datei als .txt geteilt.
 */
export async function dateiWeitergeben(inhalt: string, name: string, titel: string): Promise<Weitergabe> {
  const varianten = [
    new File([inhalt], name, { type: "application/json" }),
    new File([inhalt], name.replace(/\.json$/, ".txt"), { type: "text/plain" }),
  ];
  const teilbar = varianten.find((f) => navigator.canShare?.({ files: [f] }));
  if (teilbar) {
    try {
      await navigator.share({ files: [teilbar], title: titel });
      return "geteilt";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "abgebrochen";
      // anderer Fehler: herunterladen
    }
  }
  herunterladen(varianten[0]);
  return "heruntergeladen";
}

function herunterladen(datei: File): void {
  const url = URL.createObjectURL(datei);
  const a = document.createElement("a");
  a.href = url;
  a.download = datei.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
