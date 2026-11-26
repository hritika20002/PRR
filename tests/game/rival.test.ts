import { describe, expect, it } from "vitest";
import { beginShift, createGame, pauseGame, restartGame, stepGame } from "@/game/engine";
import { advanceRival, manhattan, resolveRivalContact, rivalIntervalTicks, rivalStep, safeRivalPosition, threatAfterPickup } from "@/game/rival";
import type { GameState, ItemKind } from "@/game/types";

function emptyShift(): GameState {
  const state = restartGame(42);
  return { ...state, items: state.items.map(item => ({ ...item, position: null, respawnAtTick: 10_000 })) };
}
function withPickup(kind: ItemKind, level: number, work: number): GameState {
  const state = emptyShift();
  return { ...state, pickups: { ...state.pickups, work }, rival: { ...state.rival, level, peakLevel: level, nextMoveTick: 8 }, items: state.items.map(item => item.id === state.items.find(slot => slot.kind === kind)!.id ? { ...item, position: { x: 8, y: 7 }, respawnAtTick: null } : item) };
}
function advance(state: GameState, ticks: number): GameState {
  for (let i = 0; i < ticks; i++) state = stepGame(state);
  return state;
}

describe("AI rival", () => {
  it("spawns at least eight cells away and avoids all starting items", () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = createGame(seed);
      expect(manhattan(state.player.position, state.rival.position)).toBeGreaterThanOrEqual(8);
      expect(state.items.some(item => item.position?.x === state.rival.position.x && item.position.y === state.rival.position.y)).toBe(false);
    }
  });
  it("moves along the axis with the largest distance, breaking ties horizontally", () => {
    expect(rivalStep({ x: 2, y: 2 }, { x: 4, y: 4 })).toEqual({ x: 3, y: 2 });
    expect(rivalStep({ x: 2, y: 2 }, { x: 1, y: 6 })).toEqual({ x: 2, y: 3 });
    expect(rivalStep({ x: 4, y: 4 }, { x: 1, y: 3 })).toEqual({ x: 3, y: 4 });
    expect(rivalStep({ x: 4, y: 4 }, { x: 4, y: 4 })).toEqual({ x: 4, y: 4 });
  });
  it("uses the agreed six movement intervals", () => {
    expect([0, 1, 2, 3, 4, 5].map(rivalIntervalTicks)).toEqual([8, 7, 6, 5, 4, 3]);
  });
  it("increases threat only on every second work pickup and caps at five", () => {
    expect(threatAfterPickup(0, "work", 1)).toBe(0);
    expect(threatAfterPickup(0, "work", 2)).toBe(1);
    expect(threatAfterPickup(5, "work", 12)).toBe(5);
  });
  it("reduces threat on skills and floors it at zero", () => {
    expect(threatAfterPickup(3, "skill", 2)).toBe(2);
    expect(threatAfterPickup(0, "skill", 2)).toBe(0);
    expect(threatAfterPickup(3, "coffee", 2)).toBe(3);
  });
  it("integrates work and skill threat changes, preserving peak threat", () => {
    const work = advance(withPickup("work", 2, 1), 2);
    expect(work.rival).toMatchObject({ level: 3, peakLevel: 3 });
    expect(work.lastThreatChange).toEqual({ tick: 2, delta: 1 });
    const skill = advance(withPickup("skill", 3, 2), 2);
    expect(skill.rival).toMatchObject({ level: 2, peakLevel: 3 });
  });
  it("does not retroactively reschedule an interval when threat changes", () => {
    const state = advance(withPickup("work", 2, 1), 2);
    expect(state.rival.nextMoveTick).toBe(8);
    const after = advance(state, 6);
    expect(after.rival.nextMoveTick).toBe(13);
  });
  it("moves only at the scheduled active tick", () => {
    const state = emptyShift();
    const before = advance(state, 7);
    expect(before.rival.position).toEqual(state.rival.position);
    const after = stepGame(before);
    expect(after.rival.position).toEqual(rivalStep(before.rival.position, after.player.position));
  });
  it("detects player entry before a rival move and charges only once", () => {
    const state = emptyShift();
    const next = stepGame({ ...state, tick: 1, elapsedMs: 100, rival: { ...state.rival, position: { x: 8, y: 7 }, nextMoveTick: 2 } });
    expect(next.energy).toBe(75);
    expect(next.rival.hits).toBe(1);
    expect(next.rival.nextMoveTick).toBe(10);
    expect(manhattan(next.rival.position, next.player.position)).toBeGreaterThanOrEqual(8);
  });
  it("detects rival entry onto the player on its own movement tick", () => {
    const state = emptyShift();
    const next = stepGame({ ...state, rival: { ...state.rival, position: { x: 7, y: 6 }, nextMoveTick: 1 } });
    expect(next.energy).toBe(75);
    expect(next.rival.hits).toBe(1);
  });
  it("grants ten active ticks of immunity and allows damage at expiry", () => {
    const state = emptyShift();
    const contact = { ...state, tick: 4, rival: { ...state.rival, position: state.player.position } };
    const hit = resolveRivalContact(contact);
    expect(hit.rival.immuneUntilTick).toBe(14);
    const again = { ...hit, tick: 13, rival: { ...hit.rival, position: hit.player.position } };
    expect(resolveRivalContact(again)).toBe(again);
    expect(resolveRivalContact({ ...again, tick: 14 }).energy).toBe(50);
  });
  it("relocates to a free distant cell and falls back to the furthest available cell", () => {
    const occupied = Array.from({ length: 225 }, (_, i) => ({ x: i % 15, y: Math.floor(i / 15) })).filter(p => !(p.x === 7 && (p.y === 7 || p.y === 8 || p.y === 9)));
    expect(safeRivalPosition({ x: 7, y: 7 }, occupied, 42).position).toEqual({ x: 7, y: 9 });
  });
  it("does not consume items when the rival walks over them", () => {
    const state = emptyShift();
    const item = { ...state.items[0], position: { x: 2, y: 1 }, respawnAtTick: null };
    const next = advanceRival({ ...state, tick: 8, items: [item], rival: { ...state.rival, position: { x: 1, y: 1 }, nextMoveTick: 8 } });
    expect(next.rival.position).toEqual(item.position);
    expect(next.items).toEqual([item]);
    expect(next.pickups.work).toBe(0);
  });
  it("ends immediately as replaced on fatal rival contact, before second scoring", () => {
    const state = emptyShift();
    const next = stepGame({ ...state, energy: 25, tick: 9, elapsedMs: 900, rival: { ...state.rival, position: { x: 8, y: 7 }, nextMoveTick: 10 } });
    expect(next).toMatchObject({ phase: "ended", outcome: "replaced", energy: 0, score: 0, elapsedMs: 1000 });
    expect(stepGame(next)).toBe(next);
  });
  it("freezes during countdown and pause and resets rival state on restart", () => {
    const countdown = beginShift(42);
    expect(advance(countdown, 29).rival).toEqual(countdown.rival);
    const paused = pauseGame(advance(emptyShift(), 5));
    expect(advance(paused, 100)).toBe(paused);
    expect(restartGame(42).rival).toMatchObject({ level: 0, peakLevel: 0, hits: 0, immuneUntilTick: 0, nextMoveTick: 8 });
  });
  it("reproduces the entire run and prevents mutation of prior state", () => {
    const state = emptyShift();
    const copy = structuredClone(state);
    expect(advance(state, 200)).toEqual(advance(emptyShift(), 200));
    expect(state).toEqual(copy);
  });
  it("does not allow item respawns on the rival's current cell", () => {
    const state = emptyShift();
    const next = stepGame({ ...state, items: state.items.map(item => ({ ...item, respawnAtTick: 1 })) });
    expect(next.items.some(item => item.position?.x === next.rival.position.x && item.position.y === next.rival.position.y)).toBe(false);
  });
  it("prioritizes fatal AI contact over victory at the final tick", () => {
    const state = emptyShift();
    const next = stepGame({ ...state, energy: 25, tick: 599, elapsedMs: 59900, rival: { ...state.rival, position: { x: 8, y: 7 }, nextMoveTick: 600 } });
    expect(next).toMatchObject({ phase: "ended", outcome: "replaced", energy: 0, elapsedMs: 60000 });
  });
  it("punishes passive wall camping on representative seeded boards", () => {
    for (const seed of [0, 1, 42, 99]) {
      expect(advance(restartGame(seed), 600).outcome).toBe("replaced");
    }
  });
  it("preserves burnout when a meeting is fatal before AI contact", () => {
    const state = withPickup("meeting", 0, 0);
    const next = advance({ ...state, energy: 12, rival: { ...state.rival, position: { x: 8, y: 7 } } }, 2);
    expect(next).toMatchObject({ phase: "ended", outcome: "burned-out", energy: 0, rival: { hits: 0 } });
  });

});
