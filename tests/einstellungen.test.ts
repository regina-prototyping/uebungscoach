import { describe, expect, it } from "vitest";
import { aendern, ladeEinstellungen, STANDARD } from "../src/einstellungen";

describe("Einstellungen", () => {
  it("Standardwerte laut Spezifikation", () => {
    expect(STANDARD).toEqual({ tempo: 3, prep: 5, setPause: 30, lower: 3 });
  });

  it("ohne gespeicherte Werte gelten die Standardwerte", () => {
    expect(ladeEinstellungen()).toEqual(STANDARD);
  });

  it("Plus und Minus ändern um einen Schritt", () => {
    expect(aendern(STANDARD, "tempo", 1).tempo).toBe(4);
    expect(aendern(STANDARD, "setPause", -1).setPause).toBe(25);
  });

  it("bleibt innerhalb der Grenzen", () => {
    expect(aendern({ ...STANDARD, tempo: 1 }, "tempo", -1).tempo).toBe(1);
    expect(aendern({ ...STANDARD, setPause: 120 }, "setPause", 1).setPause).toBe(120);
  });

  it("verändert das Original nicht", () => {
    const e = { ...STANDARD };
    aendern(e, "lower", 1);
    expect(e).toEqual(STANDARD);
  });
});
