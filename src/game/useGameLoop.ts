"use client";

import { useEffect } from "react";
import { GAME_CONFIG } from "./config";
import type { GamePhase } from "./types";

export function useGameLoop(phase: GamePhase, onTick: () => void): void {
  const running = phase === "playing" || phase === "countdown";
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(onTick, GAME_CONFIG.TICK_MS);
    return () => window.clearInterval(id);
  }, [running, onTick]);
}
