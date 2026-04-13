export function selectWhiteLevel(fallback: number, linearMaxValues: number[]): number {
  const candidates = linearMaxValues.filter((value) => Number.isFinite(value) && value > 0);
  if (candidates.length === 0) {
    return fallback;
  }

  const preferred = Math.max(...candidates);
  return preferred > 0 && preferred <= fallback ? preferred : fallback;
}
