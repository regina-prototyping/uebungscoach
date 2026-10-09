/* Pieptöne über die Web Audio API – funktioniert zuverlässig, wenn der
   AudioContext beim ersten Antippen erzeugt bzw. fortgesetzt wird. */

let ctx: AudioContext | null = null;

/** Im Klick-Handler aufrufen. */
export function tonBereit(): void {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function piep(freq = 740, laenge = 0.13): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + laenge);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + laenge + 0.02);
}
