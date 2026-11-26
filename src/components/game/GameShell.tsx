"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createGame,
  startGame,
  restartGame,
  stepGame,
  pauseGame,
  resumeGame,
} from "@/game/engine";

import { getDirectionFromKey } from "@/game/input";
import { useGameLoop } from "@/game/useGameLoop";
import type { Direction } from "@/game/types";

import GameCanvas from "./GameCanvas";

export default function GameShell() {
  const [state, setState] = useState(createGame);

  const pendingDirection = useRef<
    Direction | undefined
  >(undefined);

  // Advance the game simulation.
  const handleTick = useCallback(() => {
    const direction = pendingDirection.current;

    pendingDirection.current = undefined;

    setState((previousState) =>
      stepGame(previousState, { direction })
    );
  }, []);

  useGameLoop(state.phase, handleTick);

  // Start a new shift.
  function handleStart() {
    pendingDirection.current = undefined;

    setState((previousState) =>
      startGame(previousState)
    );
  }

  // Restart the entire game.
  function handleRestart() {
    pendingDirection.current = undefined;
    setState(restartGame());
  }

  // Pause the current shift.
  const handlePause = useCallback(() => {
    pendingDirection.current = undefined;

    setState((previousState) =>
      pauseGame(previousState)
    );
  }, []);

  // Resume the current shift.
  const handleResume = useCallback(() => {
    pendingDirection.current = undefined;

    setState((previousState) =>
      resumeGame(previousState)
    );
  }, []);

  // Keyboard controls.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const direction = getDirectionFromKey(
        event.key
      );

      if (direction && state.phase === "playing") {
        event.preventDefault();

        pendingDirection.current = direction;
        return;
      }

      // Space toggles pause and resume.
      if (
        event.code === "Space" &&
        (state.phase === "playing" ||
          state.phase === "paused")
      ) {
        event.preventDefault();

        if (event.repeat) return;

        if (state.phase === "playing") {
          handlePause();
        } else {
          handleResume();
        }

        return;
      }

      // Escape pauses the game.
      if (
        event.key === "Escape" &&
        state.phase === "playing"
      ) {
        event.preventDefault();
        handlePause();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [state.phase, handlePause, handleResume]);

  // Pause when the player leaves the browser tab.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        handlePause();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [handlePause]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11131e] p-4 font-mono text-white">
      <section className="w-full max-w-[520px]">

        {/* Development status */}
        <div className="mb-4 flex items-center justify-between text-xs tracking-widest text-[#9297a6]">
          <span>PRR / DEV BUILD</span>

          <span className="text-[#b8f96c]">
            ● ONLINE
          </span>
        </div>

        {/* Game title */}
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#b8f96c] sm:text-3xl">
            PLEASE REMAIN RELEVANT.
          </h1>

          <p className="mt-2 text-sm text-[#9297a6]">
            Your probation begins now.
          </p>
        </header>

        {/* Game board */}
        <div className="relative">
          <GameCanvas state={state} />

          {/* Pause overlay */}
          {state.phase === "paused" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-[#11131e]/90 p-6 text-center">

              <p className="mb-3 text-xs tracking-widest text-[#9297a6]">
                TEMPORARY WORK INTERRUPTION
              </p>

              <h2 className="text-3xl font-bold text-[#b8f96c]">
                SHIFT PAUSED
              </h2>

              <p className="mt-3 text-sm text-[#9297a6]">
                Your replacement can wait.
              </p>

              <button
                type="button"
                onClick={handleResume}
                className="mt-6 cursor-pointer rounded-lg bg-[#b8f96c] px-6 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]"
              >
                RESUME SHIFT
              </button>
            </div>
          )}
        </div>

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

          <div className="rounded-lg border border-[#343845] bg-[#202430] p-3">
            <p className="text-xs text-[#9297a6]">
              DIRECTION
            </p>

            <p className="mt-1 text-lg font-bold uppercase">
              {state.player.direction}
            </p>
          </div>

          <div className="rounded-lg border border-[#343845] bg-[#202430] p-3">
            <p className="text-xs text-[#9297a6]">
              ELAPSED TIME
            </p>

            <p className="mt-1 text-lg font-bold">
              {(state.elapsedMs / 1000).toFixed(1)}s
            </p>
          </div>

        </div>

        {/* Main controls */}
        {state.phase === "idle" ? (
          <button
            type="button"
            onClick={handleStart}
            className="mt-4 w-full cursor-pointer rounded-lg bg-[#b8f96c] px-4 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]"
          >
            CLOCK IN
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={
                state.phase === "paused"
                  ? handleResume
                  : handlePause
              }
              disabled={state.phase === "ended"}
              className="cursor-pointer rounded-lg border border-[#343845] bg-[#202430] px-4 py-3 font-bold text-white hover:bg-[#303644] disabled:opacity-50"
            >
              {state.phase === "paused"
                ? "RESUME"
                : "PAUSE"}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="cursor-pointer rounded-lg bg-[#b8f96c] px-4 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]"
            >
              RESTART SHIFT
            </button>

          </div>
        )}

        {/* Controls information */}
        <div className="mt-5 rounded-lg border border-[#343845] p-3 text-center text-xs text-[#9297a6]">
          <p>ARROW KEYS / WASD — MOVE</p>

          <p className="mt-2">
            SPACE — PAUSE / RESUME
          </p>

          <p className="mt-2">
            ESC — PAUSE
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[#9297a6]">
          PHASE 1C // PLAYABLE CONTROLS
        </p>

      </section>
    </main>
  );
}