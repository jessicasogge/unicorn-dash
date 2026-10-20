// Level movement: auto-run right; tap to jump (double jump), hold to dash.
// Running onto a gumdrop bounces her up high. Running through a paint pot
// changes her mane color; a gate only lets the matching color through, and
// knocks her back (over the pot again) otherwise. Crystal walls only break
// for a rainbow dash, and knock her back otherwise.
// Dash is faster, level flight, for as long as it's held. Gems are counted.
// Falling in a gap is game over. No drawing; meadow.js renders it.

export const RUN = 280; // speed, world units a second
export const DASH = 560;
export const GRAVITY = 1800;
export const JUMP = 720; // upward speed when she jumps
export const COYOTE = 0.12; // seconds after running off an edge she can still jump
export const AIR_JUMPS = 1;
export const HOLD_TO_DASH = 0.18; // seconds held before a dash starts
export const FALL_LIMIT = -400; // below this, she's fallen
export const GEM_REACH = 50;
export const BOUNCE = 1100; // upward speed off a gumdrop: about twice a jump's height
export const GUMDROP_WIDTH = 90;
export const POT_REACH = 45; // how near a paint pot she has to pass, along x
export const POT_HEIGHT = 150; // and under this, to dip into it
export const GATE_FRONT = 80; // the gate's front edge, this far before its middle
export const KNOCK_TIME = 0.6; // seconds she's knocked back by a wrong gate
export const KNOCK_SPEED = 600; // going backwards, world units a second
export const KNOCK_HOP = 520; // with a little hop
export const WALL_FRONT = 40; // a crystal wall's front edge, this far before its middle

// `mane` is her mane color's name (like 'pink'), for the gates.
export function createRunner(course, mane = null) {
  return {
    course,
    mane,
    knock: 0, // time left being knocked back by a wrong gate
    painted: null, // the last paint pot she went through
    bumped: null, // the last gate that knocked her back
    opened: new Set(), // the gates she's gone through
    smashed: new Set(), // the crystal walls she's dashed through
    hit: null, // the last wall she smashed or bumped into
    x: course.start,
    y: 0,
    vy: 0,
    grounded: true,
    coyote: 0, // time left to jump after running off an edge
    airJumps: 0,
    held: 0, // seconds the button's been held
    dashing: false,
    collected: new Set(),
    finished: false, // at the castle
    fallen: false, // in a gap: game over
    bounced: null, // the last gumdrop she bounced on
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
// and effects: 'jump', 'dash', 'gem', 'land', 'bounce', 'paint', 'open',
// 'bump', 'smash', 'thud', 'fall', 'finish'.
export function step(state, dt, input) {
  const events = [];
  if (state.finished || state.fallen) return events;

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
  state.knock = Math.max(0, state.knock - dt);
  const wantsDash = state.held >= HOLD_TO_DASH && state.knock === 0;
  if (wantsDash && !state.dashing) events.push('dash');
  state.dashing = wantsDash;

  if (state.dashing) {
    state.vy = 0; // flies level
  } else if (!state.grounded) {
    state.vy -= GRAVITY * dt;
  }

  const from = state.x;
  state.x += (state.knock > 0 ? -KNOCK_SPEED : state.dashing ? DASH : RUN) * dt;
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

  // On the ground over a gumdrop (not dashing past it): boing!
  const gumdrop = (state.course.bouncers ?? []).findIndex((x) => Math.abs(state.x - x) <= GUMDROP_WIDTH / 2);
  if (gumdrop >= 0 && state.grounded && state.y === 0 && !state.dashing) {
    state.vy = BOUNCE;
    state.grounded = false;
    state.airJumps = 0;
    state.bounced = gumdrop;
    events.push('bounce');
  }

  // Through a paint pot: her mane takes its color
  (state.course.pots ?? []).forEach((pot, i) => {
    if (state.mane !== pot.mane && Math.abs(state.x - pot.x) < POT_REACH && state.y < POT_HEIGHT) {
      state.mane = pot.mane;
      state.painted = i;
      events.push('paint');
    }
  });

  // Up to a gate: through it with the matching mane, knocked back without
  (state.course.gates ?? []).forEach((gate, i) => {
    const front = gate.x - GATE_FRONT; // it opens, or knocks her back, as she arrives
    // (at any height: no jumping, bouncing or dashing over a gate)
    if (state.opened.has(i) || from >= front || state.x < front) return;
    if (state.mane === gate.mane) {
      state.opened.add(i);
      events.push('open');
    } else {
      state.x = front - 1;
      state.knock = KNOCK_TIME;
      state.vy = KNOCK_HOP;
      state.grounded = false;
      state.dashing = false;
      state.bumped = i;
      events.push('bump');
    }
  });

  // Up to a crystal wall: a dash smashes through, anything else bumps back
  (state.course.walls ?? []).forEach((wallX, i) => {
    const front = wallX - WALL_FRONT;
    if (state.smashed.has(i) || from >= front || state.x < front) return;
    state.hit = i;
    if (state.dashing) {
      state.smashed.add(i);
      events.push('smash');
    } else {
      state.x = front - 1;
      state.knock = KNOCK_TIME;
      state.vy = KNOCK_HOP;
      state.grounded = false;
      events.push('thud');
    }
  });

  state.course.gems.forEach(([gx, gy], i) => {
    if (state.collected.has(i)) return;
    if (Math.abs(gx - state.x) < GEM_REACH && Math.abs(gy - (state.y + 50)) < GEM_REACH + 10) {
      state.collected.add(i);
      events.push('gem');
    }
  });

  if (state.y < FALL_LIMIT) {
    state.fallen = true;
    state.dashing = false;
    events.push('fall');
    return events;
  }

  if (state.x >= state.course.castle) {
    state.finished = true;
    state.dashing = false;
    events.push('finish');
  }

  return events;
}
