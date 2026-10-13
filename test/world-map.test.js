// @vitest-environment jsdom
// The world map: the unicorn on the world she's in, the way home, and the
// levels. These tests load the real map page into jsdom, a simulated
// browser page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOP_MS } from '../public/game/unicorn.js';

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const html = (name) => {
  const page = readFileSync(resolve(process.cwd(), 'public', name), 'utf8');
  return page.slice(page.indexOf('<body'), page.indexOf('</body>'));
};

// Open the map at `search` (like '?mane=blue') and run its script.
async function open(search = '', body = html('world-map.html')) {
  vi.stubGlobal('location', { href: `http://localhost/world-map.html${search}`, search });
  document.body.outerHTML = body;
  vi.resetModules();
  await import('../public/game/world-map.js');
}

const meadow = () => document.querySelector('[data-world="meadow"]');

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the worlds', () => {
  it('are all five, in order', async () => {
    await open();
    const worlds = [...document.querySelectorAll('.world')].map((w) => w.dataset.world);
    expect(worlds).toEqual(['meadow', 'candy', 'cloud', 'crystal', 'night']);
  });

  it('start with only the Meadow open', async () => {
    await open();
    expect(meadow().classList.contains('locked')).toBe(false);
    expect(meadow().querySelector('.island').disabled).toBe(false);
    for (const world of document.querySelectorAll('.world:not([data-world="meadow"])')) {
      expect(world.classList.contains('locked')).toBe(true);
      expect(world.querySelector('.island').disabled).toBe(true);
      expect(world.querySelector('.padlock')).not.toBeNull();
    }
  });

  it('tell screen readers which are locked, and which one she\'s in', async () => {
    await open();
    const labels = [...document.querySelectorAll('.island')].map((i) => i.getAttribute('aria-label'));
    expect(labels).toEqual(['Meadow', 'Candy Canyon, locked', 'Cloud Kingdom, locked', 'Crystal Caves, locked', 'Night Sky, locked']);
    expect(meadow().querySelector('.island').getAttribute('aria-pressed')).toBe('true');
  });
});

describe('the unicorn', () => {
  it('stands on the Meadow, and nowhere else', async () => {
    await open();
    expect(document.querySelectorAll('svg.unicorn')).toHaveLength(1);
    expect(meadow().querySelector('.perch svg.unicorn')).not.toBeNull();
  });

  it('keeps the mane she had on the start screen', async () => {
    await open('?mane=yellow');
    expect(document.querySelector('svg.unicorn').dataset.mane).toBe('yellow');
  });

  it('is pink if she came without one', async () => {
    await open();
    expect(document.querySelector('svg.unicorn').dataset.mane).toBe('pink');
  });
});

describe('the Home button', () => {
  it('goes back to the start screen, with her mane', async () => {
    await open('?mane=blue');
    const home = document.querySelector('.home-btn');
    expect(home.getAttribute('href')).toBe('./index.html?mane=blue');
    expect(home.getAttribute('aria-label')).toBe('Home');
  });
});

describe('the levels', () => {
  it('are five, with only the first open', async () => {
    await open();
    const levels = [...document.querySelectorAll('.level')];
    expect(levels.map((l) => l.textContent)).toEqual(['1', '2', '3', '4', '5']);
    expect(levels.map((l) => l.disabled)).toEqual([false, true, true, true, true]);
    expect(levels[0].classList.contains('next')).toBe(true);
  });

  it('get a hop from her when the open one is tapped', async () => {
    await open();
    document.querySelector('.level.next').click();
    expect(meadow().classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(HOP_MS);
    expect(meadow().classList.contains('hopping')).toBe(false);
  });

  it('ignore taps mid-hop, so a later hop isn\'t cut short', async () => {
    await open();
    const level = document.querySelector('.level.next');
    level.click();
    vi.advanceTimersByTime(HOP_MS - 1);
    level.click(); // mid-hop: ignored
    vi.advanceTimersByTime(1);
    level.click(); // a new hop
    vi.advanceTimersByTime(HOP_MS - 1);
    expect(meadow().classList.contains('hopping')).toBe(true); // still going
    vi.advanceTimersByTime(1);
    expect(meadow().classList.contains('hopping')).toBe(false);
  });
});

describe('a page without the map', () => {
  it('is left alone', async () => {
    await open('', '<body><button class="level">1</button></body>');
    document.querySelector('.level').click();
    expect(document.querySelector('svg')).toBeNull();
  });
});
