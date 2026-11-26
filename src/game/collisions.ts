import { GAME_CONFIG } from "./config";
import { samePosition } from "./spawning";
import type { ItemKind, ItemSlot, Position } from "./types";

export function collectItem(
  items: ItemSlot[],
  position: Position,
  tick: number,
): { items: ItemSlot[]; collected: ItemKind | null } {
  const hit = items.find((item) => item.position && samePosition(item.position, position));
  if (!hit) return { items, collected: null };
  const delayTicks = GAME_CONFIG.ITEM_RESPAWN_MS[hit.kind] / GAME_CONFIG.TICK_MS;
  return {
    collected: hit.kind,
    items: items.map((item) => item.id === hit.id
      ? { ...item, position: null, respawnAtTick: tick + delayTicks }
      : item),
  };
}
