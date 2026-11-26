import { GAME_CONFIG } from "./config";
import { movePosition } from "./movement";
import { applyPickup, applyCompletedSecond } from "./scoring";
import { collectItem } from "./collisions";
import { createItemSlots, respawnDueItems, samePosition } from "./spawning";
import type { GameInput, GameState } from "./types";

export function createGame(seed = 1): GameState {
  const position = { ...GAME_CONFIG.PLAYER_START };
  const spawned = respawnDueItems(createItemSlots(), 0, seed >>> 0, [position]);
  return {
    phase: "idle",
    tick: 0,
    elapsedMs: 0,
    player: { position, direction: "right" },
    items: spawned.items,
    pickups: { work: 0, skill: 0, coffee: 0, meeting: 0 },
    rngState: spawned.seed,
    energy: GAME_CONFIG.START_ENERGY,
    score: 0,
    outcome: null,
  };
}

export function startGame(state: GameState): GameState {
  return state.phase === "idle" ? { ...state, phase: "playing" } : state;
}
export function pauseGame(state: GameState): GameState {
  return state.phase === "playing" ? { ...state, phase: "paused" } : state;
}
export function resumeGame(state: GameState): GameState {
  return state.phase === "paused" ? { ...state, phase: "playing" } : state;
}
export function restartGame(seed = 1): GameState {
  return startGame(createGame(seed));
}

export function stepGame(state: GameState, input: GameInput = {}): GameState {
  if (state.phase !== "playing") return state;
  const nextTick = state.tick + 1;
  const direction = input.direction ?? state.player.direction;
  const ticksPerMove = GAME_CONFIG.PLAYER_MOVE_MS / GAME_CONFIG.TICK_MS;
  const position = nextTick % ticksPerMove === 0
    ? movePosition(state.player.position, direction)
    : state.player.position;

  let next: GameState = {
    ...state,
    tick: nextTick,
    elapsedMs: state.elapsedMs + GAME_CONFIG.TICK_MS,
    player: { position, direction },
  };

  // Pickup effects happen before scheduled energy drain.
  if (!samePosition(position, state.player.position)) {
    const hit = collectItem(state.items, position, nextTick);
    next = { ...next, items: hit.items };
    if (hit.collected) {
      next = {
        ...next,
        pickups: { ...state.pickups, [hit.collected]: state.pickups[hit.collected] + 1 },
        ...applyPickup(next, hit.collected),
      };
    }
  }
  // A fatal pickup ends the run immediately: no further scoring or respawns.
  if (next.energy === 0) return { ...next, phase: "ended", outcome: "burned-out" };

  // Award points for a completed active second, including a second whose
  // scheduled drain is fatal. No fractional-second score or drain.
  if (Math.floor(next.elapsedMs / 1000) > Math.floor(state.elapsedMs / 1000)) {
    next = { ...next, ...applyCompletedSecond(next) };
  }
  if (next.energy === 0) return { ...next, phase: "ended", outcome: "burned-out" };

  const spawned = respawnDueItems(next.items, nextTick, next.rngState, [position]);
  next = { ...next, items: spawned.items, rngState: spawned.seed };
  if (next.elapsedMs >= GAME_CONFIG.SHIFT_DURATION_MS) {
    return { ...next, phase: "ended", outcome: "survived" };
  }
  return next;
}
