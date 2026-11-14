import {
  BarChart3,
  CircleHelp,
  CornerDownLeft,
  createIcons,
  Delete,
  RotateCcw,
  Share2,
  X,
} from 'lucide';

import './styles.css';
import { COPY } from './i18n.js';
import {
  evaluateGuess,
  isAllowedGuess,
  isValidGuess,
  mergeKeyState,
  normalizeGuess,
  splitCharacters,
  TILE_STATE,
  trimGuess,
} from './game.js';
import { evaluateChineseClues, TONE_MARKS } from './pinyin-clues.js';
import { LANGUAGE_CONFIG, WORDS } from './words.js';

const STORAGE_PREFIX = 'lexi-wordle:v1';
const ICONS = {
  BarChart3,
  CircleHelp,
  CornerDownLeft,
  Delete,
  RotateCcw,
  Share2,
  X,
};

const ENGLISH_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
];

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="#game" aria-label="Wordle">
        <img class="brand-mark" src="${import.meta.env.BASE_URL}wordle-mark.svg" alt="" width="48" height="48" />
        <span class="brand-copy">
          <strong>Wordle</strong>
          <span id="editionLabel"></span>
        </span>
      </a>
      <div class="header-actions" aria-label="Game actions">
        <button class="icon-button tooltip" id="statsButton" type="button">
          <i data-lucide="bar-chart-3"></i>
        </button>
        <button class="icon-button tooltip" id="rulesButton" type="button">
          <i data-lucide="circle-help"></i>
        </button>
        <button class="icon-button tooltip" id="newRoundButton" type="button">
          <i data-lucide="rotate-ccw"></i>
        </button>
      </div>
    </div>
  </header>

  <main class="workspace" id="game">
    <section class="game-stage" aria-labelledby="gameTitle">
      <div class="stage-toolbar">
        <div class="language-switch" role="tablist" aria-label="Language">
          ${Object.entries(LANGUAGE_CONFIG)
            .map(
              ([key, config]) => `
                <button type="button" role="tab" data-language="${key}">
                  <span class="language-long">${config.label}</span>
                  <span class="language-short">${config.shortLabel}</span>
                </button>
              `,
            )
            .join('')}
        </div>
        <div class="round-meta">
          <span id="roundLabel"></span>
          <span aria-hidden="true">·</span>
          <span id="attemptLabel"></span>
        </div>
      </div>

      <div class="game-heading">
        <h1 id="gameTitle"></h1>
        <p id="gameSubtitle"></p>
      </div>

      <div class="board-wrap">
        <div class="board" id="board" role="grid"></div>
      </div>

      <div class="result-band" id="resultBand" hidden>
        <div>
          <p class="result-title" id="resultTitle"></p>
          <p class="result-copy" id="resultCopy"></p>
        </div>
        <button class="command-button" id="shareButton" type="button">
          <i data-lucide="share-2"></i>
          <span id="shareLabel"></span>
        </button>
      </div>

      <form class="guess-form" id="guessForm" autocomplete="off">
        <label class="sr-only" id="guessInputLabel" for="guessInput"></label>
        <div class="input-frame" id="inputFrame">
          <input
            id="guessInput"
            type="text"
            enterkeyhint="done"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="submit-button tooltip" id="submitButton" type="submit">
            <i data-lucide="corner-down-left"></i>
          </button>
        </div>
      </form>

      <div class="keyboard" id="keyboard"></div>
      <div class="sr-only" id="statusAnnouncer" aria-live="polite"></div>
    </section>

    <aside class="rules-panel" id="rulesPanel" aria-labelledby="rulesTitle"></aside>
  </main>

  <footer class="site-footer">
    <span>Wordle</span>
    <span id="footerLabel"></span>
  </footer>

  <dialog class="modal" id="statsDialog">
    <div class="modal-header">
      <h2 id="statsTitle"></h2>
      <button class="icon-button tooltip" type="button" data-close-dialog="statsDialog">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div id="statsContent"></div>
  </dialog>

  <dialog class="modal modal-small" id="confirmDialog">
    <div class="modal-header">
      <h2 id="confirmTitle"></h2>
      <button class="icon-button tooltip" type="button" data-close-dialog="confirmDialog">
        <i data-lucide="x"></i>
      </button>
    </div>
    <p class="modal-copy" id="confirmBody"></p>
    <div class="modal-actions">
      <button class="secondary-button" id="cancelNewRound" type="button"></button>
      <button class="primary-button" id="confirmNewRound" type="button"></button>
    </div>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="confetti-layer" id="confettiLayer" aria-hidden="true"></div>
