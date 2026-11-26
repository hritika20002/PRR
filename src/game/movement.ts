import { GAME_CONFIG } from "./config";
import type { Direction, Position } from "./types";

const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isWithinBounds(position: Position): boolean {
  return (
    position.x >= 0 &&
    position.x < GAME_CONFIG.GRID_SIZE &&
    position.y >= 0 &&
    position.y < GAME_CONFIG.GRID_SIZE
  );
}

export function movePosition(
  position: Position,
  direction: Direction
): Position {
  const vector = DIRECTION_VECTORS[direction];

  const nextPosition: Position = {
    x: position.x + vector.x,
    y: position.y + vector.y,
  };

  if (!isWithinBounds(nextPosition)) {
    return position;
  }

  return nextPosition;
}