"use client";

import { useEffect, useRef } from "react";
import {
  CANVAS_SIZE,
  renderGame,
} from "@/game/renderer";
import type { GameState } from "@/game/types";

interface GameCanvasProps {
  state: GameState;
}

export default function GameCanvas({
  state,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    renderGame(ctx, state);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      role="img"
      aria-label="15 by 15 arcade game board"
      className="block h-auto w-full rounded-lg border border-[#343845]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}