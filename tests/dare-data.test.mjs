import assert from "node:assert/strict";
import { CATEGORIES, CATEGORY_KEYS, DARES, daresFor, shuffle } from "../dares.js";

const normalized = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

assert.ok(DARES.length >= 100, `expected at least 100 dares, found ${DARES.length}`);

const ids = new Set();
const texts = new Set();
for (const dare of DARES) {
  assert.ok(!ids.has(dare.id), `duplicate dare id: ${dare.id}`);
  ids.add(dare.id);
  const key = normalized(dare.text);
  assert.ok(!texts.has(key), `duplicate dare text: ${dare.id}`);
  texts.add(key);
  assert.ok(CATEGORIES[dare.cat], `unknown category on ${dare.id}`);
  assert.ok([1, 2, 3].includes(dare.lvl), `invalid level on ${dare.id}`);
  assert.ok(Number.isInteger(dare.secs) && dare.secs >= 0 && dare.secs <= 120, `invalid timer on ${dare.id}`);
  assert.ok((dare.min || 1) >= 1 && (dare.min || 1) <= 8, `invalid minimum players on ${dare.id}`);
  assert.ok(dare.text.length >= 18, `dare text is too short: ${dare.id}`);
}

for (const key of CATEGORY_KEYS) {
  const count = DARES.filter((dare) => dare.cat === key).length;
  assert.ok(count >= 8, `category ${key} needs at least 8 dares, found ${count}`);
}

for (const level of [1, 2, 3]) {
  const count = DARES.filter((dare) => dare.lvl === level).length;
  assert.ok(count >= 10, `level ${level} needs at least 10 dares, found ${count}`);
}

const soloDeck = daresFor({ categories: CATEGORY_KEYS, maxLevel: 3, playerCount: 1 });
assert.ok(soloDeck.length >= 100, `solo deck should exceed 100 dares, found ${soloDeck.length}`);
assert.ok(soloDeck.every((dare) => (dare.min || 1) <= 1), "solo deck contains a group-only dare");

for (const maxLevel of [1, 2, 3]) {
  const filtered = daresFor({ categories: ["ice", "clip"], maxLevel, playerCount: 2 });
  assert.ok(filtered.length > 0, `level ${maxLevel} filter returned an empty deck`);
  assert.ok(filtered.every((dare) => dare.cat === "ice" || dare.cat === "clip"), "category filter leaked");
  assert.ok(filtered.every((dare) => dare.lvl <= maxLevel), "level filter leaked");
}

const groupDeck = daresFor({ categories: CATEGORY_KEYS, maxLevel: 3, playerCount: 4 });
assert.ok(groupDeck.length > soloDeck.length, "group deck should include group-only dares");

const shuffled = shuffle(DARES);
assert.equal(new Set(shuffled.map((dare) => dare.id)).size, DARES.length, "shuffle introduced duplicates");
assert.equal(DARES[0].id, "ice-01", "shuffle should not mutate the source deck");

const drawn = [];
const deck = shuffle(soloDeck);
while (deck.length) drawn.push(deck.pop());
assert.equal(new Set(drawn.map((dare) => dare.id)).size, drawn.length, "drawing produced a repeat");

console.log(`Dare data OK — ${DARES.length} unique dares, ${soloDeck.length} solo-friendly, ${groupDeck.length} group-ready.`);
