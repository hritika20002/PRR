import { describe, expect, it } from "vitest";
import { createGame, pauseGame, resumeGame, restartGame, startGame, stepGame } from "@/game/engine";
import type { GameState, ItemKind } from "@/game/types";

// Keep the rival out of isolated pre-Phase-3 mechanic tests. Rival contact is tested separately.
function withPickup(kind: ItemKind): GameState {
  const state = startGame(createGame(42));
  const target = state.items.find((item) => item.kind === kind)!;
  return {
    ...state,
    rival: { ...state.rival, position: { x: 0, y: 0 }, nextMoveTick: 10_000 },
    items: state.items.map((item) => item.id === target.id
      ? { ...item, position: { x: 8, y: 7 }, respawnAtTick: null }
      : { ...item, position: null, respawnAtTick: 10_000 }),
  };
}
function advance(state: GameState, ticks: number): GameState {
  for (let i = 0; i < ticks; i++) state = stepGame(state);
  return state;
}

describe("Item collection and cooldowns", () => {
  it("does not collect before the player enters the cell", () => {
    expect(stepGame(withPickup("work")).pickups.work).toBe(0);
  });
  it("collects work once and immediately respawns away from the player", () => {
    const state = advance(withPickup("work"), 2);
    expect(state.pickups.work).toBe(1);
    const position = state.items.find((item) => item.kind === "work")!.position;
    expect(position).not.toBeNull();
    expect(position).not.toEqual(state.player.position);
    expect(stepGame(state).pickups.work).toBe(1);
  });
  it.each([["skill", 50], ["coffee", 80], ["meeting", 40]] as const)(
    "collects %s once and respawns exactly after %i active ticks", (kind, delay) => {
      let state = advance(withPickup(kind), 2);
      const id = state.items.find((item) => item.kind === kind)!.id;
      expect(state.pickups[kind]).toBe(1);
      expect(state.items.find((item) => item.id === id)!.respawnAtTick).toBe(2 + delay);
      state = advance(state, delay - 1);
      expect(state.items.find((item) => item.id === id)!.position).toBeNull();
      state = stepGame(state);
      expect(state.items.find((item) => item.id === id)!.position).not.toBeNull();
      expect(state.pickups[kind]).toBe(1);
    },
  );
  it("freezes cooldowns and counts during pause", () => {
    const state = advance(withPickup("coffee"), 2);
    const paused = pauseGame(state);
    expect(advance(paused, 100)).toEqual(paused);
    expect(advance(resumeGame(paused), 79).items.find((item) => item.kind === "coffee")!.position).toBeNull();
  });
  it("keeps the two meeting slots independent", () => {
    const state = withPickup("meeting");
    const second = state.items.find((item) => item.id === "meeting-2")!;
    second.position = { x: 10, y: 10 };
    second.respawnAtTick = null;
    const next = advance(state, 2);
    expect(next.items.find((item) => item.id === "meeting-2")).toEqual(second);
    expect(next.pickups.meeting).toBe(1);
  });
  it("does not mutate the previous state when collecting", () => {
    const state = stepGame(withPickup("skill"));
    const snapshot = structuredClone(state);
    stepGame(state);
    expect(state).toEqual(snapshot);
  });
  it("resets counts, cooldowns and time on restart", () => {
    expect(advance(withPickup("coffee"), 2).pickups.coffee).toBe(1);
    const restarted = restartGame(42);
    expect(restarted.pickups).toEqual({ work: 0, skill: 0, coffee: 0, meeting: 0 });
    expect(restarted.tick).toBe(0);
    expect(restarted.items.every((item) => item.position !== null && item.respawnAtTick === null)).toBe(true);
  });
  it("produces identical states for identical seeds and input sequences", () => {
    let a = restartGame(42);
    let b = restartGame(42);
    for (const direction of ["right", "up", "left", "down"] as const) {
      for (let i = 0; i < 20; i++) {
        a = stepGame(a, { direction });
        b = stepGame(b, { direction });
      }
    }
    expect(a).toEqual(b);
  });
});
