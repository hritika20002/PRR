import { GAME_CONFIG } from "./config";
import type { GameState, ItemKind } from "./types";

export const CELL_SIZE = 32;
export const CANVAS_SIZE = GAME_CONFIG.GRID_SIZE * CELL_SIZE;
const ITEM_STYLE: Record<ItemKind, { color: string; label: string }> = {
  work: { color: GAME_CONFIG.COLORS.work, label: "W" },
  skill: { color: GAME_CONFIG.COLORS.skill, label: "S" },
  coffee: { color: GAME_CONFIG.COLORS.coffee, label: "C" },
  meeting: { color: GAME_CONFIG.COLORS.danger, label: "M" },
};

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { GRID_SIZE, COLORS } = GAME_CONFIG;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.grid : "#202430";
      ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  }
  ctx.save();
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const item of state.items) {
    if (!item.position) continue;
    const x = item.position.x * CELL_SIZE;
    const y = item.position.y * CELL_SIZE;
    const style = ITEM_STYLE[item.kind];
    ctx.fillStyle = style.color;
    ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    ctx.fillStyle = COLORS.background;
    ctx.fillText(style.label, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
  }
  ctx.restore();
  const playerX = state.player.position.x * CELL_SIZE;
  const playerY = state.player.position.y * CELL_SIZE;
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(playerX + 4, playerY + 4, CELL_SIZE - 8, CELL_SIZE - 8);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(playerX + 9, playerY + 10, 4, 4);
  ctx.fillRect(playerX + 19, playerY + 10, 4, 4);
  ctx.fillRect(playerX + 12, playerY + 21, 8, 3);
}
