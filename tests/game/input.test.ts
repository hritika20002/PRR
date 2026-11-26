import { describe, expect, it } from "vitest";
import { getDirectionFromKey } from "@/game/input";

describe("Keyboard input", () => {
  it("supports all arrow keys", () => {
    expect(getDirectionFromKey("ArrowUp"))
      .toBe("up");

    expect(getDirectionFromKey("ArrowDown"))
      .toBe("down");

    expect(getDirectionFromKey("ArrowLeft"))
      .toBe("left");

    expect(getDirectionFromKey("ArrowRight"))
      .toBe("right");
  });

  it("supports WASD movement", () => {
    expect(getDirectionFromKey("w"))
      .toBe("up");

    expect(getDirectionFromKey("s"))
      .toBe("down");

    expect(getDirectionFromKey("a"))
      .toBe("left");

    expect(getDirectionFromKey("d"))
      .toBe("right");
  });

  it("supports uppercase input", () => {
    expect(getDirectionFromKey("W"))
      .toBe("up");

    expect(getDirectionFromKey("A"))
      .toBe("left");

    expect(getDirectionFromKey("S"))
      .toBe("down");

    expect(getDirectionFromKey("D"))
      .toBe("right");
  });

  it("ignores unrelated keys", () => {
    expect(getDirectionFromKey("Enter"))
      .toBeUndefined();

    expect(getDirectionFromKey("Escape"))
      .toBeUndefined();

    expect(getDirectionFromKey(" "))
      .toBeUndefined();
  });

  it("ignores empty input", () => {
    expect(getDirectionFromKey(""))
      .toBeUndefined();
  });
});