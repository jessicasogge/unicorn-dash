// @vitest-environment jsdom
// The world map: every world open, the unicorn on the world she's in, and
// the way home. These tests load the real map page into
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

  it('have their names written under them', async () => {
    await open();
    const names = [...document.querySelectorAll('.world')].map((w) => w.querySelector('.island + .world-name').textContent);
    expect(names).toEqual(['Meadow', 'Candy Canyon', 'Cloud Kingdom', 'Crystal Caves', 'Night Sky']);
    // (said once to screen readers, by the circle's label)
    for (const name of document.querySelectorAll('.world-name')) expect(name.getAttribute('aria-hidden')).toBe('true');
  });

  it('open when their name is tapped, too', async () => {
    await open('?mane=blue');
    world('crystal').querySelector('.world-name').click();
    expect(hers()).toBe('crystal');
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./crystal.html?mane=blue');
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
    island('night').click();
    expect(hers()).toBe('night');
    expect(world('night').classList.contains('here')).toBe(true);
    expect(world('meadow').classList.contains('here')).toBe(false);
    expect(island('night').getAttribute('aria-pressed')).toBe('true');
    expect(island('meadow').getAttribute('aria-pressed')).toBe('false');
  });

  it('stays put when her own world is tapped', async () => {
    await open();
    island('night').click();
    island('night').click();
    vi.advanceTimersByTime(HOP_MS);
    expect(hers()).toBe('night');
    expect(island('night').getAttribute('aria-pressed')).toBe('true');
  });

  it('starts on the Meadow every time, whatever the address says', async () => {
    await open('?world=candy');
    expect(hers()).toBe('meadow');
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

describe('nothing saved', () => {
  it('shows no stars or scores', async () => {
    await open();
    expect(document.querySelector('.star, .pill, .star-total, .world-stars')).toBeNull();
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

describe('tapping the flower world', () => {
  it('opens the Meadow after a hop, with her mane', async () => {
    await open('?mane=yellow');
    island('meadow').click();
    expect(world('meadow').classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(HOP_MS - 1);
    expect(location.href).toBe('http://localhost/world-map.html?mane=yellow'); // not yet
    vi.advanceTimersByTime(1);
    expect(location.href).toBe('./meadow.html?mane=yellow');
  });

  it('brings her over first, from another world', async () => {
    await open();
    island('night').click();
    island('meadow').click();
    expect(hers()).toBe('meadow');
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./meadow.html?mane=pink');
  });

  it('ignores a second tap while it opens', async () => {
    await open();
    island('meadow').click();
    vi.advanceTimersByTime(HOP_MS / 2);
    island('meadow').click();
    vi.advanceTimersByTime(HOP_MS / 2);
    expect(location.href).toBe('./meadow.html?mane=pink');
    location.href = 'http://localhost/world-map.html';
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('http://localhost/world-map.html'); // only opened once
  });

  it('opens every world', async () => {
    const { WORLD_PAGES } = await import('../public/game/world-map.js');
    expect(WORLD_PAGES).toEqual({
      meadow: './meadow.html', candy: './candy.html', cloud: './cloud.html', crystal: './crystal.html', night: './night.html',
    });
  });

  it('opens the world tapped last, if another is tapped mid-hop', async () => {
    await open();
    island('meadow').click();
    vi.advanceTimersByTime(HOP_MS / 2);
    island('candy').click();
    expect(world('meadow').classList.contains('hopping')).toBe(false);
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./candy.html?mane=pink');
  });
});

describe('tapping the lollipop world', () => {
  it('opens Candy Canyon after a hop, with her mane', async () => {
    await open('?mane=blue');
    island('candy').click();
    expect(hers()).toBe('candy');
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./candy.html?mane=blue');
  });
});

describe('tapping the cloud world', () => {
  it('opens Cloud Kingdom after a hop, with her mane', async () => {
    await open('?mane=yellow');
    island('cloud').click();
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./cloud.html?mane=yellow');
  });
});

describe('tapping the crystal world', () => {
  it('opens the Crystal Caves after a hop, with her mane', async () => {
    await open('?mane=blue');
    island('crystal').click();
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./crystal.html?mane=blue');
  });
});

describe('tapping the night world', () => {
  it('opens the Night Sky after a hop, with her mane', async () => {
    await open('?mane=yellow');
    island('night').click();
    expect(world('night').classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./night.html?mane=yellow');
  });
});

describe('Return on a keyboard', () => {
  it('opens the world she\'s on, the Meadow at first', async () => {
    await open('?mane=blue');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(world('meadow').classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(HOP_MS);
    expect(location.href).toBe('./meadow.html?mane=blue');
  });
});

describe('no levels on the map', () => {
  it('has no level numbers at the bottom', async () => {
    await open();
    expect(document.querySelector('.levels, .level')).toBeNull();
  });
});

describe('a page without the map', () => {
  it('is left alone', async () => {
    await open('', '<body><p>Nothing here</p></body>');
    expect(document.querySelector('svg')).toBeNull();
  });
});
