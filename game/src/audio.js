// Sound effects, synthesized with WebAudio: no audio files, no network, nothing to
// load. A find chimes, a miss buzzes low, a hint blips, a win plays a little arpeggio,
// and the last ten seconds tick. Created lazily on the first user gesture; M mutes.

let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function audioContext() {
  if (context === null) {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** One short oscillator note: frequency, when it starts, how long, how loud, shape. */
function note(frequency, startAt, duration, volume, shape = 'sine') {
  if (muted) return;
  const ctx = audioContext();
  if (ctx === null) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = shape;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(ctx.currentTime + startAt);
  oscillator.stop(ctx.currentTime + startAt + duration + 0.05);
}

/** Two rising notes: the satisfying mark on each find. */
export function playFindChime() {
  note(660, 0, 0.14, 0.18);
  note(990, 0.09, 0.22, 0.18);
}

/** A low buzz for a wrong guess. */
export function playMissBuzz() {
  note(160, 0, 0.22, 0.16, 'sawtooth');
  note(110, 0.05, 0.22, 0.12, 'sawtooth');
}

/** A soft blip when a hint is spent. */
export function playHintBlip() {
  note(880, 0, 0.1, 0.12, 'triangle');
  note(1174, 0.08, 0.14, 0.12, 'triangle');
}

/** A click for buttons and scene changes. */
export function playClick() {
  note(520, 0, 0.06, 0.1, 'triangle');
}

/** A rising arpeggio when a scene is cleared. */
export function playWinFanfare() {
  [523, 659, 784, 1046].forEach((frequency, index) => {
    note(frequency, index * 0.11, 0.24, 0.16);
  });
}

/** A short tick when the clock is nearly out. */
export function playTick() {
  note(1200, 0, 0.05, 0.08, 'square');
}
