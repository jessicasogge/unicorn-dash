// The unicorn's running, jumping and dashing (game/runner.js), on small
// made-up courses.
import { describe, expect, it } from 'vitest';
import {
  AIR_JUMPS, BOUNCE, COYOTE, DASH, DASH_TIME, GLIDE_FALL, GRAVITY, HOLD_TO_DASH, JUMP, KNOCK_TIME, RIDE, RUN, STAR_REACH, WALL_FRONT,
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
  it('starts at the start, on the ground', () => {
    const state = createRunner(course({ start: 50 }));
    expect(state).toMatchObject({ x: 50, y: 0, grounded: true, finished: false });
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

  it('flies level and fast', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH + DT, HOLD);
    const { x, y } = state;
    run(state, 0.2, HOLD);
    expect(state.y).toBe(y);
    expect(state.x - x).toBeCloseTo(DASH * 0.2, -1);
  });

  it('lasts a while, not forever, however long the button is held', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH + DASH_TIME - 0.1, HOLD);
    expect(state.dashing).toBe(true);
    run(state, 0.2, HOLD);
    expect(state.dashing).toBe(false);
    expect(run(state, 5, HOLD)).not.toContain('dash'); // still held: no new dash
    expect(state.grounded).toBe(true); // back down, running
  });

  it('glides her gently down once it runs out, while still held', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH + DASH_TIME + 0.2, HOLD);
    expect(state.grounded).toBe(false);
    expect(state.vy).toBe(-GLIDE_FALL);
    const { x } = state;
    run(state, 0.1, HOLD);
    expect(state.x - x).toBeCloseTo(RUN * 0.1, -1); // at running speed
    expect(runUntil(state, 'land')).toBe(true);
  });

  it('falls normally, not gliding, once let go', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH + DASH_TIME + 0.05, HOLD);
    run(state, 0.2);
    expect(state.vy).toBeLessThan(-GLIDE_FALL);
  });

  it('comes again after letting go and pressing again, once she\'s down', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, HOLD_TO_DASH + DASH_TIME + 0.2, HOLD);
    runUntil(state, 'land');
    step(state, DT, IDLE);
    run(state, 0.1, { ...TAP });
    expect(run(state, HOLD_TO_DASH, HOLD)).toContain('dash');
  });

  it('comes only once each time she\'s up in the air, so tapping can\'t keep her up', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, 0.5, HOLD); // a jump into a dash
    expect(state.dashing).toBe(true);
    step(state, DT, IDLE); // let go, up in the air
    step(state, DT, TAP);
    expect(run(state, 0.5, HOLD)).not.toContain('dash');
    expect(state.dashing).toBe(false);
  });

  it('keeps going off an edge, for as long as it lasts', () => {
    const state = createRunner(course({ ground: [[-100, 100], [800, 5000]] }));
    step(state, DT, TAP);
    run(state, 0.5, HOLD);
    expect(state.grounded).toBe(false);
    expect(state.dashing).toBe(true);
  });

  it('stops when the button\'s let go', () => {
    const state = createRunner(course());
    step(state, DT, TAP);
    run(state, 0.3, HOLD);
    step(state, DT, IDLE);
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

  it('can happen when a dash is let go over a gap', () => {
    const state = createRunner(course({ ground: [[-100, 100], [3000, 5000]] }));
    step(state, DT, TAP);
    run(state, 0.5, HOLD);
    expect(runUntil(state, 'fall')).toBe(true);
  });
});

describe('gumdrops', () => {
  it('bounce her up high when she runs onto one', () => {
    const state = createRunner(course({ bouncers: [100] }));
    const events = run(state, 0.3);
    expect(events).toContain('bounce');
    expect(state.bounced).toBe(0);
    let top = 0;
    for (let i = 0; i < 200; i++) { step(state, DT, IDLE); top = Math.max(top, state.y); }
    expect(top).toBeCloseTo((BOUNCE * BOUNCE) / (2 * GRAVITY), -1);
    expect(top).toBeGreaterThan(2 * (JUMP * JUMP) / (2 * GRAVITY) - 10); // about twice a jump
  });

  it('give her air jump back, to go higher still', () => {
    const state = createRunner(course({ bouncers: [100] }));
    run(state, 0.3);
    expect(state.airJumps).toBe(0);
    expect(step(state, DT, TAP)).toContain('jump');
  });

  it('say which gumdrop it was', () => {
    const state = createRunner(course({ bouncers: [100, 900] }));
    run(state, 4);
    expect(state.bounced).toBe(1);
  });

  it('are dashed straight over, without a bounce', () => {
    const state = createRunner(course({ bouncers: [300] }));
    step(state, DT, TAP);
    run(state, 0.5, HOLD); // dashing level, above the ground
    const events = run(state, 0.5, HOLD);
    expect(events).not.toContain('bounce');
  });

  it('aren\'t in a course without any', () => {
    const state = createRunner(course());
    expect(run(state, 2)).not.toContain('bounce');
  });
});

