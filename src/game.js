import { LANGUAGE_CONFIG } from './words.js';
import { words as ENGLISH_WORDS } from './english-words.js';

const ENGLISH_WORD_SET = new Set(ENGLISH_WORDS);

export const TILE_STATE = {
  CORRECT: 'correct',
  PRESENT: 'present',
  ABSENT: 'absent',
};

export function splitCharacters(value) {
  return Array.from(value.normalize('NFC'));
}

export function normalizeGuess(value, language) {
  const compact = value.normalize('NFC').replace(/\s+/gu, '');

  if (language === 'en') {
    return compact.replace(/[^a-z]/giu, '').toUpperCase();
  }

  if (language === 'zh') {
    return splitCharacters(compact)
      .filter((character) => /[\u3400-\u9fff]/u.test(character))
      .join('');
  }

  return '';
}

export function trimGuess(value, language) {
  const maximumLength = LANGUAGE_CONFIG[language].length;
  return splitCharacters(normalizeGuess(value, language)).slice(0, maximumLength).join('');
}

export function isValidGuess(value, language) {
  return LANGUAGE_CONFIG[language].pattern.test(value.normalize('NFC'));
}

export function isAllowedGuess(value, language) {
  const normalized = value.normalize('NFC');
  if (!isValidGuess(normalized, language)) {
    return false;
  }

  return language !== 'en' || ENGLISH_WORD_SET.has(normalized.toLowerCase());
}

export function evaluateGuess(guess, answer) {
  const guessCharacters = splitCharacters(guess);
  const answerCharacters = splitCharacters(answer);
  return evaluateItems(guessCharacters, answerCharacters);
}

export function evaluateItems(guessItems, answerItems) {
  const result = Array(guessItems.length).fill(TILE_STATE.ABSENT);
  const remaining = new Map();

  guessItems.forEach((item, index) => {
    if (item === answerItems[index]) {
      result[index] = TILE_STATE.CORRECT;
      return;
    }

    const answerItem = answerItems[index];
    remaining.set(answerItem, (remaining.get(answerItem) ?? 0) + 1);
  });

  guessItems.forEach((item, index) => {
    if (result[index] === TILE_STATE.CORRECT) {
      return;
    }

    const available = remaining.get(item) ?? 0;
    if (available > 0) {
      result[index] = TILE_STATE.PRESENT;
      remaining.set(item, available - 1);
    }
  });

  return result;
}

export function mergeKeyState(currentState, nextState) {
  const priority = {
    [TILE_STATE.ABSENT]: 1,
    [TILE_STATE.PRESENT]: 2,
    [TILE_STATE.CORRECT]: 3,
  };

  if (!currentState || priority[nextState] > priority[currentState]) {
    return nextState;
  }

  return currentState;
}
