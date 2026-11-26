export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
}

export type GamePhase =
  | "idle"
  | "playing"
  | "paused"
  | "ended";

export interface Player {
  position: Position;
  direction: Direction;
}

export interface GameState {
  phase: GamePhase;
  tick: number;
  elapsedMs: number;
  player: Player;
}

export interface GameInput {
  direction?: Direction;
}