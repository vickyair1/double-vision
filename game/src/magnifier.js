// The magnifier lens: a round window that follows the pointer over a picture and
// shows that patch of the scene twice as large, so a well-hidden difference can be
// studied up close. Drawn last, over the panels, with a gold rim and crosshair ticks.

import { MAGNIFIER, PANEL } from './config.js';

/**
 * Draw the lens at a logical point over one panel. `image` is the scene picture for
 * that panel; `imagePoint` is the pointer in image space (0..1000). The lens samples
 * a small patch of the image and paints it enlarged inside a clipped circle.
 */
export function drawMagnifierLens(ctx, image, panelX, mouse, imagePoint) {
  if (!image) return;
  const radius = MAGNIFIER.radius;
  const zoom = MAGNIFIER.zoom;
  const sourceWidth = (radius * 2) / zoom / PANEL.width * 1000;
  const sourceHeight = (radius * 2) / zoom / PANEL.height * 1000;
  const sourceX = Math.min(1000 - sourceWidth, Math.max(0, imagePoint.x - sourceWidth / 2));
  const sourceY = Math.min(1000 - sourceHeight, Math.max(0, imagePoint.y - sourceHeight / 2));
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const sx = (sourceX / 1000) * imageWidth;
  const sy = (sourceY / 1000) * imageHeight;
  const sw = (sourceWidth / 1000) * imageWidth;
  const sh = (sourceHeight / 1000) * imageHeight;

  ctx.save();
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, mouse.x - radius, mouse.y - radius, radius * 2, radius * 2);
  // Crosshair ticks inside the lens.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mouse.x - radius, mouse.y);
  ctx.lineTo(mouse.x - radius + 12, mouse.y);
  ctx.moveTo(mouse.x + radius - 12, mouse.y);
  ctx.lineTo(mouse.x + radius, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - radius);
  ctx.lineTo(mouse.x, mouse.y - radius + 12);
  ctx.moveTo(mouse.x, mouse.y + radius - 12);
  ctx.lineTo(mouse.x, mouse.y + radius);
  ctx.stroke();
  ctx.restore();

  // Gold rim and a soft shadow around the lens.
  ctx.save();
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#f5b921';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, radius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // The panel the lens sits over, as a caption under it.
  ctx.save();
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(16, 22, 35, 0.85)';
  const label = panelX === 0 ? 'LEFT — original ×2' : 'RIGHT — changed ×2';
  const width = ctx.measureText(label).width + 18;
  const labelY = Math.min(mouse.y + radius + 22, 712);
  ctx.beginPath();
  ctx.roundRect(mouse.x - width / 2, labelY - 14, width, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#f2f5fa';
  ctx.fillText(label, mouse.x, labelY);
  ctx.restore();
}
