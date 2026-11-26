import { GAME_CONFIG } from "./config";
import type { GameState, ItemKind } from "./types";

type Totals = Pick<GameState, "energy" | "score">;

function clampEnergy(value: number): number {
  return Math.max(0, Math.min(GAME_CONFIG.MAX_ENERGY, value));
}

export function applyPickup(state: Totals, kind: ItemKind): Totals {
  const { energy, score } = state;
  switch (kind) {
    case "work": return { energy, score: score + GAME_CONFIG.WORK_POINTS };
    case "skill": return { energy, score: score + GAME_CONFIG.SKILL_POINTS };
    case "coffee": return { energy: clampEnergy(energy + GAME_CONFIG.COFFEE_ENERGY), score };
    case "meeting": return { energy: clampEnergy(energy - GAME_CONFIG.MEETING_DAMAGE), score };
  }
}

export function applyCompletedSecond(state: Totals): Totals {
  return {
    energy: clampEnergy(state.energy - GAME_CONFIG.ENERGY_DRAIN_PER_SECOND),
    score: state.score + GAME_CONFIG.SCORE_PER_SECOND,
  };
}
