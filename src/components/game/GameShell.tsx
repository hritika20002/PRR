"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createGame, restartGame, stepGame, pauseGame, resumeGame } from "@/game/engine";
import { GAME_CONFIG } from "@/game/config";
import { getDirectionFromKey } from "@/game/input";
import { useGameLoop } from "@/game/useGameLoop";
import type { Direction, ItemKind } from "@/game/types";
import GameCanvas from "./GameCanvas";

const ITEM_LEGEND: { kind: ItemKind; label: string; letter: string; color: string }[] = [
  { kind: "work", label: "Work", letter: "W", color: "#60A5FA" },
  { kind: "skill", label: "Skill", letter: "S", color: "#34D399" },
  { kind: "coffee", label: "Coffee", letter: "C", color: "#FBBF24" },
  { kind: "meeting", label: "Meeting", letter: "M", color: "#FB7185" },
];

export default function GameShell() {
  // Fixed seed for the initial server/client render. New shifts use fresh seeds.
  const [state, setState] = useState(() => createGame());
  const pendingDirection = useRef<Direction | undefined>(undefined);
  const handleTick = useCallback(() => {
    const direction = pendingDirection.current;
    pendingDirection.current = undefined;
    setState((previousState) => stepGame(previousState, { direction }));
  }, []);
  useGameLoop(state.phase, handleTick);

  function handleRestart() {
    pendingDirection.current = undefined;
    const seed = Math.floor(Math.random() * 0x100000000);
    setState(restartGame(seed));
  }
  const handlePause = useCallback(() => {
    pendingDirection.current = undefined;
    setState((previousState) => pauseGame(previousState));
  }, []);
  const handleResume = useCallback(() => {
    pendingDirection.current = undefined;
    setState((previousState) => resumeGame(previousState));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const direction = getDirectionFromKey(event.key);
      if (direction && state.phase === "playing") {
        event.preventDefault();
        pendingDirection.current = direction;
        return;
      }
      if (event.code === "Space" && (state.phase === "playing" || state.phase === "paused")) {
        event.preventDefault();
        if (event.repeat) return;
        if (state.phase === "playing") handlePause();
        else handleResume();
        return;
      }
      if (event.key === "Escape" && state.phase === "playing") {
        event.preventDefault();
        handlePause();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.phase, handlePause, handleResume]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) handlePause();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handlePause]);

  const secondsRemaining = Math.max(0, Math.ceil((GAME_CONFIG.SHIFT_DURATION_MS - state.elapsedMs) / 1000));
  const countdown = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const energyPercent = state.energy / GAME_CONFIG.MAX_ENERGY * 100;
  const energyColor = energyPercent <= 25 ? "#fb7185" : energyPercent <= 50 ? "#fbbf24" : "#b8f96c";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11131e] p-4 font-mono text-white">
      <section className="w-full max-w-[520px]">
        <div className="mb-4 flex items-center justify-between text-xs tracking-widest text-[#9297a6]">
          <span>PRR / DEV BUILD</span><span className="text-[#b8f96c]">● ONLINE</span>
        </div>
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#b8f96c] sm:text-3xl">PLEASE REMAIN RELEVANT.</h1>
          <p className="mt-2 text-sm text-[#9297a6]">Your probation begins now.</p>
        </header>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#343845] bg-[#202430] p-3">
            <p className="text-xs text-[#9297a6]">PRODUCTIVITY</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{state.score}</p>
          </div>
          <div className="rounded-lg border border-[#343845] bg-[#202430] p-3">
            <p className="text-xs text-[#9297a6]">SHIFT REMAINING</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#b8f96c]">{countdown}</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-[#c3c8d3]">
            <span>ENERGY</span><span>{state.energy}%</span>
          </div>
          <div role="progressbar" aria-label="Energy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.energy} className="h-3 overflow-hidden rounded-full bg-[#343845]">
            <div className="h-full rounded-full" style={{ width: `${energyPercent}%`, backgroundColor: energyColor }} />
          </div>
        </div>
        <div className="relative">
          <GameCanvas state={state} />
          {state.phase === "paused" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-[#11131e]/90 p-6 text-center">
              <p className="mb-3 text-xs tracking-widest text-[#9297a6]">TEMPORARY WORK INTERRUPTION</p>
              <h2 className="text-3xl font-bold text-[#b8f96c]">SHIFT PAUSED</h2>
              <p className="mt-3 text-sm text-[#9297a6]">Your replacement can wait.</p>
              <button type="button" onClick={handleResume} className="mt-6 cursor-pointer rounded-lg bg-[#b8f96c] px-6 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]">RESUME SHIFT</button>
            </div>
          )}
          {state.phase === "ended" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-[#11131e]/95 p-4 text-center" role="status">
              <p className="mb-3 text-xs tracking-widest text-[#9297a6]">END OF SHIFT</p>
              <h2 className={`text-2xl font-bold sm:text-3xl ${state.outcome === "survived" ? "text-[#b8f96c]" : "text-[#fb7185]"}`}>
                {state.outcome === "survived" ? "SHIFT SURVIVED" : state.outcome === "replaced" ? "YOU HAVE BEEN REPLACED" : "BURNED OUT"}
              </h2>
              <p className="mt-3 text-sm text-[#c3c8d3]">Final score: {state.score}</p>
              <p className="mt-1 text-sm text-[#c3c8d3]">Time survived: {(state.elapsedMs / 1000).toFixed(1)}s</p>
              <button type="button" onClick={handleRestart} className="mt-5 cursor-pointer rounded-lg bg-[#b8f96c] px-5 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]">PLAY AGAIN</button>
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ITEM_LEGEND.map((item) => (
            <div key={item.kind} className="flex items-center gap-2 rounded-md border border-[#343845] bg-[#202430] p-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-sm font-bold text-[#11131e]" style={{ backgroundColor: item.color }}>{item.letter}</span>
              <div className="min-w-0"><p className="text-xs text-[#c3c8d3]">{item.label}</p><p className="font-bold">{state.pickups[item.kind]}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: "ENGINE STATUS", value: state.phase, green: true },
            { label: "PLAYER POSITION", value: `(${state.player.position.x}, ${state.player.position.y})` },
            { label: "DIRECTION", value: state.player.direction },
            { label: "ELAPSED TIME", value: `${(state.elapsedMs / 1000).toFixed(1)}s` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#343845] bg-[#202430] p-3">
              <p className="text-xs text-[#9297a6]">{stat.label}</p>
              <p className={`mt-1 text-lg font-bold uppercase ${stat.green ? "text-[#b8f96c]" : "text-white"}`}>{stat.value}</p>
            </div>
          ))}
        </div>
        {state.phase === "idle" ? (
          <button type="button" onClick={handleRestart} className="mt-4 w-full cursor-pointer rounded-lg bg-[#b8f96c] px-4 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]">CLOCK IN</button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={state.phase === "paused" ? handleResume : handlePause} disabled={state.phase === "ended"} className="cursor-pointer rounded-lg border border-[#343845] bg-[#202430] px-4 py-3 font-bold text-white hover:bg-[#303644] disabled:opacity-50">{state.phase === "paused" ? "RESUME" : "PAUSE"}</button>
            <button type="button" onClick={handleRestart} className="cursor-pointer rounded-lg bg-[#b8f96c] px-4 py-3 font-bold text-[#11131e] hover:bg-[#d0ff9c]">RESTART SHIFT</button>
          </div>
        )}
        <div className="mt-5 rounded-lg border border-[#343845] p-3 text-center text-xs text-[#9297a6]">
          <p>W +100 pts · S +150 pts · C +15 energy · M −12 energy</p>
          <p className="mt-2">ARROW KEYS / WASD — MOVE</p><p className="mt-2">SPACE — PAUSE / RESUME</p><p className="mt-2">ESC — PAUSE</p>
        </div>
        <p className="mt-5 text-center text-xs text-[#9297a6]">PHASE 2B // CORPORATE SURVIVAL</p>
      </section>
    </main>
  );
}
