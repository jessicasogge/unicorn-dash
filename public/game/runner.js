// The unicorn's running, jumping and dashing, step by step. No drawing
// here: meadow.js shows what this works out.
//
// She runs right on her own. A press jumps (a second press in the air
// jumps again). Holding on for a moment starts a rainbow dash: faster,
// flying level, using up sparkle. Gems refill it. Falling into a gap puts
// her back at the last flag she passed.

export const RUN = 280; // speed, world units a second
export const DASH = 560;
export const GRAVITY = 1800;
export const JUMP = 720; // upward speed when she jumps
export const COYOTE = 0.12; // seconds after running off an edge she can still jump
export const AIR_JUMPS = 1;
export const HOLD_TO_DASH = 0.18; // seconds held before a dash starts
export const SPARKLE_MAX = 5;
export const SPARKLE_START = 3;
export const SPARKLE_DRAIN = 3; // a second, while dashing
export const FALL_LIMIT = -400; // below this, she's fallen
export const GEM_REACH = 50;

export function createRunner(course) {
  return {
    course,
    x: course.checkpoints[0],
    y: 0,
    vy: 0,
    grounded: true,
    coyote: 0, // time left to jump after running off an edge
    airJumps: 0,
    held: 0, // seconds the button's been held
    dashing: false,
    sparkle: SPARKLE_START,
    checkpoint: course.checkpoints[0],
    collected: new Set(),
    finished: false,
  };
}

// The tops she can stand on at `x`.
function surfacesAt(course, x) {
  const tops = course.ground.filter(([from, to]) => x >= from && x <= to).map(() => 0);
  for (const cloud of course.clouds) if (x >= cloud.from && x <= cloud.to) tops.push(cloud.top);
  return tops;
}

// Moves her on by `dt` seconds. `input.pressed` is a new press this step,
// `input.held` whether it's still held. Returns what happened, for sounds
// and sparkles: 'jump', 'dash', 'gem', 'land', 'respawn', 'finish'.
export function step(state, dt, input) {
  const events = [];
  if (state.finished) return events;

  state.coyote = Math.max(0, state.coyote - dt);
  if (input.pressed) {
    if (state.grounded || state.coyote > 0) {
      state.vy = JUMP;
      state.grounded = false;
      state.coyote = 0;
      events.push('jump');
    } else if (state.airJumps < AIR_JUMPS) {
      state.vy = JUMP;
      state.airJumps += 1;
      events.push('jump');
    }
  }

  state.held = input.held ? state.held + dt : 0;
  const wantsDash = state.held >= HOLD_TO_DASH && state.sparkle > 0;
  if (wantsDash && !state.dashing) events.push('dash');
  state.dashing = wantsDash;

  if (state.dashing) {
    state.sparkle = Math.max(0, state.sparkle - SPARKLE_DRAIN * dt);
    state.vy = 0; // flies level
  } else if (!state.grounded) {
    state.vy -= GRAVITY * dt;
  }

  state.x += (state.dashing ? DASH : RUN) * dt;
  const before = state.y;
  state.y += state.vy * dt;

  // Landing: coming down through the top of something under her.
  const tops = surfacesAt(state.course, state.x);
  const landing = tops.filter((top) => state.vy <= 0 && before >= top && state.y <= top);
  if (landing.length) {
    if (!state.grounded) events.push('land');
    state.y = Math.max(...landing);
    state.vy = 0;
    state.grounded = true;
    state.airJumps = 0;
  } else if (state.grounded && !tops.includes(state.y)) {
    state.grounded = false; // ran off an edge, but can still jump for a moment
    state.coyote = COYOTE;
  }

  for (const cp of state.course.checkpoints) {
    if (state.grounded && state.x >= cp && cp > state.checkpoint) state.checkpoint = cp;
  }

  state.course.gems.forEach(([gx, gy], i) => {
    if (state.collected.has(i)) return;
    if (Math.abs(gx - state.x) < GEM_REACH && Math.abs(gy - (state.y + 50)) < GEM_REACH + 10) {
      state.collected.add(i);
      state.sparkle = Math.min(SPARKLE_MAX, state.sparkle + 1);
      events.push('gem');
    }
  });

  if (state.y < FALL_LIMIT) {
    Object.assign(state, {
      x: state.checkpoint, y: 0, vy: 0, grounded: true, coyote: 0, airJumps: 0, dashing: false,
      // A fall is never a dead end: enough sparkle to try the dash again.
      sparkle: Math.max(state.sparkle, SPARKLE_START),
    });
    events.push('respawn');
  }

  if (state.x >= state.course.castle) {
    state.finished = true;
    state.dashing = false;
    events.push('finish');
  }

  return events;
}
