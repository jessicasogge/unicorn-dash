// Level movement: auto-run right; tap to jump (double jump), hold to dash.
// Running onto a gumdrop bounces her up high. Running through a paint pot
// changes her mane color, just for fun. Crystal walls only break
// for a rainbow dash, and knock her back otherwise. Touching a shooting
// star, she rides it through the sky, then drops off at its end. Every
// world has prickly things on the ground (thistles, spiky candy...) to jump
// over: running into one is game over, like falling in a gap.
// Dash is faster, level flight, for a while: then, still held, she glides
// gently down, and it takes letting go and pressing again to dash again
// (once each time she's up in the air). Gems are counted.
// Falling in a gap is game over. No drawing; meadow.js renders it.

export const RUN = 280; // speed, world units a second
export const DASH = 560;
export const GRAVITY = 1800;
export const JUMP = 720; // upward speed when she jumps
export const COYOTE = 0.12; // seconds after running off an edge she can still jump
export const AIR_JUMPS = 1;
export const HOLD_TO_DASH = 0.18; // seconds held before a dash starts
export const DASH_TIME = 1.5; // longest a dash lasts, in seconds
export const GLIDE_FALL = 220; // fastest she falls gliding, after a dash runs out
export const FALL_LIMIT = -400; // below this, she's fallen
export const GEM_REACH = 50;
export const BOUNCE = 1100; // upward speed off a gumdrop: about twice a jump's height
export const GUMDROP_WIDTH = 90;
export const POT_REACH = 45; // how near a paint pot she has to pass, along x
export const POT_HEIGHT = 150; // and under this, to dip into it
export const KNOCK_TIME = 0.6; // seconds she's knocked back by a crystal wall
export const KNOCK_SPEED = 600; // going backwards, world units a second
export const KNOCK_HOP = 520; // with a little hop
export const WALL_FRONT = 40; // a crystal wall's front edge, this far before its middle
export const THORN_REACH = 30; // how near a prickly thing she can run, along x (less than it's drawn, to be fair)
export const THORN_HEIGHT = 50; // and under this, she runs into it
export const RIDE = 640; // a shooting star's speed, carrying her
export const STAR_REACH = 70; // how near a shooting star she has to get, along x
export const STAR_REACH_Y = 90; // and up or down

// `mane` is her mane color's name (like 'pink'), for the paint pots.
export function createRunner(course, mane = null) {
  return {
    course,
    mane,
    knock: 0, // time left being knocked back by a crystal wall
    painted: null, // the last paint pot she went through
    smashed: new Set(), // the crystal walls she's dashed through
    hit: null, // the last wall she smashed or bumped into
    riding: null, // the shooting star she's riding, if any
    rode: new Set(), // the shooting stars she's ridden
    x: course.start,
    y: 0,
    vy: 0,
    grounded: true,
    coyote: 0, // time left to jump after running off an edge
    airJumps: 0,
    held: 0, // seconds the button's been held
    dashing: false,
    dashTime: 0, // seconds into this dash
    spent: false, // this press's dash has run out: let go to dash again
    airDashed: false, // she's dashed since last on the ground
    collected: new Set(),
    finished: false, // at the castle
    fallen: false, // in a gap, or into something prickly: game over
    ouch: null, // the prickly thing she ran into, if she did
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
// and effects: 'jump', 'dash', 'gem', 'land', 'bounce', 'paint',
// 'smash', 'thud', 'ride', 'hop-off', 'ouch', 'fall', 'finish'.
export function step(state, dt, input) {
  const events = [];
  if (state.finished || state.fallen) return events;

  // On a shooting star: it carries her along, level, to its end, whatever
  // she presses
  if (state.riding !== null) {
    const star = state.course.stars[state.riding];
    state.x += RIDE * dt;
    state.y = star.y;
    if (state.x >= star.x + star.length) {
      state.rode.add(state.riding);
      state.riding = null;
      state.vy = 0;
      state.held = input.held ? HOLD_TO_DASH : 0; // still holding: dash on straight away
      state.spent = false;
      state.airDashed = false;
      events.push('hop-off');
    }
    catchGems(state, events);
    finishAt(state, events);
    return events;
  }

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
  if (!input.held) state.spent = false; // let go: ready to dash again
  state.knock = Math.max(0, state.knock - dt);
  const wasDashing = state.dashing;
  // One dash each time she's up in the air, so tapping again can't keep her up
  const canDash = !state.spent && state.knock === 0 && (wasDashing || state.grounded || !state.airDashed);
  state.dashing = state.held >= HOLD_TO_DASH && canDash;
  if (state.dashing && !wasDashing) {
    state.dashTime = 0;
    events.push('dash');
  }
  if (state.dashing) {
    state.dashTime += dt;
    if (state.dashTime >= DASH_TIME) {
      state.dashing = false; // ran out
      state.spent = true;
    }
  }
  if (wasDashing && !state.dashing && !state.grounded) state.airDashed = true;

  if (state.dashing) {
    state.vy = 0; // flies level
  } else if (!state.grounded) {
    state.vy -= GRAVITY * dt;
    if (input.held && state.spent) state.vy = Math.max(state.vy, -GLIDE_FALL); // glides down
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
    state.airDashed = false;
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

  // Up to a shooting star: on she gets
  (state.course.stars ?? []).forEach((star, i) => {
    if (state.riding !== null || state.rode.has(i)) return;
    if (Math.abs(state.x - star.x) < STAR_REACH && Math.abs(state.y - star.y) < STAR_REACH_Y) {
      state.riding = i;
      state.y = star.y;
      state.vy = 0;
      state.grounded = false;
      state.dashing = false;
      state.airJumps = 0;
      events.push('ride');
    }
  });

  catchGems(state, events);

  // Into something prickly: ouch, game over
  const thorn = (state.course.thorns ?? []).findIndex((x) => Math.abs(state.x - x) < THORN_REACH && state.y < THORN_HEIGHT);
  if (thorn >= 0) {
    state.fallen = true;
    state.dashing = false;
    state.ouch = thorn;
    events.push('ouch');
    return events;
  }

  if (state.y < FALL_LIMIT) {
    state.fallen = true;
    state.dashing = false;
    events.push('fall');
    return events;
  }

  finishAt(state, events);

  return events;
}

function catchGems(state, events) {
  state.course.gems.forEach(([gx, gy], i) => {
    if (state.collected.has(i)) return;
    if (Math.abs(gx - state.x) < GEM_REACH && Math.abs(gy - (state.y + 50)) < GEM_REACH + 10) {
      state.collected.add(i);
      events.push('gem');
    }
  });
}

function finishAt(state, events) {
  if (state.x >= state.course.castle) {
    state.finished = true;
    state.dashing = false;
    events.push('finish');
  }
}