describe('paint pots', () => {
  const pot = (more = {}) => course({ pots: [{ x: 200, mane: 'blue' }], ...more });

  it('starts her with the mane she came with', () => {
    expect(createRunner(course(), 'yellow').mane).toBe('yellow');
    expect(createRunner(course()).mane).toBeNull();
  });

  it('change her mane when she runs through a pot', () => {
    const state = createRunner(pot(), 'pink');
    const events = run(state, 0.8);
    expect(events).toContain('paint');
    expect(state).toMatchObject({ mane: 'blue', painted: 0 });
  });

  it('don\'t splash again for a pot already her color', () => {
    const state = createRunner(pot(), 'blue');
    expect(run(state, 0.8)).not.toContain('paint');
  });

  it('paint her again at the next pot of another color', () => {
    const state = createRunner(course({ pots: [{ x: 200, mane: 'blue' }, { x: 600, mane: 'yellow' }] }), 'pink');
    const events = run(state, 3);
    expect(events.filter((e) => e === 'paint')).toHaveLength(2);
    expect(state).toMatchObject({ mane: 'yellow', painted: 1 });
  });

  it('don\'t stand in her way', () => {
    const state = createRunner(pot(), 'pink');
    run(state, 2);
    expect(state.x).toBeCloseTo(RUN * 2, -1);
    expect(state.knock).toBe(0);
  });

  it('dips her mane even when she jumps at a pot, but not from high above it', () => {
    const low = createRunner(pot(), 'pink');
    run(low, 100 / RUN);
    step(low, DT, TAP);
    run(low, 0.6);
    expect(low.mane).toBe('blue');

    const high = createRunner(course({ pots: [{ x: 200, mane: 'blue' }], bouncers: [60] }), 'pink');
    run(high, 0.8); // bounced high over it
    expect(high.mane).toBe('pink');
  });
});

describe('crystal walls', () => {
  const wall = (more = {}) => course({ walls: [600], ...more });

  it('break when she dashes into one, and she keeps going', () => {
    const state = createRunner(wall());
    step(state, DT, TAP);
    const events = run(state, 2, HOLD);
    expect(events).toContain('smash');
    expect(state.smashed).toEqual(new Set([0]));
    expect(state.hit).toBe(0);
    expect(state.x).toBeGreaterThan(600);
  });

  it('knock her back, with a hop, if she just runs into one', () => {
    const state = createRunner(wall());
    let thudAt = null;
    for (let t = 0; t < 3 && thudAt === null; t += DT) if (step(state, DT, IDLE).includes('thud')) thudAt = state.x;
    expect(thudAt).toBeLessThan(600 - WALL_FRONT);
    run(state, KNOCK_TIME / 2);
    expect(state.x).toBeLessThan(thudAt);
    expect(state.smashed.size).toBe(0);
  });

  it('can\'t be jumped or bounced over', () => {
    for (const more of [{}, { bouncers: [400] }]) {
      const state = createRunner(wall(more));
      if (!more.bouncers) { run(state, 0.5); step(state, DT, TAP); }
      expect(run(state, 3)).toContain('thud');
    }
  });

  it('still stand in her way until she dashes, however often she runs at one', () => {
    const state = createRunner(wall());
    const events = run(state, 6);
    expect(events.filter((e) => e === 'thud').length).toBeGreaterThan(2);
    expect(state.x).toBeLessThan(600);
  });

  it('can be dashed through right after a knock back, by holding on', () => {
    const state = createRunner(wall());
    for (let t = 0; t < 3; t += DT) if (step(state, DT, IDLE).includes('thud')) break;
    step(state, DT, TAP);
    expect(run(state, 3, HOLD)).toContain('smash');
  });

  it('stay broken: running past later is fine', () => {
    const state = createRunner(wall());
    step(state, DT, TAP);
    run(state, 2, HOLD);
    state.x = 400;
    expect(run(state, 2)).not.toContain('thud');
  });
});

