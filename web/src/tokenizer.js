const PUNCT = "，。、；：？！“”‘’（）《》【】—…·,.;:?!\"'()[]{}-";

export function isPunct(ch) {
  return PUNCT.includes(ch);
}

export function tokenizePoem(body) {
  const text = String(body || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  const answer = [];
  let tokenIndex = 0;
  for (const line of text.split("\n")) {
    const row = [];
    for (const ch of line) {
      if (ch === " " || ch === "\t" || ch === "\u3000") continue;
      const token = { id: `t${tokenIndex}`, char: ch, punct: isPunct(ch) };
      tokenIndex += 1;
      row.push(token);
      answer.push(token);
    }
    if (row.length > 0) rows.push(row);
  }
  return { rows, answer };
}

export function playableTokens(tokens) {
  return tokens.filter((t) => !t.punct).map((t) => ({ ...t }));
}

export function shuffleTokens(tokens) {
  const arr = tokens.map((t) => ({ ...t }));
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.length > 1 && arr.every((t, i) => t.id === tokens[i].id)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export function createBoard(answer) {
  return {
    slots: answer.map((t) => (t.punct ? { ...t } : null)),
    bank: shuffleTokens(playableTokens(answer)),
  };
}
