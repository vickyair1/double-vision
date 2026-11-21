// The screenshot scenes behind ?shot=start|play|play2|win. Each one sets a fixed,
// deterministic state — the same seed always gives the same frame — so the screenshots
// in screenshots/ are real renders of the game's own code, taken at known moments:
// the title screen, a mid-hunt play frame with rings and a counter, a second scene
// with the magnifier open, and a cleared scene with its stars.

import { SCENES } from './scenes.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './state.js';

/**
 * Set `state` to the named scene and return the screen to draw and the pointer to
 * pretend is there (the magnifier shot needs a pointer over a panel). Any other name
 * is the title screen.
 */
export function stageShot(name, state) {
  state.bestTotal = 1805;
  state.time = 5;
  if (name === 'play') {
    state.screen = SCREEN_PLAY;
    state.sceneIndex = 0;
    state.found = new Set([0, 2, 6]);
    state.foundOrder = [0, 2, 6];
    state.strikes = 0;
    state.streak = 3;
    state.bestStreak = 3;
    state.score = 375;
    state.totalScore = 375;
    state.hintsLeft = 3;
    state.par = 150;
    state.timeLeft = 107;
    state.stars = 0;
    state.timeBonus = 0;
    state.hintPulse = null;
    state.missFlash = null;
    state.lastFoundLabel = 'The red sail turned yellow';
    state.message = 'The red sail turned yellow';
    state.crosshair = { activePanel: 0, x: 500, y: 500, visible: false };
    return { mouse: { x: -1, y: -1, inside: false } };
  }
  if (name === 'play2') {
    state.screen = SCREEN_PLAY;
    state.sceneIndex = 1;
    state.found = new Set([3, 6]);
    state.foundOrder = [3, 6];
    state.strikes = 0;
    state.streak = 2;
    state.bestStreak = 2;
    state.score = 225;
    state.totalScore = 225;
    state.hintsLeft = 3;
    state.par = 140;
    state.timeLeft = 83;
    state.stars = 0;
    state.timeBonus = 0;
    state.hintPulse = null;
    state.missFlash = null;
    state.lastFoundLabel = 'Oranges became apples';
    state.message = 'Oranges became apples';
    state.crosshair = { activePanel: 0, x: 500, y: 500, visible: false };
    // Pointer over the right panel, among the lanterns, so the magnifier shows.
    return { mouse: { x: 980, y: 220, inside: true } };
  }
  if (name === 'win') {
    state.screen = SCREEN_WIN;
    state.sceneIndex = 0;
    state.found = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
    state.foundOrder = [0, 1, 2, 3, 4, 5, 6, 7];
    state.strikes = 0;
    state.streak = 8;
    state.bestStreak = 8;
    state.score = 1805;
    state.totalScore = 1805;
    state.hintsLeft = 3;
    state.par = 150;
    state.timeLeft = 61;
    state.stars = 3;
    state.timeBonus = 305;
    state.hintPulse = null;
    state.missFlash = null;
    state.lastFoundLabel = 'A cloud drifted away';
    state.message = 'All 8 differences found!';
    state.crosshair = { activePanel: 0, x: 500, y: 500, visible: false };
    return { mouse: { x: -1, y: -1, inside: false } };
  }
  state.screen = SCREEN_TITLE;
  state.sceneIndex = 0;
  state.found = new Set();
  state.foundOrder = [];
  state.strikes = 0;
  state.streak = 0;
  state.score = 0;
  state.totalScore = 0;
  state.hintsLeft = 3;
  state.par = 150;
  state.timeLeft = 150;
  state.stars = 0;
  state.timeBonus = 0;
  state.hintPulse = null;
  state.missFlash = null;
  state.message = '';
  state.crosshair = { activePanel: 0, x: 500, y: 500, visible: false };
  return { mouse: { x: -1, y: -1, inside: false } };
}

/** The scenes each shot shows, for the capture script's log. */
export const SHOT_SCENES = {
  start: SCENES[0].title,
  play: SCENES[0].title,
  play2: SCENES[1].title,
  win: SCENES[0].title,
};
