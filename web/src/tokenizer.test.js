import assert from "node:assert/strict";
import test from "node:test";
import { createBoard, playableTokens, shuffleTokens, tokenizePoem } from "./tokenizer.js";

test("tokenize splits han and punctuation, keeps line rows", () => {
  const { rows, answer } = tokenizePoem("床前明月光，\n疑是地上霜。");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].map((t) => t.char).join(""), "床前明月光，");
  assert.equal(rows[1].map((t) => t.char).join(""), "疑是地上霜。");
  assert.equal(answer.map((t) => t.char).join(""), "床前明月光，疑是地上霜。");
  assert.equal(answer.filter((t) => t.punct).map((t) => t.char).join(""), "，。");
});

test("tokenize omits spaces", () => {
  const { answer } = tokenizePoem("鹅 鹅 鹅");
  assert.equal(answer.map((t) => t.char).join(""), "鹅鹅鹅");
});

test("shuffle keeps the same characters", () => {
  const { answer } = tokenizePoem("白日依山尽");
  const shuffled = shuffleTokens(answer);
  assert.equal(shuffled.length, answer.length);
  const a = [...answer.map((t) => t.char)].sort().join("");
  const b = [...shuffled.map((t) => t.char)].sort().join("");
  assert.equal(a, b);
});

test("createBoard auto-fills punctuation and banks only han", () => {
  const { answer } = tokenizePoem("床前明月光，\n疑是地上霜。");
  const { slots, bank } = createBoard(answer);
  assert.equal(slots[5].char, "，");
  assert.equal(slots[5].punct, true);
  assert.equal(slots[11].char, "。");
  assert.equal(slots.filter((s) => s === null).length, 10);
  assert.equal(bank.length, 10);
  assert.equal(bank.every((t) => !t.punct), true);
  assert.equal(playableTokens(answer).length, 10);
});
