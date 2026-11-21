// Double Vision — keyboard-guess test (not part of the entry). Starts the hunt,
// holds ArrowLeft/ArrowUp to walk the crosshair onto the pink roof, guesses with
// Enter, and screenshots the result.
// Usage: node keytest.mjs
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
const PORT = 8094;

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
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.mouse.click(640, 588); // Start
  await page.waitForTimeout(400);
  // Crosshair starts at image (500,500). Roof is at (395,460), r 46.
  // Hold Left ~250ms (105 units) then Up ~130ms (55 units).
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(130);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/8-key-crosshair.png` });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/9-key-guess.png` });
  console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
} finally {
  server.kill();
}
