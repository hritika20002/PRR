import type { Direction } from "./types";

export function getDirectionFromKey(
  key: string
): Direction | undefined {
  switch (key.toLowerCase()) {
    case "arrowup":
    case "w":
      return "up";

    case "arrowdown":
    case "s":
      return "down";

    case "arrowleft":
    case "a":
      return "left";

    case "arrowright":
    case "d":
      return "right";

    default:
      return undefined;
  }
}