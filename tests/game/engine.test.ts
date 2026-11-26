import { describe, expect, it } from "vitest";
import {
  createGame,
  startGame,
  stepGame,
  pauseGame,
  resumeGame,
  restartGame,
} from "@/game/engine";

describe("Game engine", () => {
  it("initializes the game correctly", () => {
    const state = createGame();

    expect(state.phase).toBe("idle");
    expect(state.tick).toBe(0);
    expect(state.elapsedMs).toBe(0);
    expect(state.player.position).toEqual({ x: 7, y: 7 });
    expect(state.player.direction).toBe("right");
  });

  it("starts the game", () => {
    const state = startGame(createGame());

    expect(state.phase).toBe("playing");
  });

  it("does not advance while idle", () => {
    const state = createGame();

    expect(stepGame(state)).toEqual(state);
  });

  it("advances time by 100ms per tick", () => {
    const state = stepGame(startGame(createGame()));

    expect(state.tick).toBe(1);
    expect(state.elapsedMs).toBe(100);
  });

  it("does not move before the movement interval", () => {
    const state = stepGame(startGame(createGame()));

    expect(state.player.position).toEqual({ x: 7, y: 7 });
  });

  it("moves the player every second tick", () => {
    let state = startGame(createGame());

    state = stepGame(state);
    state = stepGame(state);

    expect(state.player.position).toEqual({ x: 8, y: 7 });
  });

  it("accepts and remembers a direction change", () => {
    let state = startGame(createGame());

    state = stepGame(state, { direction: "up" });
    state = stepGame(state);

    expect(state.player.direction).toBe("up");
    expect(state.player.position).toEqual({ x: 7, y: 6 });
  });

  it("pauses the game without advancing time", () => {
    const state = pauseGame(startGame(createGame()));

    expect(state.phase).toBe("paused");
    expect(stepGame(state)).toEqual(state);
  });

  it("resumes a paused game", () => {
    let state = startGame(createGame());

    state = stepGame(state);
    state = pauseGame(state);
    state = resumeGame(state);
    state = stepGame(state);

    expect(state.phase).toBe("playing");
    expect(state.elapsedMs).toBe(200);
  });

  it("restarts with a fresh playing state", () => {
    let state = startGame(createGame());

    state = stepGame(state);
    state = stepGame(state);
    state = pauseGame(state);
    state = restartGame();

    expect(state).toEqual(startGame(createGame()));
  });

  it("does not mutate the previous state", () => {
    const original = startGame(createGame());
    const snapshot = structuredClone(original);

    stepGame(original, { direction: "down" });

    expect(original).toEqual(snapshot);
  });

  it("never moves outside the board", () => {
    let state = startGame(createGame());

    for (let i = 0; i < 100; i++) {
      state = stepGame(state);
    }

    expect(state.player.position).toEqual({ x: 14, y: 7 });
  });
});