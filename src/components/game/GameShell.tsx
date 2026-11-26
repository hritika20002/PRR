"use client";

import { useCallback, useState } from "react";

import {
  createGame,
  startGame,
  restartGame,
  stepGame,
} from "@/game/engine";

import { useGameLoop } from "@/game/useGameLoop";
import GameCanvas from "./GameCanvas";

export default function GameShell() {
  const [state, setState] = useState(createGame);

  const handleTick = useCallback(() => {
    setState((previousState) =>
      stepGame(previousState)
    );
  }, []);

  useGameLoop(state.phase, handleTick);

  function handleStart() {
    setState((previousState) =>
      startGame(previousState)
    );
  }

  function handleRestart() {
    setState(restartGame());
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11131e] p-4 font-mono text-white">
      <section className="w-full max-w-[520px]">

        {/* Development label */}
        <div className="mb-4 flex items-center justify-between text-xs tracking-widest text-[#9297a6]">
          <span>PRR / DEV BUILD</span>
          <span className="text-[#b8f96c]">
            ● ONLINE
          </span>
        </div>

        {/* Title */}
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#b8f96c] sm:text-3xl">
            PLEASE REMAIN RELEVANT.
          </h1>

          <p className="mt-2 text-sm text-[#9297a6]">
            Your probation begins now.
          </p>
        </header>

        {/* Game board */}
        <GameCanvas state={state} />

        {/* Debug information */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#343845] bg-[#202430] p-3">
            <p className="text-xs text-[#9297a6]">
              ENGINE STATUS
            </p>

            <p className="mt-1 text-lg font-bold uppercase text-[#b8f96c]">
              {state.phase}
            </p>
          </div>

          <div className="rounded-lg border border-[#343845] bg-[#202430] p-3">
            <p className="text-xs text-[#9297a6]">
              PLAYER POSITION
            </p>

            <p className="mt-1 text-lg font-bold">
              ({state.player.position.x},{" "}
              {state.player.position.y})
            </p>
          </div>
        </div>

        {/* Start / Restart */}
        <button
          type="button"
          onClick={
            state.phase === "idle"
              ? handleStart
              : handleRestart
          }
          className="mt-4 w-full cursor-pointer rounded-lg bg-[#b8f96c] px-4 py-3 font-bold text-[#11131e] transition-colors hover:bg-[#d0ff9c] active:scale-[0.99]"
        >
          {state.phase === "idle"
            ? "CLOCK IN"
            : "RESTART SHIFT"}
        </button>

        <p className="mt-5 text-center text-xs text-[#9297a6]">
          PHASE 1B // ARCADE ENGINE
        </p>
      </section>
    </main>
  );
}