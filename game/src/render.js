// Everything the player sees: the title screen, the two picture panels with their
// found rings, the header with its counter and clock, the footer with its scene
// pills, and the win / pause / time-up overlays. One canvas, 1280x720 logical.

import { FIELD, HEADER, PALETTE, PANEL, PAR_SECONDS } from './config.js';
import { SCENES } from './scenes.js';
import {
  SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TIMEUP, SCREEN_TITLE, SCREEN_WIN,
  currentScene, formatTime, remainingCount,
} from './state.js';
import { drawMagnifierLens } from './magnifier.js';

/** Button rectangles, by screen, for click routing in main.js. */
export function buttonRects(state) {
  const rects = {};
  if (state.screen === SCREEN_PLAY) {
    rects.hint = { x: 1085, y: 14, w: 80, h: 36 };
    rects.pause = { x: 1175, y: 14, w: 81, h: 36 };
    rects.pills = scenePillRects();
  } else if (state.screen === SCREEN_TITLE) {
    rects.start = { x: 540, y: 560, w: 200, h: 56 };
    rects.pills = scenePillRects(640);
  } else if (state.screen === SCREEN_WIN) {
    rects.next = { x: 410, y: 470, w: 170, h: 48 };
    rects.replay = { x: 595, y: 470, w: 110, h: 48 };
    rects.title = { x: 720, y: 470, w: 150, h: 48 };
  } else if (state.screen === SCREEN_PAUSE) {
    rects.resume = { x: 540, y: 330, w: 200, h: 48 };
    rects.restart = { x: 540, y: 394, w: 200, h: 48 };
    rects.title = { x: 540, y: 458, w: 200, h: 48 };
  } else if (state.screen === SCREEN_TIMEUP) {
    rects.retry = { x: 540, y: 350, w: 200, h: 48 };
    rects.title = { x: 540, y: 414, w: 200, h: 48 };
  }
  return rects;
}

/** Six scene pills in a centred row; `y` defaults to the play screen's row. */
export function scenePillRects(y = 596) {
  const width = 168;
  const gap = 12;
  const total = SCENES.length * width + (SCENES.length - 1) * gap;
  const startX = (FIELD.width - total) / 2;
  return SCENES.map((scene, index) => ({
    x: startX + index * (width + gap),
    y,
    w: width,
    h: 36,
    sceneIndex: index,
  }));
}

function pointInRect(point, rect) {
  return (
    rect
    && point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h
  );
}

/** The named button under a logical point, or null. */
export function buttonAt(state, point) {
  const rects = buttonRects(state);
  for (const [name, rect] of Object.entries(rects)) {
    if (name === 'pills') {
      for (const pill of rect) {
        if (pointInRect(point, pill)) return { name: 'pill', sceneIndex: pill.sceneIndex };
      }
    } else if (pointInRect(point, rect)) {
      return { name };
    }
  }
  return null;
}

function drawButton(ctx, rect, label, options = {}) {
  const { fill = '#2a3550', edge = '#3d4c6e', text = '#f2f5fa', font = '600 15px system-ui, sans-serif' } = options;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 9);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawPanelLabel(ctx, x, width, label) {
  ctx.save();
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + width / 2, PANEL.labelY);
  ctx.restore();
}

/** One found difference: a gold ring on the picture, with a green check badge. */
function drawFoundRing(ctx, panelX, diff) {
  const centreX = panelX + (diff.x / 1000) * PANEL.width;
  const centreY = PANEL.y + (diff.y / 1000) * PANEL.height;
  const radius = (diff.r / 1000) * PANEL.width;
  ctx.save();
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.ringFound;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Green check badge at the ring's top right.
  const badgeX = centreX + radius * 0.7;
  const badgeY = centreY - radius * 0.7;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 11, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ringCheck;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(badgeX - 5, badgeY);
  ctx.lineTo(badgeX - 1, badgeY + 4);
  ctx.lineTo(badgeX + 5, badgeY - 4);
  ctx.stroke();
  ctx.restore();
}

function drawHintPulse(ctx, panelX, diff, time) {
  const centreX = panelX + (diff.x / 1000) * PANEL.width;
  const centreY = PANEL.y + (diff.y / 1000) * PANEL.height;
  const base = (diff.r / 1000) * PANEL.width;
  const pulse = 1 + 0.18 * Math.sin(time * 6);
  ctx.save();
  ctx.beginPath();
  ctx.arc(centreX, centreY, base * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.hint;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.stroke();
  ctx.restore();
}

function drawMissFlash(ctx, panelX, miss, time) {
  if (!miss || time > miss.until) return;
  const alpha = Math.max(0, (miss.until - time) / 0.4);
  const centreX = panelX + (miss.x / 1000) * PANEL.width;
  const centreY = PANEL.y + (miss.y / 1000) * PANEL.height;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = PALETTE.red;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centreX - 14, centreY - 14);
  ctx.lineTo(centreX + 14, centreY + 14);
  ctx.moveTo(centreX + 14, centreY - 14);
  ctx.lineTo(centreX - 14, centreY + 14);
  ctx.stroke();
  ctx.restore();
}

