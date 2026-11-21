// Mouse and keyboard input. The pointer guesses by clicking either picture; the
// keyboard moves a crosshair (arrows), guesses where it sits (Enter/Space), switches
// panels (Tab), spends a hint (H), pauses (P/Esc), mutes (M), toggles the magnifier
// (L), jumps scenes (1-6) and restarts (R). One-shot presses are queued as flags and
// taken once by the loop, so a press between two frames is never lost or double-counted.

import { CROSSHAIR_SPEED, PANEL } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_MAGNIFIER = 16;
export const ACTION_NEXT = 32;
export const ACTION_RESTART = 64;

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const UP_KEYS = new Set(['ArrowUp', 'KeyW']);
const DOWN_KEYS = new Set(['ArrowDown', 'KeyS']);
const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const keys = { left: false, right: false, up: false, down: false };
  let actions = 0;
  let mouse = { x: -1, y: -1, inside: false };
  let clicked = null;
  let sceneKey = 0;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toLogical(event);
    mouse = { x: point.x, y: point.y, inside: true };
  });
  canvas.addEventListener('pointerleave', () => {
    mouse = { x: -1, y: -1, inside: false };
  });
  canvas.addEventListener('pointerdown', (event) => {
    clicked = toLogical(event);
  });

  window.addEventListener('keydown', (event) => {
    if (LEFT_KEYS.has(event.code)) keys.left = true;
    else if (RIGHT_KEYS.has(event.code)) keys.right = true;
    else if (UP_KEYS.has(event.code)) keys.up = true;
    else if (DOWN_KEYS.has(event.code)) keys.down = true;
    else if (CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyH') {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (event.code === 'KeyL') {
      if (!event.repeat) actions |= ACTION_MAGNIFIER;
    } else if (event.code === 'KeyN') {
      if (!event.repeat) actions |= ACTION_NEXT;
    } else if (event.code === 'KeyR') {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (event.code === 'Tab') {
      if (!event.repeat) {
        // Tab switches the crosshair between the two pictures.
        event.preventDefault();
        sceneKey = -1;
      }
    } else if (/^Digit[1-6]$/.test(event.code)) {
      sceneKey = Number(event.code.slice(5));
    } else {
      return;
    }
    if (LEFT_KEYS.has(event.code) || RIGHT_KEYS.has(event.code) || UP_KEYS.has(event.code)
      || DOWN_KEYS.has(event.code) || CONFIRM_KEYS.has(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT_KEYS.has(event.code)) keys.left = false;
    else if (RIGHT_KEYS.has(event.code)) keys.right = false;
    else if (UP_KEYS.has(event.code)) keys.up = false;
    else if (DOWN_KEYS.has(event.code)) keys.down = false;
  });
  window.addEventListener('blur', () => {
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
  });

  return {
    /** Current pointer position in logical coordinates. */
    mouse() {
      return mouse;
    },
    /** The click since the last call, in logical coordinates, or null. */
    takeClick() {
      const point = clicked;
      clicked = null;
      return point;
    },
    /** One-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** A scene number key (1-6), Tab as -1, or 0 when none was pressed. */
    takeSceneKey() {
      const key = sceneKey;
      sceneKey = 0;
      return key;
    },
    /** Held arrow-key direction, -1/0/1 on each axis. */
    direction() {
      return {
        x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
        y: (keys.down ? 1 : 0) - (keys.up ? 1 : 0),
      };
    },
  };
}

/**
 * Which panel (0 left, 1 right) a logical point sits over, or -1 when it is over
 * neither. Also converts the point to image space (0..1000) for hit testing.
 */
export function panelAt(point) {
  const panels = [
    { x: PANEL.leftX, y: PANEL.y },
    { x: PANEL.rightX, y: PANEL.y },
  ];
  for (let index = 0; index < panels.length; index += 1) {
    const panel = panels[index];
    if (
      point.x >= panel.x && point.x <= panel.x + PANEL.width
      && point.y >= panel.y && point.y <= panel.y + PANEL.height
    ) {
      return {
        panel: index,
        x: ((point.x - panel.x) / PANEL.width) * 1000,
        y: ((point.y - panel.y) / PANEL.height) * 1000,
      };
    }
  }
  return { panel: -1, x: 0, y: 0 };
}

/** Move the crosshair by the held keys for one frame. */
export function moveCrosshair(crosshair, direction, seconds) {
  if (direction.x === 0 && direction.y === 0) return false;
  crosshair.visible = true;
  crosshair.x = Math.min(990, Math.max(10, crosshair.x + direction.x * CROSSHAIR_SPEED * seconds));
  crosshair.y = Math.min(990, Math.max(10, crosshair.y + direction.y * CROSSHAIR_SPEED * seconds));
  return true;
}
