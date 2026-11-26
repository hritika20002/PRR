import { describe, expect, it } from "vitest";
import {
  isWithinBounds,
  movePosition,
} from "@/game/movement";

describe("Player movement", () => {
  it("moves up", () => {
    expect(movePosition({ x: 7, y: 7 }, "up"))
      .toEqual({ x: 7, y: 6 });
  });

  it("moves down", () => {
    expect(movePosition({ x: 7, y: 7 }, "down"))
      .toEqual({ x: 7, y: 8 });
  });

  it("moves left", () => {
    expect(movePosition({ x: 7, y: 7 }, "left"))
      .toEqual({ x: 6, y: 7 });
  });

  it("moves right", () => {
    expect(movePosition({ x: 7, y: 7 }, "right"))
      .toEqual({ x: 8, y: 7 });
  });

  it("blocks movement beyond the left boundary", () => {
    expect(movePosition({ x: 0, y: 7 }, "left"))
      .toEqual({ x: 0, y: 7 });
  });

  it("blocks movement beyond the right boundary", () => {
    expect(movePosition({ x: 14, y: 7 }, "right"))
      .toEqual({ x: 14, y: 7 });
  });

  it("blocks movement beyond the top boundary", () => {
    expect(movePosition({ x: 7, y: 0 }, "up"))
      .toEqual({ x: 7, y: 0 });
  });

  it("blocks movement beyond the bottom boundary", () => {
    expect(movePosition({ x: 7, y: 14 }, "down"))
      .toEqual({ x: 7, y: 14 });
  });

  it("rejects out-of-bounds positions", () => {
    expect(isWithinBounds({ x: -1, y: 7 })).toBe(false);
    expect(isWithinBounds({ x: 15, y: 7 })).toBe(false);
    expect(isWithinBounds({ x: 7, y: -1 })).toBe(false);
    expect(isWithinBounds({ x: 7, y: 15 })).toBe(false);
  });

  it("accepts valid board positions", () => {
    expect(isWithinBounds({ x: 0, y: 0 })).toBe(true);
    expect(isWithinBounds({ x: 14, y: 14 })).toBe(true);
  });
});