// @vitest-environment jsdom
// The level pages (game/level.js), mostly through the Meadow: the course
// drawn, her controls, and the castle at the end. Candy Canyon's gumdrops
// are at the bottom. These tests load the real pages into jsdom, a
// simulated browser page, and play them frame by frame.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANDY, MEADOW } from '../public/game/course.js';
import { DASH, HOLD_TO_DASH } from '../public/game/runner.js';

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const html = (name) => {
  const page = readFileSync(resolve(process.cwd(), 'public', name), 'utf8');
  return page.slice(page.indexOf('<body'), page.indexOf('</body>'));
};

let frames;
let now;
let meadow;

// Opens a level page (the Meadow unless told), and presses Go unless told
// not to.
async function open(search = '?mane=blue', { go = true, page = 'meadow.html' } = {}) {
  frames = [];
  now = 0;
  vi.stubGlobal('location', { href: `http://localhost/${page}${search}`, search });
  vi.stubGlobal('requestAnimationFrame', (callback) => frames.push(callback));
  document.body.outerHTML = html(page);
  vi.resetModules();
  meadow = await import('../public/game/level.js');
  if (go) document.querySelector('.go-btn').click();
}

// Runs `count` animation frames, `ms` apart.
function tick(count = 1, ms = 1000 / 60) {
  for (let i = 0; i < count; i++) {
    now += ms;
    const waiting = frames;
    frames = [];
    for (const callback of waiting) callback(now);
  }
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const runner = () => $('.runner');
const x = () => parseFloat(runner().style.left) + 70;
const height = () => parseFloat(runner().style.bottom) - meadow.BASE + 13;
const pointer = (type) => $('.view').dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
const key = (type, k, repeat = false) => window.dispatchEvent(new KeyboardEvent(type, { key: k, repeat, cancelable: true }));

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout'] }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the course', () => {
  it('is drawn from the Meadow\'s plan', async () => {
    await open();
    expect($$('.course .ground')).toHaveLength(MEADOW.ground.length);
    expect($$('.course .cloud-platform')).toHaveLength(MEADOW.clouds.length);
    expect($$('.course .gem')).toHaveLength(MEADOW.gems.length);
    expect($$('.course .flag')).toHaveLength(0); // no flags: a fall is game over
    expect($$('.course [class^="hint"]')).toHaveLength(0); // no finger pictures
    expect($$('.course .sky-cloud')).toHaveLength(MEADOW.sky.length);
    expect($$('.course .castle')).toHaveLength(1);
  });

  it('puts things where the plan says, on the ground', async () => {
    await open();
    const [from, to] = MEADOW.ground[1];
    const ground = $$('.course .ground')[1];
    expect(ground.style.left).toBe(`${from}px`);
    expect(ground.style.width).toBe(`${to - from}px`);
    expect(ground.style.bottom).toBe('0px');
  });

  it('has black windows on the castle', async () => {
    await open();
    const windows = $$('.course .castle .windows path');
    expect(windows.length).toBeGreaterThanOrEqual(3);
    expect($('.course .castle .windows').getAttribute('fill')).toBe('#2B2350');
  });

  it('has her on it, with the mane she came with', async () => {
    await open('?mane=yellow');
    expect($('.course .runner svg.unicorn').dataset.mane).toBe('yellow');
  });

  it('starts her at the beginning, on the ground', async () => {
    await open();
    expect(x()).toBe(MEADOW.start);
    expect(height()).toBe(0);
  });

  it('sizes itself to the screen, and keeps her a little way in from the left', async () => {
    await open();
    const view = $('.view');
    Object.defineProperty(view, 'clientHeight', { value: 900 });
    Object.defineProperty(view, 'clientWidth', { value: 1600 });
    meadow.render();
    const camera = MEADOW.start - (1600 / 1.5) * meadow.LEAD;
    expect($('.course').style.transform).toBe(`scale(1.5) translateX(${-camera}px)`);
  });

  it('zooms out on a narrow screen, like an upright phone, to show the course ahead', async () => {
    await open();
    const view = $('.view');
    Object.defineProperty(view, 'clientHeight', { value: 844 });
    Object.defineProperty(view, 'clientWidth', { value: 390 });
    meadow.render();
    const scale = 390 / meadow.VIEW_WIDTH;
    expect($('.course').style.transform).toMatch(new RegExp(`^scale\\(${scale}\\)`));
  });

  it('slides along under her as she runs', async () => {
    await open();
    const before = $('.course').style.transform;
    tick(30);
    expect(x()).toBeGreaterThan(MEADOW.start);
    expect($('.course').style.transform).not.toBe(before);
  });
});

