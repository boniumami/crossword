const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_ROUND_SIZE, parseRoundSize } = require("./round");

test("missing query uses default 5", () => {
  assert.equal(parseRoundSize(undefined), DEFAULT_ROUND_SIZE);
});

test("parses query string count", () => {
  assert.equal(parseRoundSize("3"), 3);
  assert.equal(parseRoundSize(["8"]), 8);
});

test("invalid count is rejected", () => {
  assert.equal(parseRoundSize("0"), null);
  assert.equal(parseRoundSize("51"), null);
  assert.equal(parseRoundSize("2.5"), null);
});
