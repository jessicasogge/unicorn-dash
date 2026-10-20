// The Meadow's course (game/course.js), played by pretend players using
// the real physics, to check every gap is fair: short ones take a jump
// with plenty of time to press, long ones need a dash, and it can be won.
import { describe, expect, it } from 'vitest';
import { CANDY, CLOUD, CRYSTAL, LEVELS, MEADOW, NIGHT } from '../public/game/course.js';
import { DASH, GRAVITY, HOLD_TO_DASH, JUMP, RIDE, RUN, createRunner, step } from '../public/game/runner.js';

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

  it('can be crossed with a dash', () => {
    for (const gap of long) {
      const hold = HOLD_TO_DASH + gap.width / DASH + 0.3;
      expect(tryGap(gap, gap.from - 60, { hold }), `gap at ${gap.from}`).toBe(true);
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

  it('keeps the ground going well past the castle, so there\'s no empty sky at the end', () => {
    const [, to] = MEADOW.ground.at(-1);
    // Even on a wide screen (2.5 times as wide as tall), with her a third of the way in
    expect(to - MEADOW.castle).toBeGreaterThanOrEqual(600 * 2.5);
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

describe('Candy Canyon', () => {
  const candyGaps = CANDY.ground.slice(1).map(([to], i) => ({ from: CANDY.ground[i][1], to, width: to - CANDY.ground[i][1] }));

  it('is listed with the other levels', () => {
    expect(LEVELS.candy).toBe(CANDY);
  });

  it('has short gaps to jump and long ones to dash, like the Meadow', () => {
    expect(candyGaps.filter((g) => g.width < 200).length).toBeGreaterThanOrEqual(2);
    expect(candyGaps.filter((g) => g.width >= 200).length).toBeGreaterThanOrEqual(2);
  });

  it('lands her back on solid ground after every gumdrop bounce', () => {
    for (const x of CANDY.bouncers) {
      const state = createRunner(CANDY);
      state.x = x - 100;
      let bounced = false;
      for (let t = 0; t < 3 && !state.fallen; t += 1 / 60) {
        if (step(state, 1 / 60, { pressed: false, held: false }).includes('bounce')) bounced = true;
        if (bounced && state.grounded) break;
      }
      expect(bounced, `gumdrop at ${x}`).toBe(true);
      expect(state.fallen, `gumdrop at ${x}`).toBe(false);
      expect(state.grounded, `gumdrop at ${x}`).toBe(true);
    }
  });

  it('has diamonds up high above each gumdrop', () => {
    for (const x of CANDY.bouncers) {
      expect(CANDY.gems.some(([gx, gy]) => gx > x && gx < x + 400 && gy > 300), `gumdrop at ${x}`).toBe(true);
    }
  });

  it('can be won with every diamond, just jumping short gaps and dashing long ones, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      const state = createRunner(CANDY);
      let holdUntil = 0;
      for (let t = 0; t < 60 && !state.finished && !state.fallen; t += dt) {
        let input = { pressed: false, held: t < holdUntil };
        const next = candyGaps.find((g) => g.from > state.x);
        if (next && state.grounded && state.y === 0 && next.from - state.x < 40 && t >= holdUntil) {
          input = { pressed: true, held: next.width >= 200 };
          if (next.width >= 200) holdUntil = t + HOLD_TO_DASH + next.width / DASH + 0.3;
        }
        step(state, dt, input);
      }
      expect(state.finished, `at ${dt}`).toBe(true);
      expect(state.collected.size, `at ${dt}`).toBe(CANDY.gems.length);
    }
  });

  it('keeps the ground going well past the castle', () => {
    expect(CANDY.ground.at(-1)[1] - CANDY.castle).toBeGreaterThanOrEqual(600 * 2.5);
  });

  it('has just a few lollipop trees, so they aren\'t distracting', () => {
    expect(CANDY.trees.length).toBeGreaterThanOrEqual(4);
    expect(CANDY.trees.length).toBeLessThanOrEqual(6);
    // spread out: at least a screen's width apart
    CANDY.trees.slice(1).forEach(([x], i) => expect(x - CANDY.trees[i][0]).toBeGreaterThanOrEqual(900));
  });

  it('stands its lollipop trees on the ground, not over gaps', () => {
    for (const [x] of CANDY.trees) {
      expect(CANDY.ground.some(([from, to]) => x >= from && x + 60 <= to), `tree at ${x}`).toBe(true);
    }
  });
});

describe('Cloud Kingdom', () => {
  const cloudGaps = CLOUD.ground.slice(1).map(([to], i) => ({ from: CLOUD.ground[i][1], to, width: to - CLOUD.ground[i][1] }));
  const onGround = (x, margin) => CLOUD.ground.some(([from, to]) => x - margin >= from && x + margin <= to);

  it('has a paint pot a short run before each gate, the same color', () => {
    expect(CLOUD.gates.length).toBe(CLOUD.pots.length);
    expect(CLOUD.gates.length).toBeGreaterThanOrEqual(3);
    CLOUD.gates.forEach((gate, i) => {
      const pot = CLOUD.pots[i];
      expect(pot.mane, `gate at ${gate.x}`).toBe(gate.mane);
      expect(gate.x - pot.x, `gate at ${gate.x}`).toBeGreaterThanOrEqual(200);
      expect(gate.x - pot.x, `gate at ${gate.x}`).toBeLessThanOrEqual(400);
    });
  });

  it('uses every mane color for its gates', () => {
    expect(new Set(CLOUD.gates.map((g) => g.mane))).toEqual(new Set(['pink', 'blue', 'yellow']));
  });

  it('changes color from one gate to the next', () => {
    CLOUD.gates.slice(1).forEach((gate, i) => expect(gate.mane).not.toBe(CLOUD.gates[i].mane));
  });

  it('puts its pots and gates on solid ground, with room to be knocked back', () => {
    for (const pot of CLOUD.pots) expect(onGround(pot.x, 100), `pot at ${pot.x}`).toBe(true);
    for (const gate of CLOUD.gates) expect(onGround(gate.x - 450, 0) && onGround(gate.x, 100), `gate at ${gate.x}`).toBe(true);
  });

  it('gets her through every gate from the wrong color, without falling, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      CLOUD.gates.forEach((gate, i) => {
        const state = createRunner(CLOUD, gate.mane === 'pink' ? 'blue' : 'pink');
        state.x = CLOUD.pots[i].x + 60; // just past the pot, the wrong color
        const events = [];
        for (let t = 0; t < 4 && !state.opened.has(i) && !state.fallen; t += dt) events.push(...step(state, dt, { pressed: false, held: false }));
        expect(events, `gate at ${gate.x}`).toContain('bump');
        expect(state.opened.has(i), `gate at ${gate.x}`).toBe(true);
        expect(state.fallen, `gate at ${gate.x}`).toBe(false);
      });
    }
  });

  it('can be won with every diamond, jumping gaps, dashing, and double jumping onto clouds, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      const state = createRunner(CLOUD, 'pink');
      const climbed = new Set();
      let holdUntil = 0;
      let double = false;
      for (let t = 0; t < 60 && !state.finished && !state.fallen; t += dt) {
        let input = { pressed: false, held: t < holdUntil };
        const next = cloudGaps.find((g) => g.from > state.x);
        const cloud = CLOUD.clouds.find((c) => !climbed.has(c) && state.x >= c.from - 240 && state.x < c.from);
        if (cloud && state.grounded) {
          climbed.add(cloud);
          double = true;
          input = { pressed: true, held: false };
        } else if (double && state.vy <= 0 && !state.grounded) {
          double = false;
          input = { pressed: true, held: false };
        } else if (next && state.grounded && state.y === 0 && next.from - state.x < 40 && t >= holdUntil) {
          input = { pressed: true, held: next.width >= 200 };
          if (next.width >= 200) holdUntil = t + HOLD_TO_DASH + next.width / DASH + 0.3;
        }
        step(state, dt, input);
      }
      expect(state.finished, `at ${dt}`).toBe(true);
      expect(state.opened.size, `at ${dt}`).toBe(CLOUD.gates.length);
      expect(state.collected.size, `at ${dt}`).toBe(CLOUD.gems.length);
    }
  });

  it('keeps the ground going well past the castle', () => {
    expect(CLOUD.ground.at(-1)[1] - CLOUD.castle).toBeGreaterThanOrEqual(600 * 2.5);
  });
});

