// @vitest-environment jsdom
// The world map: every world and level open, the unicorn on the world
// she's in, and the way home. These tests load the real map page into
// jsdom, a simulated browser page.
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
  vi.spyOn(history, 'replaceState').mockImplementation(() => {});
  document.body.outerHTML = body;
  vi.resetModules();
  await import('../public/game/world-map.js');
}

const world = (name) => document.querySelector(`[data-world="${name}"]`);
const island = (name) => world(name).querySelector('.island');
// The world she's standing on
const hers = () => document.querySelector('svg.unicorn').closest('.world').dataset.world;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the worlds', () => {
  it('are all five, in order', async () => {
    await open();
    const worlds = [...document.querySelectorAll('.world')].map((w) => w.dataset.world);
    expect(worlds).toEqual(['meadow', 'candy', 'cloud', 'crystal', 'night']);
  });

  it('are all open: nothing locked', async () => {
    await open();
    for (const button of document.querySelectorAll('.island')) expect(button.disabled).toBe(false);
    expect(document.querySelector('.locked, .padlock, [disabled]')).toBeNull();
  });

  it('have names for screen readers', async () => {
    await open();
    const labels = [...document.querySelectorAll('.island')].map((i) => i.getAttribute('aria-label'));
    expect(labels).toEqual(['Meadow', 'Candy Canyon', 'Cloud Kingdom', 'Crystal Caves', 'Night Sky']);
  });
});

describe('the unicorn', () => {
  it('starts on the Meadow, and only there', async () => {
    await open();
    expect(document.querySelectorAll('svg.unicorn')).toHaveLength(1);
    expect(hers()).toBe('meadow');
    expect(island('meadow').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('.world.here')).toHaveLength(1);
  });

  it('goes to whichever world is tapped', async () => {
    await open();
    island('crystal').click();
    expect(hers()).toBe('crystal');
    expect(world('crystal').classList.contains('here')).toBe(true);
    expect(world('meadow').classList.contains('here')).toBe(false);
    expect(island('crystal').getAttribute('aria-pressed')).toBe('true');
    expect(island('meadow').getAttribute('aria-pressed')).toBe('false');
  });

  it('puts the world in the address, so Back returns to it', async () => {
    await open('?mane=blue');
    island('night').click();
    expect(history.replaceState).toHaveBeenLastCalledWith(null, '', '?mane=blue&world=night');
  });

  it('starts on the world in the address', async () => {
    await open('?mane=pink&world=candy');
    expect(hers()).toBe('candy');
  });

  it('starts on the Meadow if the address names no real world', async () => {
    await open('?world=moon');
    expect(hers()).toBe('meadow');
  });

  it('stays put when her own world is tapped', async () => {
    await open();
    island('meadow').click();
    expect(hers()).toBe('meadow');
    expect(history.replaceState).not.toHaveBeenCalled();
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
  it('are five, all open', async () => {
    await open();
    const levels = [...document.querySelectorAll('.level')];
    expect(levels.map((l) => l.textContent)).toEqual(['1', '2', '3', '4', '5']);
    expect(levels.every((l) => !l.disabled)).toBe(true);
  });

  it('get a hop from her when one is tapped', async () => {
    await open();
    document.querySelectorAll('.level')[3].click();
    expect(world('meadow').classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(HOP_MS);
    expect(world('meadow').classList.contains('hopping')).toBe(false);
  });

  it('get the hop on the world she\'s moved to', async () => {
    await open();
    island('cloud').click();
    document.querySelector('.level').click();
    expect(world('cloud').classList.contains('hopping')).toBe(true);
  });

  it('ignore taps mid-hop, so a later hop isn\'t cut short', async () => {
    await open();
    const level = document.querySelector('.level');
    level.click();
    vi.advanceTimersByTime(HOP_MS - 1);
    level.click(); // mid-hop: ignored
    vi.advanceTimersByTime(1);
    level.click(); // a new hop
    vi.advanceTimersByTime(HOP_MS - 1);
    expect(world('meadow').classList.contains('hopping')).toBe(true); // still going
    vi.advanceTimersByTime(1);
    expect(world('meadow').classList.contains('hopping')).toBe(false);
  });

  it('stop a hop when she moves to another world', async () => {
    await open();
    document.querySelector('.level').click();
    island('candy').click();
    expect(world('meadow').classList.contains('hopping')).toBe(false);
  });
});

describe('a page without the map', () => {
  it('is left alone', async () => {
    await open('', '<body><button class="level">1</button></body>');
    document.querySelector('.level').click();
    expect(document.querySelector('svg')).toBeNull();
  });
});