describe('the directions', () => {
  it('show first, explaining a quick tap and a long tap', async () => {
    await open('?mane=blue', { go: false });
    const directions = $('.directions');
    expect(directions.hidden).toBe(false);
    expect(directions.textContent).toMatch(/Quick tap\s*to jump/);
    expect(directions.textContent).toMatch(/Long tap\s*\(hold\) to rainbow dash/);
    expect(directions.textContent).toMatch(/space bar or the up arrow/);
    expect(directions.textContent).not.toMatch(/sparkle/i); // dashing is unlimited
  });

  it('keep her still until Go', async () => {
    await open('?mane=blue', { go: false });
    tick(60);
    expect(frames).toHaveLength(0);
    expect(x()).toBe(MEADOW.start);
  });

  it('ignore taps on the course behind them', async () => {
    await open('?mane=blue', { go: false });
    pointer('pointerdown');
    $('.go-btn').click();
    tick(10);
    expect(height()).toBe(0); // no jump saved up from before Go
  });

  it('go away on Go, and she starts running', async () => {
    await open('?mane=blue', { go: false });
    $('.go-btn').click();
    expect($('.directions').hidden).toBe(true);
    tick(30);
    expect(x()).toBeGreaterThan(MEADOW.start);
  });

  it('can be closed with the space bar too, without a jump', async () => {
    await open('?mane=blue', { go: false });
    key('keydown', ' ');
    expect($('.directions').hidden).toBe(true);
    tick(10);
    expect(height()).toBe(0);
    expect(x()).toBeGreaterThan(MEADOW.start);
  });

  it('don\'t come back when playing again', async () => {
    await open();
    for (let i = 0; i < 600 && frames.length; i++) {
      tick();
      vi.advanceTimersByTime(1000 / 60);
    }
    $('.retry-btn').click();
    expect($('.directions').hidden).toBe(true);
  });
});

describe('the buttons', () => {
  it('at the Meadow\'s castle include one on to Candy Canyon, with her mane', async () => {
    await open('?mane=yellow');
    const next = $('.finish .next-btn');
    expect(next.getAttribute('href')).toBe('./candy.html?mane=yellow');
    expect(next.getAttribute('aria-label')).toBe('Next level');
  });

  it('go back to the map, with her mane', async () => {
    await open('?mane=blue');
    expect($('.map-btn').getAttribute('href')).toBe('./world-map.html?mane=blue');
    expect($('.finish-map-btn').getAttribute('href')).toBe('./world-map.html?mane=blue');
    expect($('.map-btn').getAttribute('aria-label')).toBe('Back to the map');
  });
});

describe('jumping', () => {
  it('happens on a tap anywhere on the course', async () => {
    await open();
    tick();
    pointer('pointerdown');
    pointer('pointerup');
    tick(10);
    expect(height()).toBeGreaterThan(50);
  });

  it('happens on the space bar or the up arrow', async () => {
    for (const k of [' ', 'ArrowUp']) {
      await open();
      tick();
      key('keydown', k);
      key('keyup', k);
      tick(10);
      expect(height(), k).toBeGreaterThan(50);
    }
  });

  it('doesn\'t scroll the page on the space bar', async () => {
    await open();
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves the space bar to a focused button', async () => {
    await open();
    tick();
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    $('.map-btn').dispatchEvent(event);
    tick(10);
    expect(event.defaultPrevented).toBe(false);
    expect(height()).toBe(0);
  });

  it('ignores other keys, and a key held down repeating', async () => {
    await open();
    tick();
    key('keydown', 'a');
    key('keydown', ' ', true);
    tick(10);
    expect(height()).toBe(0);
  });
});

