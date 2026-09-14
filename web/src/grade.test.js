import assert from "node:assert/strict";
import test from "node:test";
import { isComplete, isCorrect, placeNext, removeSlot, replaceSlot } from "./grade.js";
import { createBoard, tokenizePoem } from "./tokenizer.js";

const answer = [
  { id: "t0", char: "床", punct: false },
  { id: "t1", char: "前", punct: false },
  { id: "t2", char: "明", punct: false },
];

test("place then grade correct", () => {
  let slots = [null, null, null];
  let bank = [...answer];
  ({ slots, bank } = placeNext(slots, bank, "t0"));
  ({ slots, bank } = placeNext(slots, bank, "t1"));
  ({ slots, bank } = placeNext(slots, bank, "t2"));
  assert.equal(bank.length, 0);
  assert.equal(isComplete(slots), true);
  assert.equal(isCorrect(slots, answer), true);
});

test("wrong order fails", () => {
  let slots = [null, null, null];
  let bank = [...answer];
  ({ slots, bank } = placeNext(slots, bank, "t2"));
  ({ slots, bank } = placeNext(slots, bank, "t1"));
  ({ slots, bank } = placeNext(slots, bank, "t0"));
  assert.equal(isCorrect(slots, answer), false);
});

test("remove slot returns token and compact", () => {
  let slots = [...answer];
  let bank = [];
  ({ slots, bank } = removeSlot(slots, bank, 1));
  assert.equal(slots[0].char, "床");
  assert.equal(slots[1].char, "明");
  assert.equal(slots[2], null);
  assert.equal(bank[0].char, "前");
});

test("punctuation stays locked while chars compact", () => {
  const { answer: poem } = tokenizePoem("床前，月光。");
  let { slots, bank } = createBoard(poem);
  const idOf = (ch) => poem.find((t) => t.char === ch && !t.punct).id;
  ({ slots, bank } = placeNext(slots, bank, idOf("床")));
  ({ slots, bank } = placeNext(slots, bank, idOf("前")));
  ({ slots, bank } = placeNext(slots, bank, idOf("月")));
  assert.equal(slots.map((s) => (s ? s.char : "_")).join(""), "床前，月_。");
  ({ slots, bank } = removeSlot(slots, bank, 1));
  assert.equal(slots.map((s) => (s ? s.char : "_")).join(""), "床月，__。");
  assert.equal(slots[2].punct, true);
  assert.equal(slots[5].punct, true);
  assert.equal(bank.some((t) => t.char === "前"), true);
});

test("replace selected slot keeps others in place", () => {
  const { answer: poem } = tokenizePoem("床前，月光。");
  let { slots, bank } = createBoard(poem);
  const idOf = (ch) => poem.find((t) => t.char === ch && !t.punct).id;
  ({ slots, bank } = placeNext(slots, bank, idOf("床")));
  ({ slots, bank } = placeNext(slots, bank, idOf("前")));
  ({ slots, bank } = placeNext(slots, bank, idOf("月")));
  ({ slots, bank } = replaceSlot(slots, bank, 1, idOf("光")));
  assert.equal(slots.map((s) => (s ? s.char : "_")).join(""), "床光，月_。");
  assert.equal(bank.some((t) => t.char === "前"), true);
  assert.equal(bank.some((t) => t.char === "光"), false);
});

test("cannot remove auto punctuation", () => {
  const { answer: poem } = tokenizePoem("鹅，鹅。");
  const board = createBoard(poem);
  const before = board.slots.map((s) => (s ? s.char : "_")).join("");
  const next = removeSlot(board.slots, board.bank, 1);
  assert.equal(next.slots.map((s) => (s ? s.char : "_")).join(""), before);
});
