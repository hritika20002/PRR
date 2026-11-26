export const GAME_CONFIG = {
  GRID_SIZE: 15,

  TICK_MS: 100,
  PLAYER_MOVE_MS: 200,

  PLAYER_START: {
    x: 7,
    y: 7,
  },

  SHIFT_DURATION_MS: 60_000,

  COLORS: {
    background: "#11131E",
    grid: "#252936",
    player: "#B8F96C",
    rival: "#A78BFA",
    danger: "#FB7185",
    coffee: "#FBBF24",
  },
} as const;