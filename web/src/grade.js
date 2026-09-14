export function isComplete(slots) {
  return slots.length > 0 && slots.every((s) => s !== null);
}

export function isCorrect(slots, answer) {
  if (slots.length !== answer.length) return false;
  return slots.every((slot, i) => slot && slot.char === answer[i].char);
}

export function placeNext(slots, bank, tokenId) {
  const empty = slots.findIndex((s) => s === null);
  if (empty < 0) return { slots, bank };
  const idx = bank.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { slots, bank };
  const nextSlots = [...slots];
  const nextBank = [...bank];
  const [token] = nextBank.splice(idx, 1);
  nextSlots[empty] = token;
  return { slots: nextSlots, bank: nextBank };
}

export function replaceSlot(slots, bank, slotIndex, tokenId) {
  const current = slots[slotIndex];
  if (!current || current.punct) return { slots, bank };
  const idx = bank.findIndex((t) => t.id === tokenId);
  if (idx < 0) return { slots, bank };
  const nextSlots = [...slots];
  const nextBank = [...bank];
  const [token] = nextBank.splice(idx, 1);
  nextSlots[slotIndex] = token;
  return { slots: nextSlots, bank: [...nextBank, current] };
}

export function removeSlot(slots, bank, slotIndex) {
  const token = slots[slotIndex];
  if (!token || token.punct) return { slots, bank };
  const nextSlots = [...slots];
  nextSlots[slotIndex] = null;
  const filledPlayable = [];
  for (const item of nextSlots) {
    if (item && !item.punct) filledPlayable.push(item);
  }
  let pi = 0;
  const compacted = nextSlots.map((item) => {
    if (item && item.punct) return item;
    if (pi < filledPlayable.length) return filledPlayable[pi++];
    return null;
  });
  return { slots: compacted, bank: [...bank, token] };
}
