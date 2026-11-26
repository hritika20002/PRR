import { GAME_CONFIG } from "./config";
import { movePosition } from "./movement";
import type { GameInput, GameState } from "./types";

export function createGame(): GameState {
  return {
    phase: "idle",
    tick: 0,
    elapsedMs: 0,

    player: {
      position: { ...GAME_CONFIG.PLAYER_START },
      direction: "right",
    },
  };
}

export function startGame(state: GameState): GameState {
  if (state.phase !== "idle") {
    return state;
  }

  return {
    ...state,
    phase: "playing",
  };
}

export function pauseGame(state: GameState): GameState {
  if (state.phase !== "playing") {
    return state;
  }

  return {
    ...state,
    phase: "paused",
  };
}

export function resumeGame(state: GameState): GameState {
  if (state.phase !== "paused") {
    return state;
  }

  return {
    ...state,
    phase: "playing",
  };
}

export function restartGame(): GameState {
  return startGame(createGame());
}

export function stepGame(
  state: GameState,
  input: GameInput = {}
): GameState {
  if (state.phase !== "playing") {
    return state;
  }

  const nextTick = state.tick + 1;

  const direction =
    input.direction ?? state.player.direction;

  const ticksPerMove =
    GAME_CONFIG.PLAYER_MOVE_MS / GAME_CONFIG.TICK_MS;

  const shouldMove = nextTick % ticksPerMove === 0;

  const position = shouldMove
    ? movePosition(state.player.position, direction)
    : state.player.position;

  return {
    ...state,
    tick: nextTick,
    elapsedMs: state.elapsedMs + GAME_CONFIG.TICK_MS,

    player: {
      position,
      direction,
    },
  };
}