`;

const elements = {
  attemptLabel: document.querySelector('#attemptLabel'),
  board: document.querySelector('#board'),
  cancelNewRound: document.querySelector('#cancelNewRound'),
  confirmBody: document.querySelector('#confirmBody'),
  confirmDialog: document.querySelector('#confirmDialog'),
  confirmNewRound: document.querySelector('#confirmNewRound'),
  confirmTitle: document.querySelector('#confirmTitle'),
  editionLabel: document.querySelector('#editionLabel'),
  footerLabel: document.querySelector('#footerLabel'),
  gameSubtitle: document.querySelector('#gameSubtitle'),
  gameTitle: document.querySelector('#gameTitle'),
  guessForm: document.querySelector('#guessForm'),
  guessInput: document.querySelector('#guessInput'),
  guessInputLabel: document.querySelector('#guessInputLabel'),
  inputFrame: document.querySelector('#inputFrame'),
  keyboard: document.querySelector('#keyboard'),
  newRoundButton: document.querySelector('#newRoundButton'),
  resultBand: document.querySelector('#resultBand'),
  resultCopy: document.querySelector('#resultCopy'),
  resultTitle: document.querySelector('#resultTitle'),
  roundLabel: document.querySelector('#roundLabel'),
  rulesButton: document.querySelector('#rulesButton'),
  rulesPanel: document.querySelector('#rulesPanel'),
  shareButton: document.querySelector('#shareButton'),
  shareLabel: document.querySelector('#shareLabel'),
  statsButton: document.querySelector('#statsButton'),
  statsContent: document.querySelector('#statsContent'),
  statsDialog: document.querySelector('#statsDialog'),
  statsTitle: document.querySelector('#statsTitle'),
  statusAnnouncer: document.querySelector('#statusAnnouncer'),
  submitButton: document.querySelector('#submitButton'),
  toast: document.querySelector('#toast'),
  confettiLayer: document.querySelector('#confettiLayer'),
};

let currentLanguage = 'zh';
let currentRound = loadRound(currentLanguage);
let draft = '';
let isComposing = false;
let isRevealing = false;
let revealTimer;
let toastTimer;

function maximumAttempts(language = currentLanguage) {
  return LANGUAGE_CONFIG[language].attempts;
}

function storageKey(type, language) {
  return `${STORAGE_PREFIX}:${type}:${language}`;
}

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The game still works when storage is unavailable.
  }
}

function randomIndex(maximum) {
  if (window.crypto?.getRandomValues) {
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    return randomValue[0] % maximum;
  }
  return Math.floor(Math.random() * maximum);
}

function createRound(language, previousAnswer = '') {
  const choices = WORDS[language].filter((word) => word !== previousAnswer);
  const counterKey = storageKey('counter', language);
  const nextNumber = Number(readStorage(counterKey, 0)) + 1;
  writeStorage(counterKey, nextNumber);

  return {
    answer: choices[randomIndex(choices.length)],
    guesses: [],
    number: nextNumber,
    recorded: false,
    rulesVersion: language === 'zh' ? 2 : undefined,
    status: 'playing',
  };
}

function loadRound(language) {
  const attemptLimit = maximumAttempts(language);
  const stored = readStorage(storageKey('round', language), null);
  const isUsable =
    stored &&
    (language !== 'zh' || stored.rulesVersion === 2) &&
    WORDS[language].includes(stored.answer) &&
    Array.isArray(stored.guesses) &&
    stored.guesses.length <= attemptLimit &&
    stored.guesses.every((guess) => typeof guess === 'string' && isAllowedGuess(guess, language));

  if (!isUsable) {
    const freshRound = createRound(language);
    writeStorage(storageKey('round', language), freshRound);
    return freshRound;
  }

  const won = stored.guesses.includes(stored.answer);
  const status = won ? 'won' : stored.guesses.length >= attemptLimit ? 'lost' : 'playing';
  return {
    answer: stored.answer,
    guesses: stored.guesses,
    number: Number(stored.number) || 1,
    recorded: status === 'playing' ? false : Boolean(stored.recorded),
    rulesVersion: stored.rulesVersion,
    status,
  };
}

function saveRound() {
  writeStorage(storageKey('round', currentLanguage), currentRound);
}

function defaultStats(language) {
  return {
    bestStreak: 0,
    distribution: Array(maximumAttempts(language)).fill(0),
    played: 0,
    streak: 0,
    wins: 0,
  };
}

function loadStats(language) {
  const attemptLimit = maximumAttempts(language);
  const stored = readStorage(storageKey('stats', language), defaultStats(language));
  const distribution = Array.isArray(stored.distribution)
    ? Array.from({ length: attemptLimit }, (_, index) => Number(stored.distribution[index]) || 0)
    : Array(attemptLimit).fill(0);

  return {
    bestStreak: Number(stored.bestStreak) || 0,
    distribution,
    played: Number(stored.played) || 0,
    streak: Number(stored.streak) || 0,
    wins: Number(stored.wins) || 0,
  };
}

function recordResult() {
  if (currentRound.recorded || currentRound.status === 'playing') {
    return;
  }

  const stats = loadStats(currentLanguage);
  stats.played += 1;

  if (currentRound.status === 'won') {
    stats.wins += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
    stats.distribution[currentRound.guesses.length - 1] += 1;
  } else {
    stats.streak = 0;
  }

  currentRound.recorded = true;
  writeStorage(storageKey('stats', currentLanguage), stats);
}

function refreshIcons() {
  createIcons({
    attrs: {
      'aria-hidden': 'true',
      height: 19,
      strokeWidth: 2,
      width: 19,
    },
    icons: ICONS,
  });
}

function resultStateLabel(state) {
  const copy = COPY[currentLanguage];
  if (state === TILE_STATE.CORRECT) return copy.legend[0][0];
  if (state === TILE_STATE.PRESENT) return copy.legend[1][0];
  return copy.legend[2][0];
}

function appendChineseTileContent(tile, character, clue, columnIndex) {
  const characterElement = document.createElement('span');
  characterElement.className = 'hanzi-character';
  characterElement.textContent = character;

  if (clue) {
    const part = clue.guessParts[columnIndex];
    const pinyinLine = document.createElement('span');
    const initial = document.createElement('span');
    const final = document.createElement('span');
    const tone = document.createElement('span');

    tile.dataset.clue = 'true';
    pinyinLine.className = 'pinyin-line';
    pinyinLine.setAttribute('aria-hidden', 'true');
    initial.className = 'pinyin-part pinyin-initial';
    final.className = 'pinyin-part pinyin-final';
    tone.className = 'pinyin-part pinyin-tone';
    initial.dataset.state = clue.initialStates[columnIndex];
    final.dataset.state = clue.finalStates[columnIndex];
    tone.dataset.state = clue.toneStates[columnIndex];
    initial.textContent = part.initial;
    final.textContent = part.final;
    tone.textContent = TONE_MARKS[part.tone] ?? TONE_MARKS[0];
    pinyinLine.append(initial, final, tone);
    tile.append(pinyinLine);
  }

  tile.append(characterElement);
}

function renderBoard() {
  const config = LANGUAGE_CONFIG[currentLanguage];
  const copy = COPY[currentLanguage];
  elements.board.replaceChildren();
  elements.board.dataset.length = String(config.length);
  elements.board.style.setProperty('--columns', config.length);
  elements.board.setAttribute('aria-label', copy.title);

  for (let rowIndex = 0; rowIndex < config.attempts; rowIndex += 1) {
    const row = document.createElement('div');
    const submittedGuess = currentRound.guesses[rowIndex];
    const isDraftRow =
      rowIndex === currentRound.guesses.length && currentRound.status === 'playing' && !isRevealing;
    const characters = submittedGuess
      ? splitCharacters(submittedGuess)
      : isDraftRow
        ? splitCharacters(draft)
        : [];
    const chineseClue =
      submittedGuess && currentLanguage === 'zh'
        ? evaluateChineseClues(submittedGuess, currentRound.answer)
        : null;
    const evaluation = submittedGuess
      ? chineseClue?.characterStates ?? evaluateGuess(submittedGuess, currentRound.answer)
      : [];

    row.className = 'board-row';
    row.dataset.row = String(rowIndex);
    row.setAttribute('role', 'row');

    for (let columnIndex = 0; columnIndex < config.length; columnIndex += 1) {
      const tile = document.createElement('div');
      const character = characters[columnIndex] ?? '';
      const state = evaluation[columnIndex];
      tile.className = `tile ${config.fontClass}`;
      tile.setAttribute('role', 'gridcell');

      if (currentLanguage === 'zh') {
        tile.classList.add('hanzi-tile');
        appendChineseTileContent(tile, character, chineseClue, columnIndex);
      } else {
        tile.textContent = character;
      }

      if (character && !state) {
        tile.dataset.filled = 'true';
      }

      if (state) {
        tile.dataset.state = state;
        if (chineseClue) {
          const part = chineseClue.guessParts[columnIndex];
          tile.setAttribute(
            'aria-label',
            `${character}, ${part.initial}${part.final}, ${part.tone}声: ${resultStateLabel(state)}`,
          );
        } else {
          tile.setAttribute('aria-label', `${character}: ${resultStateLabel(state)}`);
        }
      } else {
        tile.setAttribute('aria-label', character || `${rowIndex + 1}, ${columnIndex + 1}`);
      }

      if (isRevealing && rowIndex === currentRound.guesses.length - 1) {
        tile.classList.add('reveal');
        tile.style.setProperty('--reveal-delay', `${columnIndex * 110}ms`);
      }

      row.append(tile);
    }

    elements.board.append(row);
  }
}

function keyStateMap() {
  const states = new Map();

  currentRound.guesses.forEach((guess) => {
    const characters = splitCharacters(guess);
    const evaluation = evaluateGuess(guess, currentRound.answer);
    characters.forEach((character, index) => {
      states.set(character, mergeKeyState(states.get(character), evaluation[index]));
    });
  });

  return states;
}

function keyboardButton(key, states) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'key';
  button.dataset.key = key;

  if (key === 'ENTER' || key === 'DELETE') {
    const copy = COPY[currentLanguage];
    const iconName = key === 'ENTER' ? 'corner-down-left' : 'delete';
    button.classList.add('key-action', 'tooltip');
    button.setAttribute('aria-label', key === 'ENTER' ? copy.submit : copy.delete);
    button.dataset.tooltip = key === 'ENTER' ? copy.submit : copy.delete;
    button.innerHTML = `<i data-lucide="${iconName}"></i>`;
  } else {
    button.textContent = key;
    button.setAttribute('aria-label', key);
    const state = states.get(key);
    if (state) button.dataset.state = state;
  }

  return button;
}

function renderKeyboard() {
  const copy = COPY[currentLanguage];
  elements.keyboard.replaceChildren();
  elements.keyboard.classList.toggle('is-hidden', currentLanguage === 'zh');
  elements.keyboard.setAttribute('aria-label', copy.keyboardLabel);

  if (currentLanguage === 'zh') {
    return;
  }

  const states = keyStateMap();
  ENGLISH_KEYS.forEach((keys) => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    keys.forEach((key) => row.append(keyboardButton(key, states)));
    elements.keyboard.append(row);
  });
}

function renderRules() {
  const copy = COPY[currentLanguage];
  const exampleStates = [TILE_STATE.CORRECT, TILE_STATE.PRESENT, TILE_STATE.ABSENT];
  let exampleTiles;

  if (currentLanguage === 'zh') {
    const exampleWord = copy.example.join('');
    const clues = evaluateChineseClues(exampleWord, '春暖花开');
    exampleTiles = clues.guessParts
      .map(
        (part, index) => `
          <span class="example-tile hanzi-example" data-state="${clues.characterStates[index]}">
            <span class="example-pinyin" aria-hidden="true">
              <span class="pinyin-part" data-state="${clues.initialStates[index]}">${part.initial}</span><span class="pinyin-part" data-state="${clues.finalStates[index]}">${part.final}</span><span class="pinyin-part pinyin-tone" data-state="${clues.toneStates[index]}">${TONE_MARKS[part.tone] ?? TONE_MARKS[0]}</span>
            </span>
            <strong>${part.character}</strong>
          </span>
        `,
      )
      .join('');
  } else {
    exampleTiles = copy.example
      .map(
        (character, index) => `
          <span class="example-tile" data-state="${exampleStates[Math.min(index, 2)]}">
            ${character}
          </span>
        `,
      )
      .join('');
  }

  const legend = copy.legend
    .map(
      ([title, description], index) => `
        <div class="legend-row">
          <span class="legend-swatch" data-state="${exampleStates[index]}" aria-hidden="true"></span>
          <div>
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        </div>
      `,
    )
    .join('');

  const clueAnatomy =
    currentLanguage === 'zh'
      ? `
        <div class="clue-anatomy" aria-label="拼音线索拆解">
          <div><strong>ch</strong><span>声母</span></div>
          <div><strong>un</strong><span>韵母</span></div>
          <div><strong>ˉ</strong><span>声调</span></div>
        </div>
      `
      : '';

  const formats = copy.formats
    .map(
      ([language, format]) => `
        <div class="format-row">
          <span>${language}</span>
          <strong>${format}</strong>
        </div>
      `,
    )
    .join('');

  elements.rulesPanel.innerHTML = `
    <div class="section-index" aria-hidden="true">01 / GUIDE</div>
    <h2 id="rulesTitle">${copy.rulesTitle}</h2>
    <p class="rules-intro">${copy.rulesIntro}</p>
    <div class="example-row" aria-label="Example">${exampleTiles}</div>
    ${clueAnatomy}
    <div class="legend-list">${legend}</div>
    <div class="format-section">
      <h3>${copy.formatTitle}</h3>
      ${formats}
    </div>
    <p class="rules-detail">${copy.detail}</p>
    <p class="local-note">${copy.localNote}</p>
  `;
}

function renderResult() {
  const copy = COPY[currentLanguage];
  const shouldShow = currentRound.status !== 'playing' && !isRevealing;
  elements.resultBand.hidden = !shouldShow;

  if (!shouldShow) {
    return;
  }

  if (currentRound.status === 'won') {
    elements.resultTitle.textContent = copy.winTitle;
    elements.resultCopy.textContent = copy.winBody(currentRound.guesses.length);
  } else {
    elements.resultTitle.textContent = copy.loseTitle;
    elements.resultCopy.textContent = `${copy.loseBody} “${currentRound.answer}”`;
  }

  elements.shareLabel.textContent = copy.share;
}

function renderStaticCopy() {
  const copy = COPY[currentLanguage];
  const config = LANGUAGE_CONFIG[currentLanguage];
  document.documentElement.lang = config.locale;
  document.title = copy.documentTitle;
  elements.editionLabel.textContent = copy.edition;
  elements.gameTitle.textContent = copy.title;
  elements.gameSubtitle.textContent = copy.subtitle;
  elements.roundLabel.textContent = copy.round(currentRound.number);
  elements.attemptLabel.textContent = copy.attempts(
    currentRound.guesses.length,
    config.attempts,
  );
  elements.guessInputLabel.textContent = copy.inputLabel;
  elements.guessInput.placeholder = copy.inputPlaceholder;
  elements.guessInput.setAttribute('aria-label', copy.inputLabel);
  elements.guessInput.inputMode = config.inputMode;
  elements.guessInput.value = draft;
  elements.guessInput.disabled = currentRound.status !== 'playing' || isRevealing;
  elements.submitButton.disabled = currentRound.status !== 'playing' || isRevealing;
  elements.submitButton.setAttribute('aria-label', copy.submit);
  elements.submitButton.dataset.tooltip = copy.submit;
  elements.inputFrame.dataset.disabled = String(currentRound.status !== 'playing' || isRevealing);

  elements.statsButton.setAttribute('aria-label', copy.statsOpen);
  elements.statsButton.dataset.tooltip = copy.statsOpen;
  elements.rulesButton.setAttribute('aria-label', copy.rulesJump);
  elements.rulesButton.dataset.tooltip = copy.rulesJump;
  elements.newRoundButton.setAttribute('aria-label', copy.newRound);
  elements.newRoundButton.dataset.tooltip = copy.newRound;
  elements.newRoundButton.disabled = isRevealing;
  elements.footerLabel.textContent = copy.footer;

  elements.confirmTitle.textContent = copy.confirmTitle;
  elements.confirmBody.textContent = copy.confirmBody;
  elements.cancelNewRound.textContent = copy.cancel;
  elements.confirmNewRound.textContent = copy.confirm;

  document.querySelectorAll('[data-language]').forEach((button) => {
    const selected = button.dataset.language === currentLanguage;
    button.setAttribute('aria-selected', String(selected));
    button.disabled = isRevealing;
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.setAttribute('aria-label', copy.close);
    button.dataset.tooltip = copy.close;
  });
}

function render() {
  renderStaticCopy();
  renderBoard();
  renderKeyboard();
  renderResult();
  renderRules();
  refreshIcons();
}

function announce(message) {
  elements.statusAnnouncer.textContent = '';
  window.requestAnimationFrame(() => {
    elements.statusAnnouncer.textContent = message;
  });
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove('is-visible');
  }, 2200);
}

function shakeCurrentRow() {
  const row = elements.board.querySelector(`[data-row="${currentRound.guesses.length}"]`);
  if (!row) return;
  row.classList.remove('shake');
  void row.offsetWidth;
  row.classList.add('shake');
  window.setTimeout(() => row.classList.remove('shake'), 500);
}

function focusInput() {
  if (!elements.guessInput.disabled) {
    elements.guessInput.focus({ preventScroll: true });
    const end = elements.guessInput.value.length;
    elements.guessInput.setSelectionRange(end, end);
  }
}

function finishReveal(statusAtSubmission) {
  isRevealing = false;
  render();
  announce(
    statusAtSubmission === 'won'
      ? COPY[currentLanguage].winTitle
      : statusAtSubmission === 'lost'
        ? `${COPY[currentLanguage].answer}: ${currentRound.answer}`
        : COPY[currentLanguage].attempts(
            currentRound.guesses.length,
            maximumAttempts(),
          ),
  );

  if (statusAtSubmission === 'won') {
    launchConfetti();
  } else if (statusAtSubmission === 'playing') {
    focusInput();
  }
}

function submitGuess() {
  const copy = COPY[currentLanguage];

  if (isRevealing) {
    showToast(copy.busy);
    return;
  }

  if (currentRound.status !== 'playing') {
    showToast(copy.finished);
    return;
  }

  const guess = normalizeGuess(draft, currentLanguage);
  if (!isValidGuess(guess, currentLanguage)) {
    showToast(copy.invalid);
    shakeCurrentRow();
    focusInput();
    return;
  }

  if (!isAllowedGuess(guess, currentLanguage)) {
    showToast(copy.notInDictionary);
    shakeCurrentRow();
    focusInput();
    return;
  }

  currentRound.guesses.push(guess);
  draft = '';
  currentRound.status =
    guess === currentRound.answer
      ? 'won'
      : currentRound.guesses.length >= maximumAttempts()
        ? 'lost'
        : 'playing';
  recordResult();
  saveRound();

  isRevealing = true;
  render();
  const statusAtSubmission = currentRound.status;
  const revealDuration = LANGUAGE_CONFIG[currentLanguage].length * 110 + 520;
  revealTimer = window.setTimeout(() => finishReveal(statusAtSubmission), revealDuration);
}

function updateDraft(value) {
  draft = trimGuess(value, currentLanguage);
  elements.guessInput.value = draft;
  renderBoard();
}

function deleteFromDraft() {
  const characters = splitCharacters(draft);
  characters.pop();
  updateDraft(characters.join(''));
}

function appendKeyboardCharacter(character) {
  const config = LANGUAGE_CONFIG[currentLanguage];

  if (splitCharacters(draft).length < config.length) {
    draft += character;
  }

  elements.guessInput.value = draft;
  renderBoard();
  focusInput();
}

function startNewRound() {
  const previousAnswer = currentRound.answer;
  currentRound = createRound(currentLanguage, previousAnswer);
  writeStorage(storageKey('round', currentLanguage), currentRound);
  draft = '';
  elements.confirmDialog.close();
  render();
  focusInput();
}

function requestNewRound() {
  if (isRevealing) return;

  if (currentRound.status === 'playing' && currentRound.guesses.length > 0) {
    elements.confirmDialog.showModal();
    refreshIcons();
    return;
  }

  startNewRound();
}

function switchLanguage(language) {
  if (language === currentLanguage || isRevealing || !LANGUAGE_CONFIG[language]) {
    return;
  }

  currentLanguage = language;
  currentRound = loadRound(currentLanguage);
  draft = '';
  render();
  focusInput();
}

function renderStats() {
  const copy = COPY[currentLanguage];
  const stats = loadStats(currentLanguage);
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
  const maximum = Math.max(...stats.distribution, 1);

  elements.statsTitle.textContent = copy.statsTitle;
  elements.statsContent.innerHTML = `
    <div class="stat-grid">
      <div><strong>${stats.played}</strong><span>${copy.played}</span></div>
      <div><strong>${winRate}%</strong><span>${copy.winRate}</span></div>
      <div><strong>${stats.streak}</strong><span>${copy.streak}</span></div>
      <div><strong>${stats.bestStreak}</strong><span>${copy.best}</span></div>
    </div>
    <h3 class="distribution-title">${copy.distribution}</h3>
    ${
      stats.played === 0
        ? `<p class="empty-stats">${copy.noStats}</p>`
        : `<div class="distribution">
            ${stats.distribution
              .map(
                (count, index) => `
                  <div class="distribution-row">
                    <span>${index + 1}</span>
                    <div class="distribution-track">
                      <div class="distribution-bar" style="width: ${Math.max(8, (count / maximum) * 100)}%">
                        ${count}
                      </div>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>`
    }
  `;
}

