[![competition](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/vickyair1/double-vision/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/vickyair1/double-vision/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

# DOUBLE VISION — a spot-the-difference hunt

A complete, original spot-the-difference game that plays offline in a desktop browser from its own files. An entry for [make.fun's "Make the best spot the difference game" bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).

Two pictures side by side — 8 things are different in each scene. Click a difference on either picture to ring it on both. Hints help, misses cost time, and the clock is always running.

## The hunt

6 scenes, 48 differences in all. Every scene is a rich, detailed picture drawn for this game, and its twin hides exactly 8 fair changes: things removed, recoloured, moved or resized — never a trick the eye cannot catch.

| # | Scene | The hunt |
|---|-------|----------|
| 1 | Harbour at Dawn | A striped lighthouse, three little houses, two sailboats — and a sun that changed its mind. |
| 2 | Lantern Night Market | Paper lanterns, fruit stalls, and a ginger cat that slipped away. |
| 3 | The Cozy Library | Shelves of books, a sleeping cat, and a clock that jumped ahead. |
| 4 | Mountain Cabin Winter | Snow, a snowman, and a deer that wandered off. |
| 5 | Sunny Park Picnic | A kite, a patient dog, and a butterfly that did not stay. |
| 6 | Space Station Window | Earth through the porthole, and a toolbox that floated away. |

Later scenes get shorter pars, so the hunt tightens as you go: 2:30 down to 1:40.

## How to play

- **Mouse:** click a difference on either picture. A gold ring with a green check marks it on both. Hover a picture to open the magnifier lens and study a patch twice as large.
- **Keyboard:** arrows move the crosshair, Enter guesses where it sits, Tab switches pictures, H spends a hint, L toggles the magnifier, P pauses, M mutes, 1–6 jump scenes, R restarts, N goes to the next scene.
- **Score:** a find pays 100 plus 25 per streak step; a wrong guess costs 5 seconds and your streak. A hint pulses a ring around one unfound difference and costs 25 points. Clearing a scene pays a time bonus of 5 points per second left, and up to 3 stars.
- **Win a scene:** find all 8 before the timer bar runs out. Your best hunt total is kept in the browser.

## Feel and polish

- A satisfying mark on every find: a gold ring, a green check, a two-note chime, and the difference named aloud on the status line ("The red sail turned yellow").
- A hint that behaves: it only points — you still have to click the difference yourself.
- Time pressure you can feel: the header clock, the timer bar draining green to gold to red, and a tick in the last ten seconds.
- Synthesized sound throughout (find chime, miss buzz, hint blip, win fanfare) made live with WebAudio — no audio files, no network.
- Original everything: own scenes, names, art and sound. Nothing copied from any commercial game.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static server. The game loads only files under `game/` — no network request, no build step.

## Layout

- `main.ts` — hands the entry in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `game/index.html` — the page; a single 1280×720 canvas.
- `game/src/config.js` — tuning, palette, layout, pars, scoring.
- `game/src/scenes.js` — the six scenes and their 48 differences (position, radius, label, kind).
- `game/src/state.js` — screens, scoring, hints, streaks, stars, the clock.
- `game/src/input.js` — mouse and keyboard, crosshair, panel hit testing.
- `game/src/audio.js` — WebAudio sound effects, synthesized.
- `game/src/magnifier.js` — the ×2 lens that follows the pointer.
- `game/src/render.js` — every screen: title, play, pause, win, time-up.
- `game/src/shots.js` — the four fixed screenshot scenes.
- `game/assets/` — the twelve scene pictures (original + changed, 1280×800).
- `screenshots/` — real renders of the game's own code: a mid-hunt frame, the title, a magnifier frame, and a cleared scene.

## Screenshots

1. `1-play.jpg` — mid-hunt: 3 found, 5 left, counter, timer, streak and hints all live.
2. `2-start.jpg` — the title screen over the first scene.
3. `3-play2.jpg` — the night market with the magnifier open over the lanterns.
4. `4-win.jpg` — a cleared scene: three stars and the score breakdown.
