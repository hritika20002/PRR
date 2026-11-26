// Pure, reproducible 32-bit pseudo-random generator. No browser or clock dependency.
export function nextRandom(seed: number): { seed: number; value: number } {
  const nextSeed = (Math.imul(1664525, seed >>> 0) + 1013904223) >>> 0;
  return { seed: nextSeed, value: nextSeed / 0x100000000 };
}
