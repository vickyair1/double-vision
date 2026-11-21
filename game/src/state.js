// The game's state: which screen is up, which scene is being hunted, what has been
// found, and the score. One fresh state per scene; the total score and best score carry
// across scenes. All rules live here so the renderer only draws what this reports.

import { HINTS_PER_SCENE, HINT_COST, PAR_SECONDS, SCORE } from './config.js';
import { SCENES } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_WIN = 'win';
export const SCREEN_TIMEUP = 'timeup';

/** A fresh hunt: title screen over the first scene, nothing found yet. */
export function createGameState() {
  return {
    screen: SCREEN_TITLE,
    sceneIndex: 0,
    found: new Set(),
    foundOrder: [],
    strikes: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    totalScore: 0,
    hintsLeft: HINTS_PER_SCENE,
    timeLeft: PAR_SECONDS[0],
    par: PAR_SECONDS[0],
    stars: 0,
    timeBonus: 0,
    bestTotal: 0,
    muted: false,
    magnifierOn: true,
    crosshair: { activePanel: 0, x: 500, y: 500, visible: false },
    hintPulse: null,
    missFlash: null,
    lastFoundLabel: '',
    message: '',
    time: 0,
  };
}

/** The scene currently being hunted. */
export function currentScene(state) {
  return SCENES[state.sceneIndex];
}

/** How many differences are still unfound in this scene. */
export function remainingCount(state) {
  return currentScene(state).differences.length - state.found.size;
}

/** Start (or restart) a scene from scratch. */
export function startScene(state, sceneIndex) {
  state.sceneIndex = sceneIndex;
  state.screen = SCREEN_PLAY;
  state.found = new Set();
  state.foundOrder = [];
  state.strikes = 0;
  state.streak = 0;
  state.score = 0;
  state.hintsLeft = HINTS_PER_SCENE;
  state.par = PAR_SECONDS[sceneIndex];
  state.timeLeft = PAR_SECONDS[sceneIndex];
  state.stars = 0;
  state.timeBonus = 0;
  state.hintPulse = null;
  state.missFlash = null;
  state.lastFoundLabel = '';
  state.message = '';
  state.crosshair = { activePanel: 0, x: 500, y: 500, visible: false };
}

/** Move to the title screen. */
export function goTitle(state) {
  state.screen = SCREEN_TITLE;
  state.hintPulse = null;
  state.missFlash = null;
}

/**
 * Guess at a point in image space (0..1000) on either panel. Returns 'found', 'miss'
 * or 'already' (the difference was ringed already). A find pays 100 plus a streak
 * bonus and raises the streak; a miss costs 5 seconds, a strike, and the streak.
 * Hit testing is done in panel pixels, so the ring the player sees is the ring that
 * counts: a circle on screen, not an ellipse in image space.
 */
export function guessAt(state, x, y) {
  if (state.screen !== SCREEN_PLAY) return 'idle';
  const scene = currentScene(state);
  const clickPx = (x / 1000) * 600;
  const clickPy = (y / 1000) * 375;
  for (let index = 0; index < scene.differences.length; index += 1) {
    const diff = scene.differences[index];
    const centrePx = (diff.x / 1000) * 600;
    const centrePy = (diff.y / 1000) * 375;
    const radiusPx = (diff.r / 1000) * 600;
    const dx = clickPx - centrePx;
    const dy = clickPy - centrePy;
    if (dx * dx + dy * dy <= radiusPx * radiusPx) {
      if (state.found.has(index)) return 'already';
      state.found.add(index);
      state.foundOrder.push(index);
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const points = SCORE.findBase + SCORE.findStreakBonus * (state.streak - 1);
      state.score += points;
      state.totalScore += points;
      state.lastFoundLabel = diff.label;
      state.message = diff.label;
      if (state.found.size === scene.differences.length) finishScene(state);
      return 'found';
    }
  }
  state.strikes += 1;
  state.streak = 0;
  state.timeLeft = Math.max(0, state.timeLeft - SCORE.missTimePenalty);
  state.missFlash = { x, y, until: state.time + 0.4 };
  state.message = 'Not a difference — 5 seconds lost';
  if (state.timeLeft <= 0) {
    state.screen = SCREEN_TIMEUP;
  }
  return 'miss';
}

/**
 * Spend a hint: pulse a ring around one still-unfound difference for a few seconds.
 * Costs points, never a find: the player still has to click it.
 */
export function useHint(state) {
  if (state.screen !== SCREEN_PLAY || state.hintsLeft <= 0) return null;
  const scene = currentScene(state);
  const remaining = scene.differences
    .map((diff, index) => index)
    .filter((index) => !state.found.has(index));
  if (remaining.length === 0) return null;
  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  state.hintsLeft -= 1;
  state.score = Math.max(0, state.score - HINT_COST);
  state.totalScore = Math.max(0, state.totalScore - HINT_COST);
  state.hintPulse = { index: pick, until: state.time + 2.5 };
  state.message = 'Hint: look where the ring pulses';
  return scene.differences[pick];
}

/** All differences found: stars, a time bonus, and the win screen. */
export function finishScene(state) {
  state.timeBonus = Math.round(state.timeLeft) * SCORE.winTimeBonusPerSecond;
  state.score += state.timeBonus;
  state.totalScore += state.timeBonus;
  const timeShare = state.timeLeft / state.par;
  state.stars = state.strikes <= 1 && timeShare >= 0.3 ? 3 : timeShare >= 0.1 ? 2 : 1;
  state.screen = SCREEN_WIN;
}

/** Tick the clock down; time up ends the hunt for this scene. */
export function tickClock(state, seconds) {
  if (state.screen !== SCREEN_PLAY) return;
  state.time += seconds;
  state.timeLeft = Math.max(0, state.timeLeft - seconds);
  if (state.timeLeft <= 0) state.screen = SCREEN_TIMEUP;
}

/** Advance to the next scene (wraps to the first after the last). */
export function nextSceneIndex(state) {
  return (state.sceneIndex + 1) % SCENES.length;
}

/** Format seconds as M:SS. */
export function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
