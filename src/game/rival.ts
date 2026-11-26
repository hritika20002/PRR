import { GAME_CONFIG as C } from "./config";
import { nextRandom } from "./rng";
import { samePosition } from "./spawning";
import type { GameState, ItemKind, Position } from "./types";

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function rivalStep(from: Position, target: Position): Position {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  if (dx === 0 && dy === 0) return from;
  return Math.abs(dx) >= Math.abs(dy)
    ? { x: from.x + Math.sign(dx), y: from.y }
    : { x: from.x, y: from.y + Math.sign(dy) };
}

export function rivalIntervalTicks(level: number): number {
  return C.RIVAL_MOVE_MS[Math.max(0, Math.min(5, level))] / C.TICK_MS;
}

export function threatAfterPickup(level: number, kind: ItemKind, workCount: number): number {
  if (kind === "work" && workCount % 2 === 0) return Math.min(5, level + 1);
  if (kind === "skill") return Math.max(0, level - 1);
  return level;
}

export function safeRivalPosition(player: Position, occupied: readonly Position[], seed: number): { position: Position; seed: number } {
  const free: Position[] = [];
  for (let y = 0; y < C.GRID_SIZE; y++) {
    for (let x = 0; x < C.GRID_SIZE; x++) {
      const p = { x, y };
      if (!samePosition(p, player) && !occupied.some(o => samePosition(o, p))) free.push(p);
    }
  }
  // The MVP has only five item slots, so a free cell always exists.
  if (!free.length) throw new Error("No free cell for rival");
  const distant = free.filter(p => manhattan(p, player) >= C.RIVAL_MIN_DISTANCE);
  const maxDistance = Math.max(...free.map(p => manhattan(p, player)));
  const candidates = distant.length ? distant : free.filter(p => manhattan(p, player) === maxDistance);
  const random = nextRandom(seed);
  return { position: candidates[Math.floor(random.value * candidates.length)], seed: random.seed };
}

export function resolveRivalContact(state: GameState): GameState {
  if (state.phase !== "playing" || state.tick < state.rival.immuneUntilTick || !samePosition(state.player.position, state.rival.position)) return state;
  const energy = Math.max(0, state.energy - C.RIVAL_DAMAGE);
  const hit = { tick: state.tick, position: { ...state.player.position }, energyDelta: energy - state.energy };
  const damaged = { ...state, energy, lastRivalHit: hit, rival: { ...state.rival, hits: state.rival.hits + 1 } };
  if (energy === 0) return { ...damaged, phase: "ended", outcome: "replaced" };
  const spawn = safeRivalPosition(state.player.position, state.items.flatMap(item => item.position ? [item.position] : []), state.rngState);
  return { ...damaged, rngState: spawn.seed, rival: { ...damaged.rival, position: spawn.position, nextMoveTick: state.tick + rivalIntervalTicks(state.rival.level), immuneUntilTick: state.tick + C.RIVAL_IMMUNITY_MS / C.TICK_MS } };
}

export function advanceRival(state: GameState): GameState {
  // Check player entry first, even if the rival was about to move away.
  let next = resolveRivalContact(state);
  if (next.phase !== "playing" || next.tick < next.rival.nextMoveTick) return next;
  next = { ...next, rival: { ...next.rival, position: rivalStep(next.rival.position, next.player.position), nextMoveTick: next.tick + rivalIntervalTicks(next.rival.level) } };
  return resolveRivalContact(next);
}
