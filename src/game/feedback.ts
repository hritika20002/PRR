import { GAME_CONFIG } from "./config";
import type { GameState, ItemKind, PickupEvent } from "./types";

const messages: Record<ItemKind, string> = {
  work: "Great work! Your reward is more work.",
  skill: "Congratulations. You are temporarily relevant.",
  coffee: "Temporary solution to a permanent problem.",
  meeting: "This could have been an email.",
};

export function pickupLabel(event: PickupEvent): string {
  if (event.scoreDelta > 0) return `+${event.scoreDelta} PTS`;
  if (event.energyDelta === 0) return "ENERGY FULL";
  return `${event.energyDelta > 0 ? "+" : ""}${event.energyDelta} ENERGY`;
}

export function activePickup(state: GameState): PickupEvent | null {
  const event = state.lastPickup;
  if (state.phase !== "playing" || !event) return null;
  return (state.tick - event.tick) * GAME_CONFIG.TICK_MS < GAME_CONFIG.FEEDBACK_MS ? event : null;
}

export function announcement(state: GameState): string {
  if (state.outcome === "survived") return "Congratulations. See you Monday.";
  if (state.outcome === "burned-out") return "Your position has been impacted.";
  if (state.outcome === "replaced") return "Thank you for training your replacement.";
  if (state.phase === "countdown") return "Your shift is about to begin.";
  const recent = (tick: number) => (state.tick - tick) * GAME_CONFIG.TICK_MS < GAME_CONFIG.FEEDBACK_MS;
  if (state.lastRivalHit && recent(state.lastRivalHit.tick) && state.lastRivalHit.tick >= (state.lastPickup?.tick ?? -1)) return "We are exploring operational efficiencies.";
  if (state.lastThreatChange && recent(state.lastThreatChange.tick) && state.lastThreatChange.tick >= (state.lastPickup?.tick ?? -1)) return state.lastThreatChange.delta > 0 ? "Thank you for training your replacement." : "Congratulations. You are temporarily relevant.";
  if (state.lastPickup && (state.tick - state.lastPickup.tick) * GAME_CONFIG.TICK_MS < GAME_CONFIG.FEEDBACK_MS) {
    return messages[state.lastPickup.kind];
  }
  if (state.energy <= 25) return "Have you tried practising mindfulness?";
  return state.phase === "idle" ? "Welcome aboard. Your probation begins now." : "Please remain productive.";
}