function openStats() {
  renderStats();
  elements.statsDialog.showModal();
  refreshIcons();
}

function shareText() {
  const attemptLimit = maximumAttempts();
  const score =
    currentRound.status === 'won'
      ? `${currentRound.guesses.length}/${attemptLimit}`
      : `X/${attemptLimit}`;
  const rows = currentRound.guesses.map((guess) =>
    evaluateGuess(guess, currentRound.answer)
      .map((state) => {
        if (state === TILE_STATE.CORRECT) return '🟩';
        if (state === TILE_STATE.PRESENT) return '🟨';
        return '⬛';
      })
      .join(''),
  );

  return `Wordle ${LANGUAGE_CONFIG[currentLanguage].label} #${currentRound.number} ${score}\n\n${rows.join('\n')}`;
}

async function shareResult() {
  const copy = COPY[currentLanguage];
  const text = shareText();

  try {
    if (navigator.share) {
      await navigator.share({ text, title: copy.documentTitle });
    } else {
      await navigator.clipboard.writeText(text);
      showToast(copy.shared);
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      try {
        await navigator.clipboard.writeText(text);
        showToast(copy.shared);
      } catch {
        showToast(copy.shareFailed);
      }
    }
  }
}

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = ['#2f7d57', '#dfaa32', '#d95e49', '#f7f8f5', '#272d2a'];
  elements.confettiLayer.replaceChildren();

  for (let index = 0; index < 34; index += 1) {
    const piece = document.createElement('span');
    piece.style.setProperty('--confetti-color', colors[index % colors.length]);
    piece.style.setProperty('--confetti-delay', `${Math.random() * 220}ms`);
    piece.style.setProperty('--confetti-left', `${15 + Math.random() * 70}%`);
    piece.style.setProperty('--confetti-turn', `${Math.round(Math.random() * 540)}deg`);
    elements.confettiLayer.append(piece);
  }

  window.setTimeout(() => elements.confettiLayer.replaceChildren(), 2400);
}

