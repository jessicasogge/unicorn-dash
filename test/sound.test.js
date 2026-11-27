// sound.js plays the game's soft sounds, made by the browser as it goes.
// These tests hand it a pretend sound maker, to see what it plays.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SOUNDS, createSound } from '../public/game/sound.js';

// A pretend browser sound maker that writes down every tone it's asked for
function fakeContext() {
  const tones = [];
  const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  class Context {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 10;
      this.destination = {};
      this.resume = vi.fn(() => { this.state = 'running'; });
      Context.made += 1;
    }

    createOscillator() {
      const tone = { frequency: param(), connect: (to) => to, start: vi.fn(), stop: vi.fn() };
      tones.push(tone);
      return tone;
    }

    createGain() {
      return { gain: param(), connect: (to) => to };
    }
  }
  Context.made = 0;
  return { Context, tones };
}

afterEach(() => vi.unstubAllGlobals());

describe('sounds', () => {
  it('play nothing before a tap or a key wakes them, as phones require', () => {
    const { Context, tones } = fakeContext();
    vi.stubGlobal('AudioContext', Context);
    const sound = createSound();
    sound.play('jump');
    expect(tones).toHaveLength(0);
    expect(Context.made).toBe(0);
  });

  it('wake once, starting the browser\'s sound if it\'s waiting', () => {
    const { Context } = fakeContext();
    vi.stubGlobal('AudioContext', Context);
    const sound = createSound();
    sound.wake();
    sound.wake();
    expect(Context.made).toBe(1);
  });

  it('play each of a sound\'s tones, gently, sliding and fading out', () => {
    const { Context, tones } = fakeContext();
    vi.stubGlobal('AudioContext', Context);
    const sound = createSound();
    sound.wake();
    sound.play('gem');
    expect(tones).toHaveLength(SOUNDS.gem.length);
    const [first, second] = tones;
    expect(first.type).toBe('sine');
    expect(first.frequency.setValueAtTime).toHaveBeenCalledWith(1319, 10);
    expect(second.start).toHaveBeenCalledWith(10.07); // the second note a moment after
    expect(first.stop).toHaveBeenCalledWith(10 + 0.08 + 0.02);
  });

  it('cover everything that happens in a level, all gently', () => {
    expect(Object.keys(SOUNDS)).toEqual(expect.arrayContaining(['jump', 'dash', 'gem', 'bounce', 'paint', 'smash', 'thud', 'ride', 'float', 'pop', 'ouch', 'fall', 'finish', 'fireworks']));
    for (const tones of Object.values(SOUNDS)) for (const tone of tones) expect(tone.gain ?? 0.12).toBeLessThanOrEqual(0.2);
  });

  it('play nothing when turned off', () => {
    const { Context, tones } = fakeContext();
    vi.stubGlobal('AudioContext', Context);
    const sound = createSound({ on: false });
    sound.wake();
    sound.play('jump');
    expect(tones).toHaveLength(0);
  });

  it('use an older Safari\'s sound maker when that\'s all there is', () => {
    const { Context, tones } = fakeContext();
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', Context);
    const sound = createSound();
    sound.wake();
    sound.play('pop');
    expect(tones).toHaveLength(1);
  });

  it('quietly do nothing in a browser without sound', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const sound = createSound();
    expect(() => {
      sound.wake();
      sound.play('jump');
    }).not.toThrow();
  });
});
