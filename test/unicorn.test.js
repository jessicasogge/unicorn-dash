// @vitest-environment jsdom
// The unicorn's drawing, and her three mane colors.
import { describe, expect, it } from 'vitest';
import { MANES, drawUnicorn, nextMane, setMane } from '../public/game/unicorn.js';

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
