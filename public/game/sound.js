// Soft sounds for what happens in a level, made by the browser as it goes
// (no sound files): each is a few short tones, sliding from one pitch to
// another and fading out. They can be turned off; nothing is saved, so off
// only carries on to the next page in its address (see level.js).

// Each sound's tones: `from` and `to` pitch (Hz), `dur` and `at` (seconds),
// `type` (wave shape) and `gain` (how loud, all of them gentle).
export const SOUNDS = {
  jump: [{ from: 420, to: 760, dur: 0.12 }],
  dash: [{ from: 300, to: 900, dur: 0.25, type: 'triangle', gain: 0.08 }],
  gem: [{ from: 1319, dur: 0.08 }, { from: 1976, dur: 0.16, at: 0.07 }],
  bounce: [{ from: 180, to: 620, dur: 0.25 }],
  paint: [{ from: 900, to: 300, dur: 0.15, type: 'triangle' }],
  smash: [1800, 2400, 1500, 2900].map((from, i) => ({ from, dur: 0.09, at: i * 0.035, type: 'triangle', gain: 0.07 })),
  thud: [{ from: 160, to: 90, dur: 0.18, type: 'triangle', gain: 0.18 }],
  ride: [1047, 1319, 1568, 2093].map((from, i) => ({ from, dur: 0.12, at: i * 0.06, gain: 0.07 })),
  float: [{ from: 300, to: 700, dur: 0.6, gain: 0.06 }],
  pop: [{ from: 1200, to: 1800, dur: 0.06 }],
  ouch: [{ from: 520, to: 180, dur: 0.45, type: 'triangle' }],
  fall: [{ from: 520, to: 180, dur: 0.45, type: 'triangle' }],
  finish: [523, 659, 784, 1047].map((from, i) => ({ from, dur: i === 3 ? 0.4 : 0.16, at: i * 0.12 })),
  fireworks: [0.5, 1, 1.5].map((at) => ({ from: 220, to: 90, dur: 0.2, at: at + 0.4, type: 'triangle', gain: 0.08 })),
};

export function createSound({ on = true } = {}) {
  let context = null;
  return {
    on,
    // Sound has to start from a tap or a key: phones won't play it before
    wake() {
      const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!context && Context) context = new Context();
      if (context?.state === 'suspended') context.resume();
    },
    play(name) {
      if (!this.on || !context) return;
      const now = context.currentTime;
      for (const { from, to = from, dur, at = 0, type = 'sine', gain = 0.12 } of SOUNDS[name]) {
        const start = now + at;
        const tone = context.createOscillator();
        const volume = context.createGain();
        tone.type = type;
        tone.frequency.setValueAtTime(from, start);
        tone.frequency.exponentialRampToValueAtTime(to, start + dur);
        volume.gain.setValueAtTime(gain, start);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        tone.connect(volume).connect(context.destination);
        tone.start(start);
        tone.stop(start + dur + 0.02);
      }
    },
  };
}
