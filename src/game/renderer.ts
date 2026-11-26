import { GAME_CONFIG } from "./config";
import type { GameState } from "./types";

export const CELL_SIZE = 32;
export const CANVAS_SIZE =
  GAME_CONFIG.GRID_SIZE * CELL_SIZE;

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const { GRID_SIZE, COLORS } = GAME_CONFIG;

  // Clear the previous frame.
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw the background.
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw the grid.
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle =
        (x + y) % 2 === 0
          ? COLORS.grid
          : "#202430";

      ctx.fillRect(
        x * CELL_SIZE + 1,
        y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    }
  }

  // Draw the player.
  const playerX = state.player.position.x * CELL_SIZE;
  const playerY = state.player.position.y * CELL_SIZE;

  ctx.fillStyle = COLORS.player;

  ctx.fillRect(
    playerX + 4,
    playerY + 4,
    CELL_SIZE - 8,
    CELL_SIZE - 8
  );

  // Draw the player's face.
  ctx.fillStyle = COLORS.background;

  ctx.fillRect(playerX + 9, playerY + 10, 4, 4);
  ctx.fillRect(playerX + 19, playerY + 10, 4, 4);
  ctx.fillRect(playerX + 12, playerY + 21, 8, 3);
}