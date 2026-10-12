// @vitest-environment jsdom
// script.js runs the start screen: tap the unicorn for a new mane color,
// press Play and she dashes off. These tests load the real start page into
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

// Open the start page and run script.js on it.
async function open(body = html('index.html')) {
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
afterEach(() => vi.useRealTimers());

describe('the start screen', () => {
  it('draws the unicorn, with a pink mane', async () => {
    const { unicorn } = await open();
    const svg = unicorn.querySelector('svg.unicorn');
    expect(svg).not.toBeNull();
    expect(svg.dataset.mane).toBe('pink');
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

  it('brings her back in from the other side once she\'s gone', async () => {
    const { stage, play } = await open();
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS);
    expect(stage.classList.contains('dashing')).toBe(false);
    expect(stage.classList.contains('returning')).toBe(true);
    expect(play.disabled).toBe(true);
  });

  it('is ready to play again once she\'s back', async () => {
    const { stage, play } = await open();
    play.click();
    vi.advanceTimersByTime(timings.DASH_MS + timings.RETURN_MS);
    expect([...stage.classList]).toEqual(['stage']);
    expect(play.disabled).toBe(false);
  });

  it('ignores taps on her while she\'s dashing', async () => {
    const { stage, unicorn, play } = await open();
    play.click();
    unicorn.click();
    expect(unicorn.querySelector('svg').dataset.mane).toBe('pink');
    expect(stage.classList.contains('hopping')).toBe(false);
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
