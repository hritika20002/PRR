import { GAME_CONFIG } from "@/game/config";
import type { GameState } from "@/game/types";

export default function GameHUD({ state }: { state: GameState }) {
  const secondsRemaining = Math.max(0, Math.ceil((GAME_CONFIG.SHIFT_DURATION_MS - state.elapsedMs) / 1000));
  const countdown = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const energyPercent = state.energy / GAME_CONFIG.MAX_ENERGY * 100;
  const energyColor = energyPercent <= 25 ? "#fb7185" : energyPercent <= 50 ? "#fbbf24" : "#b8f96c";

  return (
    <>
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
        <div className="mb-3 rounded-lg border border-[#343845] bg-[#202430] p-2">
          <div className="mb-1 flex justify-between text-xs text-[#c3c8d3]">
            <span>AUTOMATION THREAT</span><span className="font-bold text-[#a78bfa]">LEVEL {state.rival.level}/5</span>
          </div>
          <div className="flex gap-1" role="meter" aria-label="Automation threat" aria-valuemin={0} aria-valuemax={5} aria-valuenow={state.rival.level}>
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-2 flex-1 rounded-sm" style={{ backgroundColor: i < state.rival.level ? "#a78bfa" : "#343845" }} />)}
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
    </>
  );
}