describe('dashing', () => {
  it('happens when the press is held, with her rainbow showing', async () => {
    await open();
    tick();
    pointer('pointerdown');
    tick(Math.ceil(HOLD_TO_DASH * 60) + 2);
    expect(runner().classList.contains('dashing')).toBe(true);
  });

  it('stops when the press is let go', async () => {
    await open();
    tick();
    key('keydown', ' ');
    tick(20);
    key('keyup', ' ');
    tick();
    expect(runner().classList.contains('dashing')).toBe(false);
  });

  it('keeps going when some other key is let go', async () => {
    await open();
    tick();
    key('keydown', ' ');
    tick(20);
    key('keyup', 'a');
    tick();
    expect(runner().classList.contains('dashing')).toBe(true);
  });

  it('stops if the finger slides off the course', async () => {
    await open();
    tick();
    pointer('pointerdown');
    tick(20);
    pointer('pointerleave');
    tick();
    expect(runner().classList.contains('dashing')).toBe(false);
  });

  it('come in every color, round the rainbow', async () => {
    await open();
    const fills = $$('.course .gem').map((g) => g.querySelector('path').getAttribute('fill'));
    expect(fills.slice(0, meadow.GEM_COLORS.length)).toEqual(meadow.GEM_COLORS);
    expect(new Set(fills).size).toBe(meadow.GEM_COLORS.length);
  });

  it('are counted up at the top right as she catches them', async () => {
    await open();
    const count = $('.level-bar > .gem-count');
    expect(count.previousElementSibling.classList.contains('map-btn')).toBe(true); // map left, count right
    expect(count.querySelector('.count').textContent).toBe('0');
    tick(120);
    const caught = $$('.course .gem.got').length;
    expect(caught).toBeGreaterThan(0);
    expect(count.querySelector('.count').textContent).toBe(String(caught));
    expect(count.getAttribute('aria-label')).toBe(`${caught} diamonds`);
  });

  it('make the counter bounce', async () => {
    await open();
    tick(120);
    expect($('.gem-count').classList.contains('bump')).toBe(true);
  });

  it('count from zero again on a new try', async () => {
    await open();
    for (let i = 0; i < 600 && frames.length; i++) {
      tick();
      vi.advanceTimersByTime(1000 / 60);
    }
    $('.retry-btn').click();
    expect($('.gem-count .count').textContent).toBe('0');
  });
});

