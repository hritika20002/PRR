import { describe, expect, it } from "vitest";
import { createGame, startGame, stepGame, pauseGame, resumeGame, restartGame } from "@/game/engine";
import { applyPickup } from "@/game/scoring";
import type { GameState, ItemKind } from "@/game/types";

// Keep the rival out of isolated pre-Phase-3 mechanic tests. Rival contact is tested separately.
function emptyShift(): GameState {
  const state = startGame(createGame(42));
  return { ...state, rival: { ...state.rival, position: { x: 0, y: 0 }, nextMoveTick: 10_000 }, items: state.items.map(item => ({ ...item, position: null, respawnAtTick: 10_000 })) };
}
function advance(state: GameState, ticks: number): GameState {
  for (let i = 0; i < ticks; i++) state = stepGame(state);
  return state;
}
function target(state: GameState, kind: ItemKind): GameState {
  const id = state.items.find(item => item.kind === kind)!.id;
  return { ...state, items: state.items.map(item => item.id === id
    ? { ...item, position: { x: 8, y: 7 }, respawnAtTick: null }
    : { ...item, position: null, respawnAtTick: 10_000 }) };
}

describe("Corporate survival", () => {
  it("starts with 100 energy, zero score and no outcome", () => {
    expect(createGame()).toMatchObject({ energy: 100, score: 0, outcome: null });
  });
  it("drains and scores only at completed seconds", () => {
    const state = advance(emptyShift(), 9);
    expect(state).toMatchObject({ energy: 100, score: 0, elapsedMs: 900 });
    expect(stepGame(state)).toMatchObject({ energy: 99, score: 10, elapsedMs: 1000 });
  });
  it("scores work exactly once", () => {
    const state = advance(target(emptyShift(), "work"), 2);
    expect(state).toMatchObject({ score: 100, energy: 100 });
    expect(stepGame(state).score).toBe(100);
  });
  it("scores skills", () => {
    expect(advance(target(emptyShift(), "skill"), 2)).toMatchObject({ score: 150, energy: 100 });
  });
  it("restores energy from coffee without score", () => {
    expect(advance(target({ ...emptyShift(), energy: 40 }, "coffee"), 2)).toMatchObject({ energy: 55, score: 0 });
  });
  it("caps coffee recovery at 100", () => {
    expect(applyPickup({ energy: 95, score: 0 }, "coffee").energy).toBe(100);
  });
  it("damages energy from meetings without score", () => {
    expect(advance(target(emptyShift(), "meeting"), 2)).toMatchObject({ energy: 88, score: 0 });
  });
  it("ends immediately at zero energy from a meeting, with no respawn or second bonus", () => {
    const state = target({ ...emptyShift(), energy: 12, tick: 9, elapsedMs: 900 }, "meeting");
    const next = stepGame(state);
    expect(next).toMatchObject({ phase: "ended", outcome: "burned-out", energy: 0, score: 0, elapsedMs: 1000 });
    expect(next.pickups.meeting).toBe(1);
    expect(next.items.find(item => item.kind === "meeting")!.position).toBeNull();
  });
  it("ends on fatal scheduled drain and awards the completed second", () => {
    expect(advance({ ...emptyShift(), energy: 1 }, 10)).toMatchObject({ phase: "ended", outcome: "burned-out", energy: 0, score: 10 });
  });
  it("freezes energy, time and score while paused", () => {
    const paused = pauseGame(advance(emptyShift(), 9));
    expect(advance(paused, 50)).toEqual(paused);
    expect(stepGame(resumeGame(paused))).toMatchObject({ energy: 99, score: 10 });
  });
  it("wins precisely at 60 seconds and freezes the ended state", () => {
    const almost = advance(emptyShift(), 599);
    expect(almost).toMatchObject({ phase: "playing", elapsedMs: 59900 });
    const ended = stepGame(almost);
    expect(ended).toMatchObject({ phase: "ended", outcome: "survived", energy: 40, score: 600, elapsedMs: 60000 });
    expect(advance(ended, 100)).toEqual(ended);
  });
  it("prioritizes energy failure over victory at the last tick", () => {
    const state = { ...emptyShift(), energy: 1, tick: 599, elapsedMs: 59900 };
    expect(stepGame(state)).toMatchObject({ phase: "ended", outcome: "burned-out", energy: 0, elapsedMs: 60000 });
  });
  it("applies coffee before the same tick's drain", () => {
    const state = target({ ...emptyShift(), energy: 95, tick: 9, elapsedMs: 900 }, "coffee");
    expect(stepGame(state)).toMatchObject({ energy: 99, score: 10 });
  });
  it("restart clears survival state", () => {
    const ended = advance(emptyShift(), 600);
    expect(ended.outcome).toBe("survived");
    expect(restartGame(42)).toMatchObject({ phase: "playing", energy: 100, score: 0, outcome: null, elapsedMs: 0 });
  });
});
