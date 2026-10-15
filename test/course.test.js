// The Meadow's course (game/course.js), played by pretend players using
// the real physics, to check every gap is fair: short ones take a jump
// with plenty of time to press, long ones need a dash, and it can be won.
import { describe, expect, it } from 'vitest';
import { MEADOW } from '../public/game/course.js';
import { DASH, GRAVITY, HOLD_TO_DASH, JUMP, RUN, SPARKLE_START, createRunner, step } from '../public/game/runner.js';

const DT = 1 / 120;
const gaps = MEADOW.ground.slice(1).map(([to], i) => ({ from: MEADOW.ground[i][1], to, width: to - MEADOW.ground[i][1] }));
const short = gaps.filter((g) => g.width < 200);
const long = gaps.filter((g) => g.width >= 200);

// Starts her running from just after `from`, then plays `press` (at which
// x to press, and how long to hold) and says whether she got past `to`
// without falling.
function tryGap({ from, to }, press, { hold = 0, double = false } = {}) {
  const state = createRunner(MEADOW);
  state.x = from - 400;
  state.sparkle = SPARKLE_START;
  let pressedAt = null;
  let doubled = false;
  for (let t = 0; t < 6; t += DT) {
    let input = { pressed: false, held: false };
    if (pressedAt === null && state.x >= press) {
      pressedAt = t;
      input = { pressed: true, held: hold > 0 };
    } else if (pressedAt !== null && t - pressedAt < hold) {
      input = { pressed: false, held: true };
    } else if (double && !doubled && pressedAt !== null && state.vy <= 0) {
      doubled = true; // second jump at the top of the first
      input = { pressed: true, held: false };
    }
    const events = step(state, DT, input);
    if (events.includes('fall')) return false;
    if (state.grounded && state.x > to + 50) return true;
  }
  return false;
}

describe('the short gaps', () => {
  it('are there, and one jump is enough for each', () => {
    expect(short.length).toBeGreaterThanOrEqual(2);
    for (const gap of short) expect(tryGap(gap, gap.from - 40), `gap at ${gap.from}`).toBe(true);
  });

  it('give at least a third of a second to press jump', () => {
    for (const gap of short) {
      let wins = 0;
      for (let x = gap.from - 400; x <= gap.from + 60; x += 2) if (tryGap(gap, x)) wins += 2;
      expect(wins / RUN, `gap at ${gap.from}`).toBeGreaterThanOrEqual(1 / 3);
    }
  });
});

describe('the long gaps', () => {
  it('are there, and too wide for even the best double jump', () => {
    expect(long.length).toBeGreaterThanOrEqual(2);
    for (const gap of long) {
      for (let x = gap.from - 300; x <= gap.from + 30; x += 5) {
        expect(tryGap(gap, x, { double: true }), `gap at ${gap.from}, jump at ${x}`).toBe(false);
      }
    }
  });

  it('can be crossed with a dash, starting with the sparkle she always has', () => {
    for (const gap of long) {
      const hold = HOLD_TO_DASH + gap.width / DASH + 0.3;
      expect(tryGap(gap, gap.from - 60, { hold }), `gap at ${gap.from}`).toBe(true);
    }
  });

  it('each have gems just before them, to fill up the meter', () => {
    for (const gap of long) {
      const near = MEADOW.gems.filter(([x]) => x > gap.from - 800 && x < gap.from);
      expect(near.length, `gap at ${gap.from}`).toBeGreaterThanOrEqual(2);
    }
  });

});

describe('the course', () => {
  it('starts her on solid ground, with a run-up before the first gap', () => {
    const [from, to] = MEADOW.ground[0];
    expect(MEADOW.start).toBeGreaterThanOrEqual(from);
    expect(to - MEADOW.start).toBeGreaterThan(600);
  });

  it('has sky clouds all along it, up in the sky and on screen', () => {
    expect(MEADOW.sky.length).toBeGreaterThanOrEqual(5);
    for (const [x, y, size] of MEADOW.sky) {
      expect(x).toBeLessThan(MEADOW.castle + 300);
      expect(y).toBeGreaterThan(200); // above her jumps
      expect(y + 70 * size).toBeLessThan(600 - 140); // under the top of the screen
    }
  });

  it('has the castle on the last stretch of ground', () => {
    const [from, to] = MEADOW.ground.at(-1);
    expect(MEADOW.castle).toBeGreaterThan(from);
    expect(MEADOW.castle + 300).toBeLessThan(to);
  });

  it('can be won by a player who jumps short gaps and dashes long ones', () => {
    const state = createRunner(MEADOW);
    let holdUntil = 0;
    let t = 0;
    for (; t < 60 && !state.finished; t += DT) {
      let input = { pressed: false, held: t < holdUntil };
      const next = gaps.find((g) => g.from > state.x);
      if (next && state.grounded && next.from - state.x < 40) {
        input = { pressed: true, held: next.width >= 200 };
        if (next.width >= 200) holdUntil = t + HOLD_TO_DASH + next.width / DASH + 0.3;
      }
      expect(step(state, DT, input)).not.toContain('fall');
    }
    expect(state.finished).toBe(true);
    expect(t).toBeLessThan(40); // a short, sweet run
  });

  it('lets every diamond be caught on the way to the castle, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      const state = createRunner(MEADOW);
      const climbed = new Set();
      let holdUntil = 0;
      let double = false;
      for (let t = 0; t < 60 && !state.finished && !state.fallen; t += dt) {
        let input = { pressed: false, held: t < holdUntil };
        const next = gaps.find((g) => g.from > state.x);
        const cloud = MEADOW.clouds.find((c) => !climbed.has(c) && state.x >= c.from - 240 && state.x < c.from);
        if (cloud && state.grounded) {
          climbed.add(cloud);
          double = true;
          input = { pressed: true, held: false };
        } else if (double && state.vy <= 0 && !state.grounded) {
          double = false;
          input = { pressed: true, held: false };
        } else if (next && state.grounded && next.from - state.x < 40) {
          input = { pressed: true, held: next.width >= 200 };
          if (next.width >= 200) holdUntil = t + HOLD_TO_DASH + next.width / DASH + 0.3;
        }
        step(state, dt, input);
      }
      expect(state.finished, `at ${dt}`).toBe(true);
      expect(state.collected.size, `at ${dt}`).toBe(MEADOW.gems.length);
    }
  });

  it('has gems up on the clouds, out of reach of one jump but not of two', () => {
    const cloudGems = MEADOW.gems.filter(([, y]) => y > 150);
    expect(cloudGems.length).toBeGreaterThan(0);
    for (const cloud of MEADOW.clouds) {
      const state = createRunner(MEADOW);
      state.x = cloud.from - 260;
      expect((JUMP * JUMP) / (2 * GRAVITY)).toBeLessThan(cloud.top); // one jump's height
      let doubled = false;
      step(state, DT, { pressed: true, held: false });
      for (let t = 0; t < 2.5; t += DT) {
        const atTop = !doubled && state.vy <= 0 && !state.grounded;
        if (atTop) doubled = true;
        step(state, DT, { pressed: atTop, held: false });
      }
      const onIt = MEADOW.gems.filter(([x, y]) => y > 150 && x > cloud.from && x < cloud.to);
      expect(onIt.every(([x, y]) => state.collected.has(MEADOW.gems.findIndex(([gx, gy]) => gx === x && gy === y)))).toBe(true);
    }
  });
});
