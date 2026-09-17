export const DEFAULT_ROUND_SIZE = 5;
export const MIN_ROUND_SIZE = 1;
export const MAX_ROUND_SIZE = 50;

export function parseRoundSize(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return DEFAULT_ROUND_SIZE;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < MIN_ROUND_SIZE || n > MAX_ROUND_SIZE) return null;
  return n;
}

export function clampRoundSize(value, poemCount) {
  const parsed = parseRoundSize(value);
  const n = parsed ?? DEFAULT_ROUND_SIZE;
  const available = Number.isInteger(poemCount) ? poemCount : 0;
  if (available < MIN_ROUND_SIZE) return Math.min(Math.max(n, MIN_ROUND_SIZE), MAX_ROUND_SIZE);
  return Math.min(Math.max(n, MIN_ROUND_SIZE), Math.min(MAX_ROUND_SIZE, available));
}
