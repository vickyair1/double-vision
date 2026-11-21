// Every tuning number, colour and layout constant in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size. Panels are 600x375 and show the scene images (1280x800, 16:10) exactly.

export const FIELD = { width: 1280, height: 720 };

/** Two picture panels, side by side, with a VS badge between them. */
export const PANEL = {
  width: 600,
  height: 375,
  y: 100,
  leftX: 24,
  rightX: 656,
  labelY: 82,
  radius: 14,
};

/** Header bar and timer bar. */
export const HEADER = { height: 64, timerBarY: 64, timerBarHeight: 6 };

/** Seconds of play per scene; later scenes are shorter, so the hunt tightens. */
export const PAR_SECONDS = [150, 140, 130, 120, 110, 100];

/** Hints per scene, and what one costs. */
export const HINTS_PER_SCENE = 3;
export const HINT_COST = 25;

/** Points: a find pays 100 plus a streak bonus; a miss costs 5 seconds and the streak. */
export const SCORE = {
  findBase: 100,
  findStreakBonus: 25,
  winTimeBonusPerSecond: 5,
  missTimePenalty: 5,
};

/** How long a found ring takes to pop in, and how long a hint pulse lasts. */
export const ANIMATION = { ringPopSeconds: 0.25, hintPulseSeconds: 2.5, missFlashSeconds: 0.4 };

/** Magnifier lens: radius on screen, zoom factor, and the key that toggles it. */
export const MAGNIFIER = { radius: 64, zoom: 2.0 };

/** Crosshair speed in image-space units per second (arrow-key play). */
export const CROSSHAIR_SPEED = 420;

export const PALETTE = {
  backdrop: '#101623',
  backdropTop: '#16202f',
  panel: '#1b2436',
  panelEdge: '#2e3a52',
  text: '#f2f5fa',
  muted: '#9aa7bd',
  gold: '#f5b921',
  goldDeep: '#d99406',
  green: '#3fce7c',
  red: '#ef5350',
  blue: '#4fc3f7',
  ringFound: '#ffd23f',
  ringCheck: '#3fce7c',
  hint: '#ff9f1c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'double-vision.best-total';
