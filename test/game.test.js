import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateGuess,
  isAllowedGuess,
  isValidGuess,
  normalizeGuess,
  TILE_STATE,
  trimGuess,
} from '../src/game.js';
import { WORDS } from '../src/words.js';

test('marks exact and misplaced English letters', () => {
  assert.deepEqual(evaluateGuess('HEART', 'EARTH'), [
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
  ]);
});

test('does not overcount duplicate letters', () => {
  assert.deepEqual(evaluateGuess('APPLE', 'PEARL'), [
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
    TILE_STATE.ABSENT,
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
  ]);
});

test('handles duplicate Chinese characters with the same two-pass rule', () => {
  assert.deepEqual(evaluateGuess('明明白白', '明明白白'), [
    TILE_STATE.CORRECT,
    TILE_STATE.CORRECT,
    TILE_STATE.CORRECT,
    TILE_STATE.CORRECT,
  ]);
});

test('normalizes supported scripts and trims to each word length', () => {
  assert.equal(trimGuess('apple pie', 'en'), 'APPLE');
  assert.equal(normalizeGuess(' 春 暖 花 开 ', 'zh'), '春暖花开');
});

test('validates both word formats', () => {
  assert.equal(isValidGuess('海阔天空', 'zh'), true);
  assert.equal(isValidGuess('WORLD', 'en'), true);
  assert.equal(isValidGuess('FOUR', 'en'), false);
});

test('accepts only dictionary words for English guesses', () => {
  assert.equal(isValidGuess('ABCDE', 'en'), true);
  assert.equal(isAllowedGuess('APPLE', 'en'), true);
  assert.equal(isAllowedGuess('CRANE', 'en'), true);
  assert.equal(isAllowedGuess('ABCDE', 'en'), false);
  assert.equal(isAllowedGuess('ZZZZZ', 'en'), false);
});

test('keeps every answer pool valid and free of duplicates', () => {
  for (const [language, words] of Object.entries(WORDS)) {
    assert.equal(new Set(words).size, words.length, `${language} contains a duplicate answer`);
    words.forEach((word) => {
      assert.equal(isValidGuess(word, language), true, `${word} is invalid for ${language}`);
      assert.equal(isAllowedGuess(word, language), true, `${word} is not allowed for ${language}`);
    });
  }
});