function drawCrosshair(ctx, panelX, crosshair) {
  if (!crosshair.visible) return;
  const centreX = panelX + (crosshair.x / 1000) * PANEL.width;
  const centreY = PANEL.y + (crosshair.y / 1000) * PANEL.height;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centreX, centreY, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centreX - 24, centreY);
  ctx.lineTo(centreX - 10, centreY);
  ctx.moveTo(centreX + 10, centreY);
  ctx.lineTo(centreX + 24, centreY);
  ctx.moveTo(centreX, centreY - 24);
  ctx.lineTo(centreX, centreY - 10);
  ctx.moveTo(centreX, centreY + 10);
  ctx.lineTo(centreX, centreY + 24);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(centreX, centreY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The two picture panels, with found rings, hint pulse, miss flash and crosshair. */
function drawPanels(ctx, state, images) {
  const scene = currentScene(state);
  const panels = [
    { x: PANEL.leftX, image: images.a },
    { x: PANEL.rightX, image: images.b },
  ];
  drawPanelLabel(ctx, PANEL.leftX, PANEL.width, 'LEFT — original');
  drawPanelLabel(ctx, PANEL.rightX, PANEL.width, 'RIGHT — spot the changes');
  for (const panel of panels) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(panel.x, PANEL.y, PANEL.width, PANEL.height, PANEL.radius);
    ctx.clip();
    if (panel.image) {
      ctx.drawImage(panel.image, panel.x, PANEL.y, PANEL.width, PANEL.height);
    } else {
      ctx.fillStyle = PALETTE.panel;
      ctx.fillRect(panel.x, PANEL.y, PANEL.width, PANEL.height);
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(panel.x, PANEL.y, PANEL.width, PANEL.height, PANEL.radius);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    for (const index of state.found) {
      drawFoundRing(ctx, panel.x, scene.differences[index]);
    }
    if (state.hintPulse && state.time < state.hintPulse.until) {
      drawHintPulse(ctx, panel.x, scene.differences[state.hintPulse.index], state.time);
    }
    drawMissFlash(ctx, panel.x, state.missFlash, state.time);
  }
  // VS badge between the panels.
  ctx.save();
  ctx.beginPath();
  ctx.arc(FIELD.width / 2, PANEL.y + PANEL.height / 2, 22, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.gold;
  ctx.fill();
  ctx.fillStyle = '#101623';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', FIELD.width / 2, PANEL.y + PANEL.height / 2 + 1);
  ctx.restore();
}

function drawHeader(ctx, state) {
  const scene = currentScene(state);
  const remaining = remainingCount(state);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DOUBLE VISION', 24, 28);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Scene ${state.sceneIndex + 1} of ${SCENES.length} · ${scene.title} · Par ${formatTime(PAR_SECONDS[state.sceneIndex])}`, 24, 50);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(`${remaining} LEFT`, FIELD.width / 2, 36);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`${state.found.size} / ${scene.differences.length} found`, FIELD.width / 2, 56);
  // Clock, score, streak, hint and pause on the right.
  const lowTime = state.timeLeft <= 10;
  ctx.textAlign = 'left';
  ctx.fillStyle = lowTime ? PALETTE.red : PALETTE.text;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(`⏱ ${formatTime(state.timeLeft)}`, 790, 32);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText(`Score ${state.score}`, 875, 32);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(985, 12, 90, 28, 14);
  ctx.fillStyle = state.streak >= 2 ? '#1f7a44' : '#2a3550';
  ctx.fill();
  ctx.fillStyle = state.streak >= 2 ? '#7dffa8' : PALETTE.muted;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Streak ×${state.streak}`, 1030, 27);
  ctx.restore();
  const rects = buttonRects(state);
  if (state.screen === SCREEN_PLAY) {
    drawButton(ctx, rects.hint, `Hint (${state.hintsLeft})`, {
      fill: state.hintsLeft > 0 ? '#f5b921' : '#3a4358',
      edge: state.hintsLeft > 0 ? '#d99406' : '#3d4c6e',
      text: state.hintsLeft > 0 ? '#101623' : PALETTE.muted,
      font: '700 15px system-ui, sans-serif',
    });
    drawButton(ctx, rects.pause, 'Pause', { font: '700 15px system-ui, sans-serif' });
  }
  ctx.restore();
}

function drawTimerBar(ctx, state) {
  const share = Math.max(0, state.timeLeft / state.par);
  const colour = share > 0.5 ? PALETTE.green : share > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.save();
  ctx.fillStyle = '#232d42';
  ctx.fillRect(0, HEADER.timerBarY, FIELD.width, HEADER.timerBarHeight);
  ctx.fillStyle = colour;
  ctx.fillRect(0, HEADER.timerBarY, FIELD.width * share, HEADER.timerBarHeight);
  ctx.restore();
}

function drawFoundDots(ctx, state) {
  const scene = currentScene(state);
  ctx.save();
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Found:', 24, 505);
  for (let index = 0; index < scene.differences.length; index += 1) {
    const x = 84 + index * 26;
    ctx.beginPath();
    ctx.arc(x, 505, 8, 0, Math.PI * 2);
    if (state.found.has(index)) {
      ctx.fillStyle = PALETTE.ringCheck;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, 505);
      ctx.lineTo(x - 1, 508);
      ctx.lineTo(x + 4, 501);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#2a3550';
      ctx.fill();
      ctx.strokeStyle = '#3d4c6e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFooter(ctx, state) {
  drawFoundDots(ctx, state);
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(`Score ${state.score} · Best ${state.bestTotal}`, FIELD.width - 24, 505);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'italic 600 15px system-ui, sans-serif';
  ctx.fillText(state.message, FIELD.width / 2, 505);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(
    'Click a difference on either picture · Arrows + Enter to guess · H hint · L magnifier · P pause · M mute',
    FIELD.width / 2, 548,
  );
  ctx.fillText('6 scenes · 48 differences · magnifier on hover · hints that pulse · streaks pay more', FIELD.width / 2, 572);
  ctx.restore();
  const pills = scenePillRects();
  pills.forEach((pill, index) => {
    const scene = SCENES[index];
    drawButton(ctx, pill, `${index + 1}. ${scene.title}`, {
      fill: index === state.sceneIndex ? '#f5b921' : '#1b2436',
      edge: index === state.sceneIndex ? '#d99406' : '#3d4c6e',
      text: index === state.sceneIndex ? '#101623' : PALETTE.text,
      font: '600 13px system-ui, sans-serif',
    });
  });
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('The clock is always running — a wrong guess costs 5 seconds and your streak.', FIELD.width / 2, 660);
  ctx.restore();
}

function drawTitleScreen(ctx, state, images) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 68px system-ui, sans-serif';
  ctx.fillText('DOUBLE VISION', FIELD.width / 2, 92);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText('a spot-the-difference hunt', FIELD.width / 2, 132);
  // Two preview panels: the first scene, original and changed, clean.
  const preview = [
    { x: 140, image: images.a, label: 'LEFT — original' },
    { x: 660, image: images.b, label: 'RIGHT — spot the changes' },
  ];
  for (const panel of preview) {
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(panel.label, panel.x + 240, 162);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(panel.x, 172, 480, 300, 14);
    ctx.clip();
    if (panel.image) ctx.drawImage(panel.image, panel.x, 172, 480, 300);
    else {
      ctx.fillStyle = PALETTE.panel;
      ctx.fillRect(panel.x, 172, 480, 300);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.roundRect(panel.x, 172, 480, 300, 14);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Two pictures side by side — 8 things are different in each scene.', FIELD.width / 2, 505);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Click a difference on either picture to ring it on both. Hints help, misses cost time.', FIELD.width / 2, 532);
  const rects = buttonRects(state);
  drawButton(ctx, rects.start, '▶  Start the hunt', {
    fill: '#f5b921', edge: '#d99406', text: '#101623', font: '700 20px system-ui, sans-serif',
  });
  const pills = scenePillRects(640);
  pills.forEach((pill, index) => {
    drawButton(ctx, pill, `${index + 1}. ${SCENES[index].title}`, {
      fill: '#1b2436', edge: '#3d4c6e', text: PALETTE.text, font: '600 13px system-ui, sans-serif',
    });
  });
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(
    `6 scenes · 48 differences · magnifier · hints · keyboard play${state.bestTotal > 0 ? ` · best score ${state.bestTotal}` : ''}`,
    FIELD.width / 2, 700,
  );
  ctx.restore();
}

function drawOverlayPanel(ctx, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 24, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fillStyle = '#1b2436';
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawWinOverlay(ctx, state) {
  drawOverlayPanel(ctx, 390, 170, 500, 380);
  const scene = currentScene(state);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.fillText('Scene Clear!', FIELD.width / 2, 232);
  ctx.font = '44px system-ui, sans-serif';
  let stars = '';
  for (let index = 0; index < 3; index += 1) stars += index < state.stars ? '★' : '☆';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(stars, FIELD.width / 2, 292);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`All ${scene.differences.length} differences found in ${scene.title}`, FIELD.width / 2, 330);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`Finds ${state.score - state.timeBonus}  ·  Time bonus +${state.timeBonus}`, FIELD.width / 2, 362);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(`Scene total ${state.score}  ·  Hunt total ${state.totalScore}`, FIELD.width / 2, 396);
  const rects = buttonRects(state);
  drawButton(ctx, rects.next, 'Next Scene →', {
    fill: '#f5b921', edge: '#d99406', text: '#101623', font: '700 16px system-ui, sans-serif',
  });
  drawButton(ctx, rects.replay, 'Replay', { font: '700 16px system-ui, sans-serif' });
  drawButton(ctx, rects.title, 'Scene Select', { font: '700 16px system-ui, sans-serif' });
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('N next · R replay', FIELD.width / 2, 530);
  ctx.restore();
}

function drawPauseOverlay(ctx, state) {
  drawOverlayPanel(ctx, 440, 190, 400, 330);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 36px system-ui, sans-serif';
  ctx.fillText('Paused', FIELD.width / 2, 262);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('The clock is stopped.', FIELD.width / 2, 296);
  const rects = buttonRects(state);
  drawButton(ctx, rects.resume, 'Resume', {
    fill: '#f5b921', edge: '#d99406', text: '#101623', font: '700 16px system-ui, sans-serif',
  });
  drawButton(ctx, rects.restart, 'Restart Scene', { font: '700 16px system-ui, sans-serif' });
  drawButton(ctx, rects.title, 'Scene Select', { font: '700 16px system-ui, sans-serif' });
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('P / Esc resume', FIELD.width / 2, 508);
  ctx.restore();
}

function drawTimeUpOverlay(ctx, state) {
  drawOverlayPanel(ctx, 440, 190, 400, 300);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.red;
  ctx.font = '800 36px system-ui, sans-serif';
  ctx.fillText("Time's Up!", FIELD.width / 2, 262);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `${remainingCount(state)} difference${remainingCount(state) === 1 ? '' : 's'} still hiding in ${currentScene(state).title}.`,
    FIELD.width / 2, 300,
  );
  const rects = buttonRects(state);
  drawButton(ctx, rects.retry, 'Try Again', {
    fill: '#f5b921', edge: '#d99406', text: '#101623', font: '700 16px system-ui, sans-serif',
  });
  drawButton(ctx, rects.title, 'Scene Select', { font: '700 16px system-ui, sans-serif' });
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('R retry', FIELD.width / 2, 478);
  ctx.restore();
}

/** Paint the whole frame for the current screen. */
export function drawFrame(ctx, state, images, mouse) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, PALETTE.backdropTop);
  gradient.addColorStop(1, PALETTE.backdrop);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  if (state.screen === SCREEN_TITLE) {
    drawTitleScreen(ctx, state, images);
    return;
  }
  drawHeader(ctx, state);
  drawTimerBar(ctx, state);
  drawPanels(ctx, state, images);
  drawFooter(ctx, state);

  if (state.screen === SCREEN_PLAY) {
    // Crosshair for keyboard play, on the active panel.
    const panelX = state.crosshair.activePanel === 0 ? PANEL.leftX : PANEL.rightX;
    drawCrosshair(ctx, panelX, state.crosshair);
    // Magnifier lens follows the pointer over a panel.
    if (state.magnifierOn && mouse.inside) {
      const left = mouse.x >= PANEL.leftX && mouse.x <= PANEL.leftX + PANEL.width
        && mouse.y >= PANEL.y && mouse.y <= PANEL.y + PANEL.height;
      const right = mouse.x >= PANEL.rightX && mouse.x <= PANEL.rightX + PANEL.width
        && mouse.y >= PANEL.y && mouse.y <= PANEL.y + PANEL.height;
      if (left || right) {
        const panelIndex = left ? 0 : 1;
        const panelX = left ? PANEL.leftX : PANEL.rightX;
        const imagePoint = {
          x: ((mouse.x - panelX) / PANEL.width) * 1000,
          y: ((mouse.y - PANEL.y) / PANEL.height) * 1000,
        };
        drawMagnifierLens(ctx, panelIndex === 0 ? images.a : images.b, panelIndex, mouse, imagePoint);
      }
    }
  }
  if (state.screen === SCREEN_WIN) drawWinOverlay(ctx, state);
  else if (state.screen === SCREEN_PAUSE) drawPauseOverlay(ctx, state);
  else if (state.screen === SCREEN_TIMEUP) drawTimeUpOverlay(ctx, state);
}
