import test from 'node:test';
import assert from 'node:assert/strict';

import { TILE_STATE } from '../src/game.js';
import { evaluateChineseClues, getPinyinParts } from '../src/pinyin-clues.js';

test('splits contextual pinyin into initial, final, and tone', () => {
  assert.deepEqual(
    getPinyinParts('巧夺天工').map(({ initial, final, tone }) => ({ initial, final, tone })),
    [
      { initial: 'q', final: 'iao', tone: '3' },
      { initial: 'd', final: 'uo', tone: '2' },
      { initial: 't', final: 'ian', tone: '1' },
      { initial: 'g', final: 'ong', tone: '1' },
    ],
  );
});

test('scores Chinese characters and pinyin components independently', () => {
  const clues = evaluateChineseClues('巧夺天工', '乔装打扮');

  assert.deepEqual(clues.characterStates, [
    TILE_STATE.ABSENT,
    TILE_STATE.ABSENT,
    TILE_STATE.ABSENT,
    TILE_STATE.ABSENT,
  ]);
  assert.deepEqual(clues.initialStates, [
    TILE_STATE.CORRECT,
    TILE_STATE.PRESENT,
    TILE_STATE.ABSENT,
    TILE_STATE.ABSENT,
  ]);
  assert.deepEqual(clues.finalStates, [
    TILE_STATE.CORRECT,
    TILE_STATE.ABSENT,
    TILE_STATE.ABSENT,
    TILE_STATE.ABSENT,
  ]);
  assert.deepEqual(clues.toneStates, [
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
    TILE_STATE.PRESENT,
    TILE_STATE.ABSENT,
  ]);
});
