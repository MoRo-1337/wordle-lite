import { pinyin } from 'pinyin-pro';

import { evaluateItems, splitCharacters } from './game.js';

export const TONE_MARKS = {
  0: '·',
  1: 'ˉ',
  2: 'ˊ',
  3: 'ˇ',
  4: 'ˋ',
};

export function getPinyinParts(word) {
  const characters = splitCharacters(word);
  const details = pinyin(word, {
    toneSandhi: false,
    toneType: 'none',
    type: 'all',
  });

  return characters.map((character, index) => {
    const detail = details[index];
    return {
      character,
      final: detail?.final ?? '',
      initial: detail?.initial ?? '',
      pinyin: detail?.pinyin ?? '',
      tone: String(detail?.num ?? 0),
    };
  });
}

export function evaluateChineseClues(guess, answer) {
  const guessParts = getPinyinParts(guess);
  const answerParts = getPinyinParts(answer);

  return {
    answerParts,
    characterStates: evaluateItems(
      guessParts.map((part) => part.character),
      answerParts.map((part) => part.character),
    ),
    finalStates: evaluateItems(
      guessParts.map((part) => part.final),
      answerParts.map((part) => part.final),
    ),
    guessParts,
    initialStates: evaluateItems(
      guessParts.map((part) => part.initial || '∅'),
      answerParts.map((part) => part.initial || '∅'),
    ),
    toneStates: evaluateItems(
      guessParts.map((part) => part.tone),
      answerParts.map((part) => part.tone),
    ),
  };
}
