import { describe, expect, it } from "vitest";
import { beginShift, pauseGame, resumeGame, restartGame, stepGame } from "@/game/engine";
import { activePickup, announcement, pickupLabel } from "@/game/feedback";
import type { GameState, ItemKind } from "@/game/types";

function advance(state: GameState, ticks: number): GameState {
  for (let i = 0; i < ticks; i++) state = stepGame(state);
  return state;
}
// Keep the rival out of isolated pre-Phase-3 mechanic tests. Rival contact is tested separately.
function pickup(kind: ItemKind, energy = 100): GameState {
  const state = restartGame(42);
  const id = state.items.find(item => item.kind === kind)!.id;
  return { ...state, energy, rival: { ...state.rival, position: { x: 0, y: 0 }, nextMoveTick: 10_000 }, items: state.items.map(item => item.id === id
    ? { ...item, position: { x: 8, y: 7 }, respawnAtTick: null }
    : { ...item, position: null, respawnAtTick: 10_000 }) };
}

describe("Pre-shift countdown and feedback", () => {
  it("starts a fresh countdown without changing active shift time", () => {
    const state = beginShift(42);
    expect(state).toMatchObject({ phase: "countdown", countdownMs: 3000, elapsedMs: 0, score: 0, energy: 100 });
    const next = advance(state, 29);
    expect(next).toEqual({ ...state, countdownMs: 100 });
  });
  it("starts playing after 30 countdown ticks and moves only on later ticks", () => {
    const state = advance(beginShift(42), 30);
    expect(state).toMatchObject({ phase: "playing", countdownMs: 0, tick: 0, elapsedMs: 0, player: { position: { x: 7, y: 7 }, direction: "right" } });
    expect(advance(state, 2).player.position).toEqual({ x: 8, y: 7 });
  });
  it("ignores gameplay input during countdown", () => {
    expect(stepGame(beginShift(), { direction: "up" }).player.direction).toBe("right");
  });
  it("freezes a paused countdown and resumes the remaining time", () => {
    const paused = pauseGame(advance(beginShift(), 12));
    expect(advance(paused, 50)).toEqual(paused);
    expect(resumeGame(paused)).toMatchObject({ phase: "countdown", countdownMs: 1800 });
    expect(advance(resumeGame(paused), 18).phase).toBe("playing");
  });
  it("records a work pickup with its exact score change and position", () => {
    const state = advance(pickup("work"), 2);
    expect(state.lastPickup).toEqual({ kind: "work", tick: 2, position: { x: 8, y: 7 }, scoreDelta: 100, energyDelta: 0 });
    expect(pickupLabel(state.lastPickup!)).toBe("+100 PTS");
    expect(announcement(state)).toContain("more work");
  });
  it("reports skill points", () => {
    const state = advance(pickup("skill"), 2);
    expect(pickupLabel(state.lastPickup!)).toBe("+150 PTS");
  });
  it("reports capped coffee recovery rather than the nominal bonus", () => {
    expect(pickupLabel(advance(pickup("coffee", 95), 2).lastPickup!)).toBe("+5 ENERGY");
    expect(pickupLabel(advance(pickup("coffee"), 2).lastPickup!)).toBe("ENERGY FULL");
  });
  it("reports meeting damage", () => {
    expect(pickupLabel(advance(pickup("meeting"), 2).lastPickup!)).toBe("-12 ENERGY");
  });
  it("expires feedback after 12 active ticks, not during pause", () => {
    const state = advance(pickup("skill"), 2);
    const paused = pauseGame(state);
    expect(activePickup(advance(paused, 50))).toBeNull();
    const resumed = resumeGame(paused);
    expect(activePickup(advance(resumed, 11))).not.toBeNull();
    expect(activePickup(advance(resumed, 12))).toBeNull();
  });
  it("clears old feedback on new shifts and prioritizes result announcements", () => {
    const ended = advance(pickup("meeting", 5), 2);
    expect(activePickup(ended)).toBeNull();
    expect(announcement(ended)).toBe("Your position has been impacted.");
    expect(beginShift(42).lastPickup).toBeNull();
  });
});