describe('falling', () => {
  // Runs with no taps until she drops into the first gap.
  function fall() {
    for (let i = 0; i < 600 && frames.length; i++) {
      tick();
      vi.advanceTimersByTime(1000 / 60);
    }
  }

  it('in a gap stops the run, and shows game over after a moment', async () => {
    await open();
    for (let i = 0; i < 600 && frames.length; i++) tick();
    expect(frames).toHaveLength(0); // stopped
    expect(x()).toBeGreaterThan(MEADOW.ground[0][1]); // past the edge
    expect($('.game-over').hidden).toBe(true);
    vi.advanceTimersByTime(meadow.GAME_OVER_DELAY_MS - 1);
    expect($('.game-over').hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect($('.game-over').hidden).toBe(false);
  });

  it('shows her dizzy, with the mane she came with', async () => {
    await open('?mane=yellow');
    expect($('.oops svg.unicorn').dataset.mane).toBe('yellow');
  });

  it('leaves the castle buttons hidden', async () => {
    await open();
    fall();
    expect($('.finish').hidden).toBe(true);
  });

  it('can be tried again from the start, with every gem back', async () => {
    await open();
    fall();
    expect($$('.course .gem.got').length).toBeGreaterThan(0);
    $('.retry-btn').click();
    expect($('.game-over').hidden).toBe(true);
    expect(x()).toBe(MEADOW.start);
    expect(height()).toBe(0);
    expect($$('.course .gem.got')).toHaveLength(0);
    tick(10);
    expect(x()).toBeGreaterThan(MEADOW.start); // running again
  });

  it('can go back to the map, with her mane', async () => {
    await open('?mane=blue');
    expect($('.over-map-btn').getAttribute('href')).toBe('./world-map.html?mane=blue');
    expect($('.retry-btn').getAttribute('aria-label')).toBe('Try the Meadow again');
  });
});

describe('the castle', () => {
  // Plays the whole level: a tap before each short gap, a hold over each
  // long one, and (with `clouds`) a double jump up onto each cloud for its
  // diamonds. Returns the frames at which she stopped, and the buttons
  // showed.
  function playToTheEnd({ clouds = false } = {}) {
    const gaps = MEADOW.ground.slice(1).map(([to], i) => ({ from: MEADOW.ground[i][1], width: to - MEADOW.ground[i][1] }));
    const climbed = new Set();
    let releaseAt = Infinity;
    let stoppedAt = null;
    let double = false;
    let before = 0;
    let i = 0;
    for (; i < 60 * 60 && $('.finish').hidden; i++) {
      const h = height();
      const grounded = h === 0 || MEADOW.clouds.some((c) => h === c.top);
      const next = gaps.find((g) => g.from > x());
      const cloud = clouds && MEADOW.clouds.find((c) => !climbed.has(c) && x() >= c.from - 240 && x() < c.from);
      if (releaseAt === Infinity) {
        if (cloud && grounded) {
          climbed.add(cloud);
          double = true;
          pointer('pointerdown');
          releaseAt = i + 1;
        } else if (double && !grounded && h < before) {
          double = false; // the second jump, at the top of the first
          pointer('pointerdown');
          releaseAt = i + 1;
        } else if (next && h === 0 && next.from - x() < 40) {
          pointer('pointerdown');
          releaseAt = next.width >= 200 ? i + Math.ceil((HOLD_TO_DASH + next.width / DASH + 0.3) * 60) : i + 1;
        }
      }
      if (i >= releaseAt) {
        pointer('pointerup');
        releaseAt = Infinity;
      }
      before = h;
      tick();
      if (stoppedAt === null && frames.length === 0) stoppedAt = i;
      vi.advanceTimersByTime(1000 / 60);
    }
    return { stoppedAt, shownAt: i - 1 };
  }

  it('ends the level with the castle and two buttons', async () => {
    await open();
    playToTheEnd();
    expect($('.finish').hidden).toBe(false);
    expect(x()).toBeGreaterThanOrEqual(MEADOW.castle);
    expect(frames).toHaveLength(0); // stopped running
    expect($('.replay-btn').getAttribute('aria-label')).toBe('Play the Meadow again');
  });

  it('waits a moment at the castle before the buttons', async () => {
    await open();
    const { stoppedAt, shownAt } = playToTheEnd();
    const waited = (shownAt - stoppedAt) * (1000 / 60);
    expect(waited).toBeGreaterThanOrEqual(meadow.FINISH_DELAY_MS - 1000 / 60);
    expect(waited).toBeLessThanOrEqual(meadow.FINISH_DELAY_MS + 1000 / 60);
  });

  it('has no fireworks without every diamond', async () => {
    await open();
    playToTheEnd();
    expect($$('.course .gem.got').length).toBeLessThan(MEADOW.gems.length);
    expect($$('.course .firework.going')).toHaveLength(0);
  });

  it('sets off fireworks behind it for catching every diamond', async () => {
    await open();
    playToTheEnd({ clouds: true });
    expect($('.gem-count .count').textContent).toBe(String(MEADOW.gems.length));
    const fireworks = $$('.course .firework');
    expect(fireworks.length).toBeGreaterThan(0);
    expect(fireworks.every((f) => f.classList.contains('going'))).toBe(true);
    // behind the castle: drawn before it
    const castle = $('.course .castle');
    expect(fireworks.every((f) => f.compareDocumentPosition(castle) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it('has six fireworks, each bursting once, one after another', async () => {
    await open();
    const fireworks = $$('.course .firework');
    expect(fireworks).toHaveLength(6);
    const delays = fireworks.map((f) => parseFloat(f.style.animationDelay));
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(new Set(delays).size).toBe(6);
  });

  it('stops the fireworks when playing again', async () => {
    await open();
    playToTheEnd({ clouds: true });
    $('.replay-btn').click();
    expect($$('.course .firework.going')).toHaveLength(0);
  });

  it('can be played again from the start, with every gem back', async () => {
    await open();
    playToTheEnd();
    $('.replay-btn').click();
    expect($('.finish').hidden).toBe(true);
    expect(x()).toBe(MEADOW.start);
    expect($$('.course .gem.got')).toHaveLength(0);
    tick(10);
    expect(x()).toBeGreaterThan(MEADOW.start); // running again
  });
});

describe('Candy Canyon', () => {
  const candy = (search = '?mane=blue', options = {}) => open(search, { page: 'candy.html', ...options });

  it('draws its own course, with a gumdrop for each bounce', async () => {
    await candy();
    expect($$('.course .ground')).toHaveLength(CANDY.ground.length);
    expect($$('.course .gem')).toHaveLength(CANDY.gems.length);
    const gumdrops = $$('.course .gumdrop');
    expect(gumdrops).toHaveLength(CANDY.bouncers.length);
    expect(gumdrops[0].style.left).toBe(`${CANDY.bouncers[0] - 45}px`);
  });

  it('has no gumdrops or lollipop trees in the Meadow', async () => {
    await open();
    expect($$('.course .gumdrop')).toHaveLength(0);
    expect($$('.course .lollipop-tree')).toHaveLength(0);
  });

  it('has lollipop trees in the background, behind the ground', async () => {
    await candy();
    const trees = $$('.course .lollipop-tree');
    expect(trees).toHaveLength(CANDY.trees.length);
    expect(trees[0].style.left).toBe(`${CANDY.trees[0][0]}px`);
    // drawn before the ground, so the ground covers their sticks' feet
    const ground = $('.course .ground');
    expect(trees.every((t) => t.compareDocumentPosition(ground) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it('explains the gumdrops in its directions', async () => {
    await candy('?mane=blue', { go: false });
    expect($('.directions').textContent).toMatch(/Gumdrops\s*bounce you up high/);
  });

  it('bounces her up high off a gumdrop, and the gumdrop squishes', async () => {
    await candy();
    let top = 0;
    for (let i = 0; i < 150; i++) {
      tick();
      top = Math.max(top, height());
    }
    expect(top).toBeGreaterThan(300); // far higher than a jump
    expect($$('.course .gumdrop')[0].classList.contains('squish')).toBe(true);
  });

  it('catches diamonds up in the air from a bounce', async () => {
    await candy();
    tick(150);
    const high = CANDY.gems.findIndex(([, y]) => y > 350);
    expect($$('.course .gem')[high].classList.contains('got')).toBe(true);
  });

  it('has no next level button yet, as the last level', async () => {
    await candy();
    expect($('.next-btn')).toBeNull();
  });

  it('can be tried again', async () => {
    await candy('?mane=pink');
    expect($('.retry-btn').getAttribute('aria-label')).toBe('Try Candy Canyon again');
    expect($('.over-map-btn').getAttribute('href')).toBe('./world-map.html?mane=pink');
  });
});