elements.guessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitGuess();
});

elements.guessInput.addEventListener('compositionstart', () => {
  isComposing = true;
});

elements.guessInput.addEventListener('compositionend', (event) => {
  isComposing = false;
  updateDraft(event.target.value);
});

elements.guessInput.addEventListener('input', (event) => {
  if (!isComposing) updateDraft(event.target.value);
});

elements.keyboard.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) event.preventDefault();
});

elements.keyboard.addEventListener('click', (event) => {
  const button = event.target.closest('[data-key]');
  if (!button || isRevealing || currentRound.status !== 'playing') return;
  const key = button.dataset.key;

  if (key === 'ENTER') submitGuess();
  else if (key === 'DELETE') deleteFromDraft();
  else appendKeyboardCharacter(key);
});

document.querySelector('.language-switch').addEventListener('click', (event) => {
  const button = event.target.closest('[data-language]');
  if (button) switchLanguage(button.dataset.language);
});

elements.board.addEventListener('click', focusInput);
elements.statsButton.addEventListener('click', openStats);
elements.rulesButton.addEventListener('click', () => {
  elements.rulesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
elements.newRoundButton.addEventListener('click', requestNewRound);
elements.shareButton.addEventListener('click', shareResult);
elements.cancelNewRound.addEventListener('click', () => elements.confirmDialog.close());
elements.confirmNewRound.addEventListener('click', startNewRound);

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

[elements.statsDialog, elements.confirmDialog].forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

window.addEventListener('keydown', (event) => {
  const dialogOpen = elements.statsDialog.open || elements.confirmDialog.open;
  const inputFocused = document.activeElement === elements.guessInput;
  if (dialogOpen || inputFocused || currentRound.status !== 'playing' || isRevealing) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    submitGuess();
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    deleteFromDraft();
  } else if (currentLanguage === 'en' && /^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    appendKeyboardCharacter(event.key.toUpperCase());
  }
});

window.addEventListener('beforeunload', () => window.clearTimeout(revealTimer));

render();
window.setTimeout(focusInput, 120);
