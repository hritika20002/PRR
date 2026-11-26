export const GAME_CONFIG = {
  GRID_SIZE: 15,
  TICK_MS: 100,
  PLAYER_MOVE_MS: 200,
  PLAYER_START: { x: 7, y: 7 },
  SHIFT_DURATION_MS: 60_000,
  ITEM_RESPAWN_MS: {
    work: 0,
    skill: 5_000,
    coffee: 8_000,
    meeting: 4_000,
  },
  COLORS: {
    background: "#11131E",
    grid: "#252936",
    player: "#B8F96C",
    rival: "#A78BFA",
    danger: "#FB7185",
    coffee: "#FBBF24",
    work: "#60A5FA",
    skill: "#34D399",
  },
} as const;
