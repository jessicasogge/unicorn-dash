// @vitest-environment jsdom
// The unicorn's drawing, and her three mane colors.
import { describe, expect, it, vi } from 'vitest';
import { MANES, drawUnicorn, maneFromAddress, nextMane, pressOnReturn, setMane } from '../public/game/unicorn.js';

const maneFills = (svg) => [...svg.querySelectorAll('.mane')].map((part) => part.getAttribute('fill'));

describe('the manes', () => {
  it('come in pink, blue and yellow', () => {
    expect(MANES.map((m) => m.name)).toEqual(['pink', 'blue', 'yellow']);
  });

  it('each have their own shape too, for players who can\'t tell the colors apart', () => {
    const shapes = MANES.map((m) => m.shape);
    expect(new Set(shapes).size).toBe(MANES.length);
  });

  it('each have their own color', () => {
    expect(new Set(MANES.map((m) => m.color)).size).toBe(MANES.length);
  });

  it('go round in order, back to pink after yellow', () => {
    expect(nextMane(MANES[0])).toBe(MANES[1]);
    expect(nextMane(MANES[1])).toBe(MANES[2]);
    expect(nextMane(MANES[2])).toBe(MANES[0]);
  });
});

describe('drawing her', () => {
  it('is a picture with a name, for screen readers', () => {
    const svg = drawUnicorn(MANES[1]);
    expect(svg.tagName).toBe('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('A unicorn with a blue mane');
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 160');
  });

  it('starts pink when no mane is given', () => {
    const svg = drawUnicorn();
    expect(svg.dataset.mane).toBe('pink');
    expect(new Set(maneFills(svg))).toEqual(new Set([MANES[0].color]));
  });

  it('colors her tail, four hooves, mane and forelock', () => {
    // 1 tail + 4 hooves + 4 mane tufts + 1 forelock
    expect(maneFills(drawUnicorn())).toHaveLength(10);
  });

  it('gives her a golden horn', () => {
    const svg = drawUnicorn();
    expect([...svg.querySelectorAll('path')].some((p) => p.getAttribute('fill') === '#FFC93C')).toBe(true);
  });
});

describe('changing her mane', () => {
  it('recolors every mane part, and says so to screen readers', () => {
    const svg = drawUnicorn(MANES[0]);
    setMane(svg, MANES[2]);
    expect(new Set(maneFills(svg))).toEqual(new Set([MANES[2].color]));
    expect(svg.dataset.mane).toBe('yellow');
    expect(svg.getAttribute('aria-label')).toBe('A unicorn with a yellow mane');
  });
});

describe('her mane in a page\'s address', () => {
  it('is read from ?mane=', () => {
    expect(maneFromAddress('?mane=blue')).toBe(MANES[1]);
    expect(maneFromAddress('?other=1&mane=yellow')).toBe(MANES[2]);
  });

  it('is pink when there\'s none, or it isn\'t one of hers', () => {
    expect(maneFromAddress('')).toBe(MANES[0]);
    expect(maneFromAddress('?mane=green')).toBe(MANES[0]);
  });
});

describe('Return on a keyboard', () => {
  // A fresh button for each test, with a listener that presses it while
  // `on` says so (listeners from earlier tests stay, but are switched off).
  function setUp() {
    document.body.innerHTML = '<button class="main">Go</button><a href="#">Elsewhere</a>';
    const button = document.querySelector('.main');
    const click = vi.fn();
    button.addEventListener('click', click);
    const state = { on: true };
    pressOnReturn(() => (state.on ? button : null));
    return { button, click, state };
  }
  const press = (key, { repeat = false, target = window } = {}) => {
    const event = new KeyboardEvent('keydown', { key, repeat, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  it('presses the screen\'s main button', () => {
    const { click, state } = setUp();
    expect(press('Enter').defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    state.on = false;
  });

  it('does nothing when there\'s no main button showing', () => {
    const { click, state } = setUp();
    state.on = false;
    expect(press('Enter').defaultPrevented).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it('does nothing for a button that isn\'t on the page', () => {
    const { button, click, state } = setUp();
    button.remove();
    expect(press('Enter').defaultPrevented).toBe(false);
    expect(click).not.toHaveBeenCalled();
    state.on = false;
  });

  it('ignores other keys, and Return held down repeating', () => {
    const { click, state } = setUp();
    press('a');
    press('Enter', { repeat: true });
    expect(click).not.toHaveBeenCalled();
    state.on = false;
  });

  it('leaves Return to a focused button or link', () => {
    const { button, click, state } = setUp();
    press('Enter', { target: document.querySelector('a') });
    press('Enter', { target: button });
    expect(click).not.toHaveBeenCalled();
    state.on = false;
  });
});
