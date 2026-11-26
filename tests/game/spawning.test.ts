import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "@/game/config";
import { createGame } from "@/game/engine";
import { isWithinBounds } from "@/game/movement";
import { createItemSlots, respawnDueItems, spawnPosition } from "@/game/spawning";
import type { Position } from "@/game/types";

describe("Item spawning", () => {
  it("starts with exactly one work, one skill, one coffee and two meetings", () => {
    const { items } = createGame(42);
    expect(items.map((item) => item.kind)).toEqual(["work", "skill", "coffee", "meeting", "meeting"]);
    expect(items.every((item) => item.position !== null)).toBe(true);
  });
  it("never overlaps the player or another item across many seeds", () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = createGame(seed);
      const positions = [state.player.position, ...state.items.flatMap((item) => item.position ? [item.position] : [])];
      expect(positions).toHaveLength(6);
      expect(new Set(positions.map((p) => `${p.x},${p.y}`)).size).toBe(6);
      expect(positions.every(isWithinBounds)).toBe(true);
    }
  });
  it("reproduces the same initial board for the same seed", () => {
    expect(createGame(42)).toEqual(createGame(42));
  });
  it("chooses the only free cell", () => {
    const occupied: Position[] = [];
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (x !== 14 || y !== 14) occupied.push({ x, y });
      }
    }
    expect(spawnPosition(occupied, 42).position).toEqual({ x: 14, y: 14 });
  });
  it("defers spawning if the board is full and preserves RNG state", () => {
    const occupied: Position[] = [];
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) occupied.push({ x, y });
    }
    expect(spawnPosition(occupied, 42)).toEqual({ position: null, seed: 42 });
    const slots = createItemSlots();
    expect(respawnDueItems(slots, 1, 42, occupied)).toEqual({ items: slots, seed: 42 });
    const next = respawnDueItems(slots, 2, 42, occupied.slice(1));
    expect(next.items[0].position).toEqual({ x: 0, y: 0 });
  });
  it("does not spawn a slot before its cooldown expires", () => {
    const slot = { ...createItemSlots()[1], respawnAtTick: 50 };
    expect(respawnDueItems([slot], 49, 42, []).items[0]).toEqual(slot);
    expect(respawnDueItems([slot], 50, 42, []).items[0].position).not.toBeNull();
  });
});
