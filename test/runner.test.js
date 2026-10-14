// The unicorn's running, jumping and dashing (game/runner.js), on small
// made-up courses.
import { describe, expect, it } from 'vitest';
import {
  AIR_JUMPS, COYOTE, DASH, GRAVITY, HOLD_TO_DASH, JUMP, RUN, SPARKLE_DRAIN, SPARKLE_MAX, SPARKLE_START,
  createRunner, step,
} from '../public/game/runner.js';

const DT = 1 / 120;
const IDLE = { pressed: false, held: false };
const TAP = { pressed: true, held: true };
const HOLD = { pressed: false, held: true };

// A flat course: ground everywhere, unless changed.
const course = (more = {}) => ({
  ground: [[-1000, 100000]], clouds: [], gems: [], start: 0, castle: 100000, ...more,
});

// Runs `seconds` with the same input (a tap only on the first step).
function run(state, seconds, input = IDLE) {
  const events = [];
  for (let t = 0; t < seconds; t += DT) {
    events.push(...step(state, DT, input));
    if (input.pressed) input = { ...input, pressed: false };
  }
  return events;
}

// Runs until `event` happens (or 10 seconds pass), returning whether it did.
function runUntil(state, event) {
  for (let t = 0; t < 10; t += DT) if (step(state, DT, IDLE).includes(event)) return true;
  return false;
}

describe('running', () => {
  it('starts at the start, on the ground, with some sparkle', () => {
    const state = createRunner(course({ start: 50 }));
    expect(state).toMatchObject({ x: 50, y: 0, grounded: true, sparkle: SPARKLE_START, finished: false });
  });

  it('runs right on her own at a steady speed', () => {
    const state = createRunner(course());
    run(state, 1);
    expect(state.x).toBeCloseTo(RUN, -1);
    expect(state.y).toBe(0);
  });
});

describe('jumping', () => {
  it('goes up and comes back down on a tap', () => {
    const state = createRunner(course());
    const events = run(state, 0.1, TAP);
    expect(events).toContain('jump');
    expect(state.y).toBeGreaterThan(0);
    expect(run(state, 2)).toContain('land');
    expect(state).toMatchObject({ y: 0, grounded: true });
  });

  it('reaches about as high as the physics says', () => {
    const state = createRunner(course());
    let top = 0;
    step(state, DT, TAP);
    for (let i = 0; i < 200; i++) { step(state, DT, IDLE); top = Math.max(top, state.y); }
    expect(top).toBeCloseTo((JUMP * JUMP) / (2 * GRAVITY), -1);
  });

  it('can jump once more in the air, but not again', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, 0.2);
    expect(step(state, DT, TAP)).toContain('jump');
    expect(state.airJumps).toBe(AIR_JUMPS);
    run(state, 0.1);
    const vy = state.vy;
    expect(step(state, DT, TAP)).not.toContain('jump');
    expect(state.vy).toBeLessThan(vy);
  });

  it('gets her air jump back on landing', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, 0.2);
    step(state, DT, TAP);
    run(state, 3);
    expect(state.airJumps).toBe(0);
  });

  it('can still jump just after running off an edge, but not long after', () => {
    const edge = course({ ground: [[-100, 100]] });
    const late = createRunner(edge);
    run(late, 100 / RUN + COYOTE / 2);
    expect(late.grounded).toBe(false);
    expect(step(late, DT, TAP)).toContain('jump');
    expect(late.airJumps).toBe(0); // the ground jump, not the air one

    const tooLate = createRunner(edge);
    run(tooLate, 100 / RUN + COYOTE * 2);
    step(tooLate, DT, TAP);
    expect(tooLate.airJumps).toBe(1); // only the air jump was left
  });
});

