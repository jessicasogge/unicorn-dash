// @vitest-environment jsdom
// track.js counts game events on GoatCounter. Counting is a nice extra, so
// these tests mostly check it can never break the game: an ad blocker,
// playing offline, or GoatCounter itself failing.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '../public/game/track.js';

afterEach(() => {
  delete window.goatcounter;
});

describe('track', () => {
  it('counts the event on GoatCounter as an event, not a page visit', () => {
    window.goatcounter = { count: vi.fn() };
    track('unicorn-dash/level-complete/candy', 'Beat Candy Canyon');
    expect(window.goatcounter.count).toHaveBeenCalledWith({
      path: 'unicorn-dash/level-complete/candy',
      title: 'Beat Candy Canyon',
      event: true,
    });
  });

  it('uses the event name as its title when there is no title', () => {
    window.goatcounter = { count: vi.fn() };
    track('unicorn-dash/won-all-worlds');
    expect(window.goatcounter.count).toHaveBeenCalledWith(expect.objectContaining({
      path: 'unicorn-dash/won-all-worlds',
      title: 'unicorn-dash/won-all-worlds',
    }));
  });

  it("quietly does nothing when GoatCounter didn't load (an ad blocker, or offline)", () => {
    expect(() => track('unicorn-dash/game-over/meadow/gap')).not.toThrow();
  });

  it('quietly does nothing while GoatCounter is still loading', () => {
    window.goatcounter = {}; // there, but not ready to count yet
    expect(() => track('unicorn-dash/level-complete/meadow')).not.toThrow();
  });

  it('never lets an error in GoatCounter break the game', () => {
    window.goatcounter = { count: vi.fn(() => { throw new Error('GoatCounter is down'); }) };
    expect(() => track('unicorn-dash/level-complete/night')).not.toThrow();
    expect(window.goatcounter.count).toHaveBeenCalled();
  });
});