describe('shooting stars', () => {
  const star = { x: 500, y: 260, length: 1000 };
  const sky = (more = {}) => course({ stars: [star], ...more });
  // Puts her up by the star, as if a gumdrop had launched her there.
  const upBy = (state, x = star.x - STAR_REACH - 5) => {
    state.x = x;
    state.y = star.y;
    state.vy = 0;
    state.grounded = false;
  };

  it('carry her when she touches one, level, at its speed', () => {
    const state = createRunner(sky());
    upBy(state);
    expect(runUntil(state, 'ride')).toBe(true);
    expect(state.riding).toBe(0);
    const x = state.x;
    run(state, 0.5);
    expect(state.y).toBe(star.y);
    expect(state.x - x).toBeCloseTo(RIDE * 0.5, -1);
  });

  it('aren\'t touched from the ground', () => {
    const state = createRunner(sky());
    run(state, 3);
    expect(state.riding).toBeNull();
    expect(state.rode.size).toBe(0);
  });

  it('carry her whatever she presses, even a jump or a dash', () => {
    const state = createRunner(sky());
    upBy(state);
    runUntil(state, 'ride');
    const events = run(state, 0.5, TAP);
    expect(events).not.toContain('jump');
    expect(events).not.toContain('dash');
    expect(state.y).toBe(star.y);
  });

  it('drop her off at their end, to fall and land', () => {
    const state = createRunner(sky());
    upBy(state);
    runUntil(state, 'ride');
    expect(runUntil(state, 'hop-off')).toBe(true);
    expect(state.x).toBeGreaterThanOrEqual(star.x + star.length);
    expect(state.riding).toBeNull();
    expect(state.rode.has(0)).toBe(true);
    expect(runUntil(state, 'land')).toBe(true);
    expect(state.dashing).toBe(false);
  });

  it('let her dash on straight away, if she\'s holding as she hops off', () => {
    const state = createRunner(sky());
    upBy(state);
    runUntil(state, 'ride');
    let events = [];
    while (!events.includes('hop-off')) events = step(state, DT, HOLD);
    expect(step(state, DT, HOLD)).toContain('dash');
    expect(state.y).toBe(star.y); // flying on, level
  });

  it('carry her only once each', () => {
    const state = createRunner(sky());
    upBy(state);
    runUntil(state, 'ride');
    runUntil(state, 'hop-off');
    upBy(state); // back up by it, somehow
    expect(run(state, 0.2)).not.toContain('ride');
  });

  it('catch diamonds along the way', () => {
    const state = createRunner(sky({ gems: [[900, star.y + 50]] }));
    upBy(state);
    runUntil(state, 'ride');
    expect(runUntil(state, 'gem')).toBe(true);
    expect(state.riding).toBe(0);
  });

  it('can take her all the way to the castle', () => {
    const state = createRunner(sky({ castle: 1000 }));
    upBy(state);
    runUntil(state, 'ride');
    expect(runUntil(state, 'finish')).toBe(true);
    expect(state.finished).toBe(true);
    expect(state.riding).toBe(0);
  });

  it('aren\'t in a course without any', () => {
    const state = createRunner(course());
    upBy(state);
    expect(run(state, 0.5)).not.toContain('ride');
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
  it('are caught when she touches one', () => {
    const state = createRunner(course({ gems: [[100, 50], [5000, 50]] }));
    const events = run(state, 1);
    expect(events.filter((e) => e === 'gem')).toHaveLength(1);
    expect(state.collected).toEqual(new Set([0]));
  });

  it('are missed when she jumps right over them', () => {
    const state = createRunner(course({ gems: [[150, 50]] }));
    run(state, 0.1);
    step(state, DT, TAP);
    run(state, 1);
    expect(state.collected.size).toBe(0);
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