describe('dashing', () => {
  it('starts once the button is held for a moment', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH - 2 * DT, HOLD);
    expect(state.dashing).toBe(false);
    expect(run(state, 3 * DT, HOLD)).toContain('dash');
    expect(state.dashing).toBe(true);
  });

  it('flies level and fast, using up sparkle', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH + DT, HOLD);
    const { x, y, sparkle } = state;
    run(state, 0.2, HOLD);
    expect(state.y).toBe(y);
    expect(state.x - x).toBeCloseTo(DASH * 0.2, -1);
    expect(sparkle - state.sparkle).toBeCloseTo(SPARKLE_DRAIN * 0.2, 1);
  });

  it('stops when the button\'s let go', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, 0.3, HOLD);
    step(state, DT, IDLE);
    expect(state.dashing).toBe(false);
  });

  it('stops when the sparkle runs out, and can\'t start without any', () => {
    const state = createRunner(course());
    state.sparkle = 0.1;
    step(state, DT, TAP);
    run(state, 1, HOLD);
    expect(state.sparkle).toBe(0);
    expect(state.dashing).toBe(false);
  });

  it('carries her over a gap too wide to jump', () => {
    const gap = course({ ground: [[-100, 100], [700, 5000]] });
    const state = createRunner(gap);
    run(state, 90 / RUN);
    step(state, DT, TAP);
    const events = run(state, 3, HOLD);
    expect(events).not.toContain('fall');
    expect(state.x).toBeGreaterThan(700);
  });
});

describe('falling', () => {
  it('into a gap is game over', () => {
    const state = createRunner(course({ ground: [[-100, 300]] }));
    expect(runUntil(state, 'fall')).toBe(true);
    expect(state).toMatchObject({ fallen: true, dashing: false });
  });

  it('stops everything after: no more running or jumping', () => {
    const state = createRunner(course({ ground: [[-100, 300]] }));
    runUntil(state, 'fall');
    const { x, y } = state;
    expect(run(state, 1, TAP)).toEqual([]);
    expect(state).toMatchObject({ x, y });
  });

  it('can happen mid-dash when the sparkle runs out over a gap', () => {
    const state = createRunner(course({ ground: [[-100, 100], [3000, 5000]] }));
    state.sparkle = 0.5;
    step(state, DT, TAP);
    run(state, 1, HOLD);
    expect(runUntil(state, 'fall')).toBe(true);
  });
});

describe('clouds', () => {
  it('can be landed on from above, and walked off', () => {
    const state = createRunner(course({ clouds: [{ from: 60, to: 400, top: 100 }] }));
    step(state, DT, TAP);
    const events = run(state, 0.8);
    expect(events).toContain('land');
    expect(state.y).toBe(100);
    run(state, 1.5);
    expect(state.y).toBe(0); // off the end, and back down
  });

  it('can be jumped up through from below', () => {
    const state = createRunner(course({ clouds: [{ from: -100, to: 400, top: 60 }] }));
    step(state, DT, TAP);
    run(state, 0.1);
    expect(state.y).toBeGreaterThan(60);
  });
});

describe('gems', () => {
  it('are caught when she touches one, adding a sparkle', () => {
    const state = createRunner(course({ gems: [[100, 50], [5000, 50]] }));
    const events = run(state, 1);
    expect(events.filter((e) => e === 'gem')).toHaveLength(1);
    expect(state.collected).toEqual(new Set([0]));
    expect(state.sparkle).toBe(SPARKLE_START + 1);
  });

  it('are missed when she jumps right over them', () => {
    const state = createRunner(course({ gems: [[150, 50]] }));
    run(state, 0.1);
    step(state, DT, TAP);
    run(state, 1);
    expect(state.collected.size).toBe(0);
  });

  it('can\'t fill the meter past full', () => {
    const state = createRunner(course({ gems: [[100, 50], [200, 50], [300, 50]] }));
    state.sparkle = SPARKLE_MAX - 1;
    run(state, 2);
    expect(state.sparkle).toBe(SPARKLE_MAX);
  });
});

describe('the castle', () => {
  it('ends the run once she reaches it, and then nothing moves', () => {
    const state = createRunner(course({ castle: 200 }));
    expect(run(state, 1)).toContain('finish');
    expect(state.finished).toBe(true);
    const x = state.x;
    expect(run(state, 1, TAP)).toEqual([]);
    expect(state.x).toBe(x);
  });

  it('stops a dash', () => {
    const state = createRunner(course({ castle: 300 }));
    step(state, DT, TAP);
    run(state, 1, HOLD);
    expect(state).toMatchObject({ finished: true, dashing: false });
  });
});
