// Double Vision — a spot-the-difference hunt. Boots the canvas, loads the six scenes'
// pictures, runs the loop, and routes clicks and keys to the state machine. In shot
// mode (?shot=start|play|play2|win) it stages one fixed frame instead and sets
// window.__shotReady once that frame is painted, so the capture script can screenshot
// real renders of the game's own code.

import { BEST_KEY, FIELD } from './config.js';
import { SCENES } from './scenes.js';
import {
  ACTION_CONFIRM, ACTION_HINT, ACTION_MAGNIFIER, ACTION_MUTE, ACTION_NEXT,
  ACTION_PAUSE, ACTION_RESTART, createInput, moveCrosshair, panelAt,
} from './input.js';
import {
  SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TIMEUP, SCREEN_TITLE, SCREEN_WIN,
  createGameState, goTitle, guessAt, nextSceneIndex,
  startScene, tickClock, useHint,
} from './state.js';
import {
  playClick, playFindChime, playHintBlip, playMissBuzz, playTick, playWinFanfare,
  setMuted,
} from './audio.js';
import { buttonAt, drawFrame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const state = createGameState();
try {
  state.bestTotal = Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
} catch {
  state.bestTotal = 0;
}

function saveBest() {
  if (state.totalScore <= state.bestTotal) return;
  state.bestTotal = state.totalScore;
  try {
    window.localStorage.setItem(BEST_KEY, String(state.bestTotal));
  } catch {
    // Private mode or no storage: the hunt still plays.
  }
}

/** Load one picture; rejects loudly so a missing file never screenshots silently. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}

async function loadAllImages() {
  const loaded = [];
  for (const scene of SCENES) {
    const [a, b] = await Promise.all([loadImage(scene.imageA), loadImage(scene.imageB)]);
    loaded.push({ a, b });
  }
  return loaded;
}

const input = createInput(canvas);
let images = [];
let lastTickSecond = -1;

function currentImages() {
  return images[state.sceneIndex] ?? { a: null, b: null };
}

function handleGuess(panelIndex, x, y) {
  const result = guessAt(state, x, y);
  if (result === 'found') {
    playFindChime();
    state.crosshair = { activePanel: panelIndex, x, y, visible: true };
    if (state.screen === SCREEN_WIN) playWinFanfare();
  } else if (result === 'miss') {
    playMissBuzz();
    state.crosshair = { activePanel: panelIndex, x, y, visible: true };
    if (state.screen === SCREEN_TIMEUP) saveBest();
  }
  return result;
}

function handleClick(point) {
  const button = buttonAt(state, point);
  if (button) {
    playClick();
    if (button.name === 'pill') {
      startScene(state, button.sceneIndex);
      lastTickSecond = -1;
      return;
    }
    if (button.name === 'start') {
      startScene(state, 0);
      lastTickSecond = -1;
    } else if (button.name === 'hint') {
      if (useHint(state)) playHintBlip();
    } else if (button.name === 'pause') {
      state.screen = SCREEN_PAUSE;
    } else if (button.name === 'resume') {
      state.screen = SCREEN_PLAY;
    } else if (button.name === 'restart' || button.name === 'retry') {
      startScene(state, state.sceneIndex);
      lastTickSecond = -1;
    } else if (button.name === 'next') {
      startScene(state, nextSceneIndex(state));
      lastTickSecond = -1;
    } else if (button.name === 'title') {
      goTitle(state);
    }
    return;
  }
  if (state.screen !== SCREEN_PLAY) return;
  const hit = panelAt(point);
  if (hit.panel === -1) return;
  handleGuess(hit.panel, hit.x, hit.y);
}

function handleActions() {
  const actions = input.takeActions();
  if (actions & ACTION_MUTE) {
    state.muted = !state.muted;
    setMuted(state.muted);
  }
  if (actions & ACTION_MAGNIFIER) {
    state.magnifierOn = !state.magnifierOn;
  }
  if (actions & ACTION_PAUSE) {
    if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSE;
    else if (state.screen === SCREEN_PAUSE) state.screen = SCREEN_PLAY;
  }
  if (actions & ACTION_HINT) {
    if (state.screen === SCREEN_PLAY && useHint(state)) playHintBlip();
  }
  if (actions & ACTION_CONFIRM) {
    if (state.screen === SCREEN_TITLE) {
      startScene(state, 0);
      lastTickSecond = -1;
    } else if (state.screen === SCREEN_PLAY && state.crosshair.visible) {
      handleGuess(state.crosshair.activePanel, state.crosshair.x, state.crosshair.y);
    } else if (state.screen === SCREEN_WIN) {
      startScene(state, nextSceneIndex(state));
      lastTickSecond = -1;
    } else if (state.screen === SCREEN_TIMEUP) {
      startScene(state, state.sceneIndex);
      lastTickSecond = -1;
    }
  }
  if (actions & ACTION_NEXT) {
    if (state.screen === SCREEN_WIN) {
      startScene(state, nextSceneIndex(state));
      lastTickSecond = -1;
    }
  }
  if (actions & ACTION_RESTART) {
    if (state.screen === SCREEN_PLAY || state.screen === SCREEN_WIN || state.screen === SCREEN_TIMEUP) {
      startScene(state, state.sceneIndex);
      lastTickSecond = -1;
    }
  }
  const sceneKey = input.takeSceneKey();
  if (sceneKey === -1) {
    state.crosshair.activePanel = 1 - state.crosshair.activePanel;
    state.crosshair.visible = true;
  } else if (sceneKey >= 1 && sceneKey <= SCENES.length) {
    if (state.screen === SCREEN_PLAY || state.screen === SCREEN_TITLE) {
      startScene(state, sceneKey - 1);
      lastTickSecond = -1;
    }
  }
}

function frame(now, last) {
  const seconds = Math.min(0.05, (now - last) / 1000);
  handleActions();
  const click = input.takeClick();
  if (click) handleClick(click);
  const direction = input.direction();
  if (state.screen === SCREEN_PLAY && moveCrosshair(state.crosshair, direction, seconds)) {
    // The crosshair moved; nothing else to do.
  }
  const wasPlaying = state.screen === SCREEN_PLAY;
  tickClock(state, seconds);
  if (wasPlaying && state.screen === SCREEN_TIMEUP) saveBest();
  if (wasPlaying && state.screen === SCREEN_WIN) saveBest();
  if (state.screen === SCREEN_PLAY && state.timeLeft <= 10) {
    const whole = Math.ceil(state.timeLeft);
    if (whole !== lastTickSecond) {
      lastTickSecond = whole;
      playTick();
    }
  }
  drawFrame(ctx, state, currentImages(), input.mouse());
  return now;
}

async function boot() {
  images = await loadAllImages();
  if (shotName) {
    const staged = stageShot(shotName, state);
    drawFrame(ctx, state, currentImages(), staged.mouse);
    window.__shotReady = true;
    return;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSE;
  });
  let last = performance.now();
  const loop = (now) => {
    last = frame(now, last);
    window.requestAnimationFrame(loop);
  };
  window.requestAnimationFrame(loop);
}

boot().catch((error) => {
  console.error(error);
  document.getElementById('error').textContent = String(error.message ?? error);
});
