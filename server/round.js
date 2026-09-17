const DEFAULT_ROUND_SIZE = 5;
const MIN_ROUND_SIZE = 1;
const MAX_ROUND_SIZE = 50;

function parseRoundSize(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return DEFAULT_ROUND_SIZE;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < MIN_ROUND_SIZE || n > MAX_ROUND_SIZE) return null;
  return n;
}

module.exports = {
  DEFAULT_ROUND_SIZE,
  MIN_ROUND_SIZE,
  MAX_ROUND_SIZE,
  parseRoundSize,
};
