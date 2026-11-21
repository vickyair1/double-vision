// Double Vision — screenshot harness. Serves game/ via its own serve.ts, drives the
// Playwright headless shell, reads shots.json, waits for window.__shotReady, and
// saves JPEGs at q82, retrying lower until each is <= 256 KiB.
// Usage: node capture.mjs [name-filter]
import { spawn } from 'node:child_process';
import { mkdirSync, statSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/scratch/gta6-game-01/tools/node_modules/playwright-core/index.js');

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'screenshots');
const filter = process.argv[2];
mkdirSync(outDir, { recursive: true });

const SHOTS = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'))
  .filter((s) => !filter || s.name.includes(filter));

const SHELL = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PORT = 8092;

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

const server = spawn('node', ['serve.ts', '--port', String(PORT)], {
  cwd: here,
  stdio: 'ignore',
  env: { ...process.env },
});
let hadError = false;
try {
  await waitForServer(`http://localhost:${PORT}/`);
  const browser = await chromium.launch({
    executablePath: SHELL,
    args: [
      '--use-gl=swiftshader', '--use-angle=swiftshader',
      '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    ],
  });
  try {
    for (const shot of SHOTS) {
      const url = `http://localhost:${PORT}${shot.query}`;
      console.log(`--- ${shot.name} <- ${url}`);
      const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console: ${m.text()}`);
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      try {
        await page.waitForFunction(() => window.__shotReady === true, undefined, { timeout: 120000 });
      } catch (e) {
        console.log(`  FAILED waiting for __shotReady: ${e.message.split('\n')[0]}`);
        for (const err of errors) console.log(`  ERROR ${err}`);
        hadError = true;
        await page.close();
        continue;
      }
      const outPath = `${outDir}/${shot.name}`;
      let quality = 82;
      await page.screenshot({ path: outPath, type: 'jpeg', quality, timeout: 180000 });
      while (statSync(outPath).size > 256 * 1024 && quality > 40) {
        quality -= 10;
        await page.screenshot({ path: outPath, type: 'jpeg', quality, timeout: 180000 });
      }
      console.log(`  ${shot.name}: ${statSync(outPath).size} bytes at q${quality}`);
      for (const err of errors) console.log(`  ERROR ${err}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
if (hadError) process.exitCode = 1;
