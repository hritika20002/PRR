import { GAME_CONFIG } from "./config";
import { movePosition } from "./movement";
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

  let items = state.items;
  let pickups = state.pickups;
  // Collect only when entering a new cell, never while stationary at a wall.
  if (!samePosition(position, state.player.position)) {
    const hit = collectItem(items, position, nextTick);
    items = hit.items;
    if (hit.collected) {
      pickups = { ...pickups, [hit.collected]: pickups[hit.collected] + 1 };
    }
  }
  const spawned = respawnDueItems(items, nextTick, state.rngState, [position]);
  return {
    ...state,
    tick: nextTick,
    elapsedMs: state.elapsedMs + GAME_CONFIG.TICK_MS,
    player: { position, direction },
    items: spawned.items,
    pickups,
    rngState: spawned.seed,
  };
}