describe('Crystal Caves', () => {
  const caveGaps = CRYSTAL.ground.slice(1).map(([to], i) => ({ from: CRYSTAL.ground[i][1], to, width: to - CRYSTAL.ground[i][1] }));
  const onGround = (x, margin) => CRYSTAL.ground.some(([from, to]) => x - margin >= from && x + margin <= to);

  it('has crystal walls along the way', () => {
    expect(CRYSTAL.walls.length).toBeGreaterThanOrEqual(3);
  });

  it('stands its walls on solid ground, with room behind for a knock back', () => {
    for (const x of CRYSTAL.walls) expect(onGround(x - 450, 0) && onGround(x, 60), `wall at ${x}`).toBe(true);
  });

  it('knocks her back onto solid ground from every wall, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      CRYSTAL.walls.forEach((x, i) => {
        const state = createRunner(CRYSTAL);
        state.x = x - 200;
        state.smashed = new Set(CRYSTAL.walls.map((_, j) => j).filter((j) => j !== i));
        const events = [];
        for (let t = 0; t < 3; t += dt) events.push(...step(state, dt, { pressed: false, held: false }));
        expect(events, `wall at ${x}`).toContain('thud');
        expect(state.fallen, `wall at ${x}`).toBe(false);
      });
    }
  });

  it('can be won with every diamond, dashing through the walls, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      const state = createRunner(CRYSTAL);
      const climbed = new Set();
      const dashedAt = new Set();
      let holdUntil = 0;
      let double = false;
      for (let t = 0; t < 60 && !state.finished && !state.fallen; t += dt) {
        let input = { pressed: false, held: t < holdUntil };
        const next = caveGaps.find((g) => g.from > state.x);
        const cloud = CRYSTAL.clouds.find((c) => !climbed.has(c) && state.x >= c.from - 240 && state.x < c.from);
        const wall = CRYSTAL.walls.find((w, i) => !dashedAt.has(i) && w - 40 - state.x < 120 && w > state.x);
        if (cloud && state.grounded && t >= holdUntil) {
          climbed.add(cloud);
          double = true;
          input = { pressed: true, held: false };
        } else if (double && state.vy <= 0 && !state.grounded) {
          double = false;
          input = { pressed: true, held: false };
        } else if (wall && state.grounded && t >= holdUntil) {
          dashedAt.add(CRYSTAL.walls.indexOf(wall));
          input = { pressed: true, held: true };
          holdUntil = t + 0.6;
        } else if (next && state.grounded && state.y === 0 && next.from - state.x < 40 && t >= holdUntil) {
          input = { pressed: true, held: next.width >= 200 };
          if (next.width >= 200) holdUntil = t + HOLD_TO_DASH + next.width / DASH + 0.3;
        }
        step(state, dt, input);
      }
      expect(state.finished, `at ${dt}`).toBe(true);
      expect(state.smashed.size, `at ${dt}`).toBe(CRYSTAL.walls.length);
      expect(state.collected.size, `at ${dt}`).toBe(CRYSTAL.gems.length);
    }
  });

  it('can be won just by holding the whole way', () => {
    const state = createRunner(CRYSTAL);
    step(state, 1 / 60, { pressed: true, held: true });
    for (let t = 0; t < 30 && !state.finished && !state.fallen; t += 1 / 60) step(state, 1 / 60, { pressed: false, held: true });
    expect(state.finished).toBe(true);
  });

  it('has a few glowing crystals in the background, on solid ground', () => {
    expect(CRYSTAL.crystals.length).toBeGreaterThanOrEqual(4);
    expect(CRYSTAL.crystals.length).toBeLessThanOrEqual(6);
    for (const [x] of CRYSTAL.crystals) expect(onGround(x + 70, 70), `crystals at ${x}`).toBe(true);
  });

  it('keeps the ground going well past the castle', () => {
    expect(CRYSTAL.ground.at(-1)[1] - CRYSTAL.castle).toBeGreaterThanOrEqual(600 * 2.5);
  });
});

