import { GAME_CONFIG } from "./config";
import { nextRandom } from "./rng";
import type { ItemSlot, Position } from "./types";

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function createItemSlots(): ItemSlot[] {
  return [
    { id: "work-1", kind: "work", position: null, respawnAtTick: 0 },
    { id: "skill-1", kind: "skill", position: null, respawnAtTick: 0 },
    { id: "coffee-1", kind: "coffee", position: null, respawnAtTick: 0 },
    { id: "meeting-1", kind: "meeting", position: null, respawnAtTick: 0 },
    { id: "meeting-2", kind: "meeting", position: null, respawnAtTick: 0 },
  ];
}

export function spawnPosition(occupied: readonly Position[], seed: number): {
  position: Position | null;
  seed: number;
} {
  const blocked = new Set(occupied.map(({ x, y }) => `${x},${y}`));
  const free: Position[] = [];
  for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
    for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
      if (!blocked.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { position: null, seed };
  const next = nextRandom(seed);
  return { position: free[Math.floor(next.value * free.length)], seed: next.seed };
}

export function respawnDueItems(
  items: readonly ItemSlot[],
  tick: number,
  seed: number,
  blockedPositions: readonly Position[],
): { items: ItemSlot[]; seed: number } {
  const occupied = [...blockedPositions];
  for (const item of items) {
    if (item.position) occupied.push(item.position);
  }
  const nextItems = items.map((item) => {
    if (item.position || item.respawnAtTick === null || item.respawnAtTick > tick) {
      return item;
    }
    const next = spawnPosition(occupied, seed);
    seed = next.seed;
    if (!next.position) return item; // Retry on the next tick.
    occupied.push(next.position);
    return { ...item, position: next.position, respawnAtTick: null };
  });
  return { items: nextItems, seed };
}
