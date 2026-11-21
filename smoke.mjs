// Double Vision — interactive smoke test (not part of the entry). Serves game/,
// plays it like a person: opens the title, starts the hunt, clicks a real
// difference (the harbour sun), clicks a wrong spot, spends a hint, pauses and
// resumes, and screenshots each step into smoke/ for a human to look at.
// Usage: node smoke.mjs
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/scratch/gta6-game-01/tools/node_modules/playwright-core/index.js');

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'smoke');
mkdirSync(outDir, { recursive: true });
const SHELL = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PORT = 8093;

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not come up');
}

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: 'ignore', env: { ...process.env } });
try {
  await waitForServer(`http://localhost:${PORT}/`);
  const browser = await chromium.launch({
    executablePath: SHELL,
    args: ['--use-gl=swiftshader', '--use-angle=swiftshader', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/1-title.png` });
  // Start the hunt (Start button is at 540..740 x 560..616).
  await page.mouse.click(640, 588);
  await page.waitForTimeout(500);
  // Click the harbour sun on the LEFT panel: image (885,165) -> screen (24+0.885*600, 100+0.165*375) = (555, 162).
  await page.mouse.click(555, 162);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/2-found-sun.png` });
  // Click a wrong spot: empty sky on the left panel.
  await page.mouse.click(300, 150);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/3-miss.png` });
  // Spend a hint with the H key.
  await page.keyboard.press('KeyH');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/4-hint.png` });
  // Hover the right panel to open the magnifier.
  await page.mouse.move(1000, 300);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/5-magnifier.png` });
  // Pause with P, then resume.
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/6-pause.png` });
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(400);
  // Keyboard play: move the crosshair onto the pink roof and guess with Enter.
  // Crosshair starts at image (500,500); the roof is at (395,460): move left/up.
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/7-crosshair.png` });
  console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
} finally {
  server.kill();
}