describe('the Night Sky', () => {
  const nightGaps = NIGHT.ground.slice(1).map(([to], i) => ({ from: NIGHT.ground[i][1], to, width: to - NIGHT.ground[i][1] }));
  const onGround = (x, margin) => NIGHT.ground.some(([from, to]) => x - margin >= from && x + margin <= to);

  // Jumps short gaps, dashes long ones and the wall: the gumdrops and the
  // shooting stars do the rest.
  function play(dt) {
    const state = createRunner(NIGHT, 'pink');
    const events = [];
    const dashedAt = new Set();
    let holdUntil = 0;
    for (let t = 0; t < 60 && !state.finished && !state.fallen; t += dt) {
      let input = { pressed: false, held: t < holdUntil };
      const next = nightGaps.find((g) => g.from > state.x);
      const wall = NIGHT.walls.find((w, i) => !dashedAt.has(i) && w - 40 - state.x < 120 && w > state.x);
      if (wall && state.grounded && t >= holdUntil) {
        dashedAt.add(NIGHT.walls.indexOf(wall));
        input = { pressed: true, held: true };
        holdUntil = t + 0.6;
      } else if (next && state.grounded && state.y === 0 && next.from - state.x < 40 && t >= holdUntil) {
        input = { pressed: true, held: next.width >= 200 };
        if (next.width >= 200) holdUntil = t + HOLD_TO_DASH + next.width / DASH + 0.3;
      }
      events.push(...step(state, dt, input));
    }
    return { state, events };
  }

  it('is listed with the other levels', () => {
    expect(LEVELS).toEqual({ meadow: MEADOW, candy: CANDY, cloud: CLOUD, crystal: CRYSTAL, night: NIGHT });
  });

  it('has a bit of everything: a gumdrop, a paint pot and gate, a crystal wall', () => {
    expect(NIGHT.bouncers.length).toBeGreaterThanOrEqual(1);
    expect(NIGHT.pots.length).toBeGreaterThanOrEqual(1);
    expect(NIGHT.gates.map((g) => g.mane)).toEqual(NIGHT.pots.map((p) => p.mane));
    expect(NIGHT.walls.length).toBeGreaterThanOrEqual(1);
  });

  it('has a gumdrop to launch her up to each shooting star', () => {
    expect(NIGHT.stars.length).toBeGreaterThanOrEqual(2);
    for (const star of NIGHT.stars) {
      const gumdrop = NIGHT.bouncers.filter((x) => x < star.x).at(-1);
      expect(star.x - gumdrop, `star at ${star.x}`).toBeLessThan(400);
    }
  });

  it('drops her off every shooting star over solid ground', () => {
    for (const star of NIGHT.stars) {
      // where she lands, falling from the star's height while running on
      const fallTime = Math.sqrt((2 * star.y) / GRAVITY);
      expect(onGround(star.x + star.length + RUN * fallTime, 60), `star at ${star.x}`).toBe(true);
    }
  });

  it('carries her over gaps too wide even for a dash, on a shooting star', () => {
    const widest = Math.max(...nightGaps.map((g) => g.width));
    expect(widest).toBeGreaterThan(DASH * 1.2);
    expect(NIGHT.stars.some((s) => s.length * (DASH / RIDE) > widest)).toBe(true);
  });

  it('can be won with every diamond, riding both stars, at 60 or 30 frames a second', () => {
    for (const dt of [1 / 60, 1 / 30]) {
      const { state, events } = play(dt);
      expect(state.finished, `at ${dt}`).toBe(true);
      expect(state.rode.size, `at ${dt}`).toBe(NIGHT.stars.length);
      expect(state.smashed.size, `at ${dt}`).toBe(NIGHT.walls.length);
      expect(state.opened.size, `at ${dt}`).toBe(NIGHT.gates.length);
      expect(events.filter((e) => e === 'bounce'), `at ${dt}`).toHaveLength(NIGHT.bouncers.length);
      expect(state.collected.size, `at ${dt}`).toBe(NIGHT.gems.length);
    }
  });

  it('can be won just by holding the whole way', () => {
    const state = createRunner(NIGHT);
    step(state, 1 / 60, { pressed: true, held: true });
    for (let t = 0; t < 30 && !state.finished && !state.fallen; t += 1 / 60) step(state, 1 / 60, { pressed: false, held: true });
    expect(state.finished).toBe(true);
  });

  it('keeps the ground going well past the castle', () => {
    expect(NIGHT.ground.at(-1)[1] - NIGHT.castle).toBeGreaterThanOrEqual(600 * 2.5);
  });
});
