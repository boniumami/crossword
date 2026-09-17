import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ROUND_SIZE, MAX_ROUND_SIZE, MIN_ROUND_SIZE, clampRoundSize, parseRoundSize } from "./roundSize.js";

test("empty value falls back to default of 5", () => {
  assert.equal(parseRoundSize(""), DEFAULT_ROUND_SIZE);
  assert.equal(parseRoundSize(undefined), DEFAULT_ROUND_SIZE);
  assert.equal(parseRoundSize(null), DEFAULT_ROUND_SIZE);
});

test("accepts integers within 1 to 50", () => {
  assert.equal(parseRoundSize(1), MIN_ROUND_SIZE);
  assert.equal(parseRoundSize("5"), 5);
  assert.equal(parseRoundSize(50), MAX_ROUND_SIZE);
});

test("rejects out of range or non-integers", () => {
  assert.equal(parseRoundSize(0), null);
  assert.equal(parseRoundSize(51), null);
  assert.equal(parseRoundSize(5.5), null);
  assert.equal(parseRoundSize("abc"), null);
});

test("clamp uses poem count as upper bound", () => {
  assert.equal(clampRoundSize(5, 3), 3);
  assert.equal(clampRoundSize(1, 8), 1);
  assert.equal(clampRoundSize(9, 8), 8);
});

test("clamp keeps requested size when poem count is higher", () => {
  assert.equal(clampRoundSize(5, 20), 5);
});
