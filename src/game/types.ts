export type Direction = "up" | "down" | "left" | "right";
export interface Position { x: number; y: number; }
export type GamePhase = "idle" | "playing" | "paused" | "ended";
export interface Player { position: Position; direction: Direction; }
export type ItemKind = "work" | "skill" | "coffee" | "meeting";
export interface ItemSlot {
  id: string;
  kind: ItemKind;
  position: Position | null;
  respawnAtTick: number | null;
}
export type PickupCounts = Record<ItemKind, number>;
export type GameOutcome = "survived" | "burned-out" | "replaced";
export interface GameState {
  phase: GamePhase;
  tick: number;
  elapsedMs: number;
  player: Player;
  items: ItemSlot[];
  pickups: PickupCounts;
  rngState: number;
  energy: number;
  score: number;
  outcome: GameOutcome | null;
}
export interface GameInput { direction?: Direction; }
