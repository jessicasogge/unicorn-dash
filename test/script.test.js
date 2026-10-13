// @vitest-environment jsdom
// script.js runs the start screen: tap the unicorn for a new mane color,
// press Play and she dashes off to the world map. These tests load the real start page into
// jsdom, a simulated browser page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const html = (name) => {
  const page = readFileSync(resolve(process.cwd(), 'public', name), 'utf8');
  return page.slice(page.indexOf('<body'), page.indexOf('</body>'));
};

let timings;
let location;

// Open the start page (at `search`, like '?mane=blue') and run script.js on it.
async function open(body = html('index.html'), search = '') {
  location = { href: `http://localhost/index.html${search}`, search };
  vi.stubGlobal('location', location);
  vi.spyOn(history, 'replaceState').mockImplementation(() => {});
  document.body.outerHTML = body;
  vi.resetModules();
  timings = await import('../public/script.js');
  return {
    stage: document.querySelector('.stage'),
    unicorn: document.querySelector('.unicorn-btn'),
    play: document.querySelector('.play-btn'),
  };
}

// Fake timers, so the hops and dashes can be stepped through, and can't
// fire after a test has finished and its simulated page is gone.
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// The browser's Back button, showing the page as it was left.
const comeBack = () => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

describe('the start screen', () => {
  it('draws the unicorn, with a pink mane', async () => {
    const { unicorn } = await open();
    const svg = unicorn.querySelector('svg.unicorn');
    expect(svg).not.toBeNull();
    expect(svg.dataset.mane).toBe('pink');
  });

  it('keeps the mane she had, coming back from the map', async () => {
    const { unicorn } = await open(html('index.html'), '?mane=yellow');
    expect(unicorn.querySelector('svg').dataset.mane).toBe('yellow');
  });

  it('has a Play button screen readers can name, with no words to read', async () => {
    const { play } = await open();
    expect(play.getAttribute('aria-label')).toBe('Play');
    expect(play.textContent.trim()).toBe('');
    expect(play.disabled).toBe(false);
  });

  it('starts with her standing still on the stage', async () => {
    const { stage } = await open();
    expect([...stage.classList]).toEqual(['stage']);
  });
});

describe('tapping the unicorn', () => {
  it('changes her mane to the next color', async () => {
    const { unicorn } = await open();
    unicorn.click();
    expect(unicorn.querySelector('svg').dataset.mane).toBe('blue');
  });

  it('puts her new color in the page\'s address, for the Back button', async () => {
    const { unicorn } = await open();
    unicorn.click();
    expect(history.replaceState).toHaveBeenLastCalledWith(null, '', '?mane=blue');
  });

  it('makes her hop, just for as long as the hop takes', async () => {
    const { stage, unicorn } = await open();
    unicorn.click();
    expect(stage.classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(timings.HOP_MS - 1);
    expect(stage.classList.contains('hopping')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(stage.classList.contains('hopping')).toBe(false);
  });

  it('ignores taps mid-hop, so no color is skipped without a hop', async () => {
    const { unicorn } = await open();
    unicorn.click();
    unicorn.click();
    expect(unicorn.querySelector('svg').dataset.mane).toBe('blue');
  });

  it('goes through all three colors and back to pink', async () => {
    const { unicorn } = await open();
    const seen = [];
    for (let i = 0; i < 3; i++) {
      unicorn.click();
      seen.push(unicorn.querySelector('svg').dataset.mane);
      vi.advanceTimersByTime(timings.HOP_MS);
    }
    expect(seen).toEqual(['blue', 'yellow', 'pink']);
  });
});

describe('pressing Play', () => {
  it('sends her dashing off, and the button can\'t be pressed twice', async () => {
    const { stage, play } = await open();
    play.click();
    expect(stage.classList.contains('dashing')).toBe(true);
    expect(play.disabled).toBe(true);
  });

  it('stops a hop that was going on', async () => {
    const { stage, unicorn, play } = await open();
    unicorn.click();
    play.click();
    expect(stage.classList.contains('hopping')).toBe(false);
  });

  it('opens the world map once she\'s gone', async () => {
    const { play } = await open();
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS - 1);
    expect(location.href).toBe('http://localhost/index.html'); // not yet
    vi.advanceTimersByTime(1);
    expect(location.href).toBe('./world-map.html?mane=pink');
  });

  it('takes her mane color with her', async () => {
    const { unicorn, play } = await open();
    unicorn.click();
    vi.advanceTimersByTime(timings.HOP_MS);
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS);
    expect(location.href).toBe('./world-map.html?mane=blue');
  });

  it('ignores taps on her while she\'s dashing', async () => {
    const { stage, unicorn, play } = await open();
    play.click();
    unicorn.click();
    expect(unicorn.querySelector('svg').dataset.mane).toBe('pink');
    expect(stage.classList.contains('hopping')).toBe(false);
  });
});

describe('coming back with the Back button', () => {
  // The browser can show the page exactly as it was left: her gone, and
  // Play pressed and stuck.
  it('trots her back in, and Play works again', async () => {
    const { stage, play } = await open();
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS);
    comeBack();
    expect(stage.classList.contains('dashing')).toBe(false);
    expect(stage.classList.contains('returning')).toBe(true);
    expect(play.disabled).toBe(false);
    vi.advanceTimersByTime(timings.RETURN_MS);
    expect([...stage.classList]).toEqual(['stage']);
  });

  it('opens the map again on the next Play', async () => {
    const { play } = await open();
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS);
    comeBack();
    location.href = 'http://localhost/index.html';
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS);
    expect(location.href).toBe('./world-map.html?mane=pink');
  });

  it('leaves a freshly loaded page alone', async () => {
    const { stage, play } = await open();
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
    expect([...stage.classList]).toEqual(['stage']);
    expect(play.disabled).toBe(false);
  });
});

describe('the timings', () => {
  // styles.css times the animations itself, so the two must agree.
  const css = readFileSync(resolve(process.cwd(), 'public', 'styles.css'), 'utf8');

  it('match the animations in the stylesheet', async () => {
    await open();
    expect(css).toMatch(new RegExp(`\\.hopping \\.unicorn-btn \\{\\s*animation: hop ${timings.HOP_MS}ms`));
    expect(css).toMatch(new RegExp(`\\.dashing \\.unicorn-btn \\{\\s*animation: dash-off ${timings.DASH_MS}ms`));
    expect(css).toMatch(new RegExp(`\\.dashing \\.trail \\{\\s*animation: stretch ${timings.DASH_MS}ms`));
    expect(css).toMatch(new RegExp(`animation: trot-in ${timings.RETURN_MS}ms`));
  });
});

describe('a page without the start screen', () => {
  it('is left alone', async () => {
    await open('<body><p>Nothing here</p></body>');
    expect(document.querySelector('svg')).toBeNull();
  });
});
