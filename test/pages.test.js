// Checks the things every page shares: the Unicorn Dash tab icon (not the
// browser's generic globe), Jess's signature at the foot, and what search
// engines and shared links see.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const file = (name) => new URL(`../public/${name}`, import.meta.url);
const PAGES = ['index.html', 'world-map.html', 'meadow.html'];

describe('tab icon', () => {
  it.each(PAGES)('%s links the icon, with a PNG for browsers without SVG icons', (page) => {
    const html = readFileSync(file(page), 'utf8');
    expect(html).toContain('<link rel="icon" href="./favicon.svg" type="image/svg+xml" />');
    expect(html).toContain('<link rel="icon" href="./favicon-32.png" type="image/png" sizes="32x32" />');
  });

  it('has both icon files', () => {
    expect(existsSync(file('favicon.svg'))).toBe(true);
    expect(existsSync(file('favicon-32.png'))).toBe(true);
  });
});

describe('signature', () => {
  it.each(PAGES)('%s is signed at the foot', (page) => {
    const html = readFileSync(file(page), 'utf8');
    expect(html).toContain('<footer class="signature">jsogge 2026</footer>');
  });
});

describe('the start screen', () => {
  const html = readFileSync(file('index.html'), 'utf8');
  const css = readFileSync(file('styles.css'), 'utf8');
  const start = html.slice(html.indexOf('<main class="start">'), html.indexOf('</main>'));

  it('shows the name as the title', () => {
    expect(start).toMatch(/<h1 class="logo">\s*<span class="logo-unicorn">Unicorn<\/span>\s*<span class="logo-dash">Dash<\/span>\s*<\/h1>/);
  });

  it('names every button for screen readers', () => {
    const buttons = [...start.matchAll(/<button\b([^>]*)>/g)];
    expect(buttons.length).toBe(2);
    for (const [, attrs] of buttons) expect(attrs).toMatch(/aria-label="[^"]+"/);
  });

  it('links to PetriPals and FunGals, the other games', () => {
    expect(html).toContain('<a href="https://jessicasogge.github.io/petripals/">PetriPals</a>');
    expect(html).toContain('<a href="https://jessicasogge.github.io/fungals/">FunGals</a>');
  });

  it('keeps her still for players whose devices ask for less motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.unicorn-btn,\s*\.trail,\s*\.perch \{\s*animation: none !important;/);
  });

  it('has every font file the stylesheet uses, each with its license', () => {
    const fonts = [...css.matchAll(/url\(\.\/(fonts\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
    expect(fonts.length).toBeGreaterThan(0);
    for (const font of fonts) expect(existsSync(file(font)), font).toBe(true);
    expect(existsSync(file('fonts/Fredoka-OFL.txt'))).toBe(true);
    expect(existsSync(file('fonts/Nunito-OFL.txt'))).toBe(true);
  });

  it('preloads the title font, so the name shows up in it quickly', () => {
    const [, preloaded] = html.match(/<link rel="preload" href="\.\/([^"]+)" as="font"/);
    expect(css).toContain(`url(./${preloaded})`);
  });
});

describe('the world map', () => {
  const html = readFileSync(file('world-map.html'), 'utf8');
  const map = html.slice(html.indexOf('<main class="map">'), html.indexOf('</main>'));

  it('names every button for screen readers', () => {
    const controls = [...map.matchAll(/<(?:button|a)\b([^>]*)>/g)];
    expect(controls.length).toBeGreaterThan(0);
    for (const [, attrs] of controls) expect(attrs).toMatch(/aria-label="[^"]+"/);
  });
});

describe('the Meadow', () => {
  const html = readFileSync(file('meadow.html'), 'utf8');
  const level = html.slice(html.indexOf('<main class="meadow">'), html.indexOf('</main>'));

  it('names every button for screen readers, in words or a label', () => {
    const controls = [...level.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)];
    expect(controls.length).toBe(6); // Go; map; at the castle, play again and map; after a fall, try again and map
    for (const [, , attrs, inside] of controls) {
      const words = inside.replace(/<[^>]*>/g, '').trim();
      expect(words || attrs.match(/aria-label="([^"]+)"/)?.[1]).toBeTruthy();
    }
  });

  it('has the map button on the left and the diamond count on the right, with no sparkle meter', () => {
    const bar = level.slice(level.indexOf('<nav class="meadow-bar">'), level.indexOf('</nav>'));
    expect(bar).toMatch(/^<nav class="meadow-bar">\s*<a class="icon-btn map-btn"[\s\S]*<div class="gem-count"/);
    expect(bar).not.toContain('sparkle-meter');
  });

  it('bursts each firework once, not over and over', () => {
    const css = readFileSync(file('styles.css'), 'utf8');
    const rule = css.match(/\.firework span \{([^}]*)\}/)[1];
    expect(rule).toMatch(/animation: burst [\d.]+s ease-out both;/);
    expect(rule).not.toContain('infinite');
  });

  it('starts with the directions showing', () => {
    expect(level).toContain('<div class="directions">');
    expect(level).toContain('<button class="go-btn" type="button">Go!</button>');
  });

  it('keeps the castle and game over screens hidden until they\'re needed', () => {
    expect(level).toContain('<div class="finish" hidden>');
    expect(level).toContain('<div class="game-over" hidden>');
  });

  it('says you beat the level at the castle', () => {
    expect(level).toMatch(/<div class="finish" hidden>\s*<h2 class="finish-title">You beat the level!<\/h2>/);
  });

  it('says Game Over on the game over screen', () => {
    expect(level).toContain('<h2 class="game-over-title">Game Over</h2>');
  });
});

describe('search engines and shared links', () => {
  const SITE = 'https://jessicasogge.github.io/unicorn-dash/';
  const meta = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

  it('names the game and what it is in the home page title', () => {
    expect(readFileSync(file('index.html'), 'utf8')).toContain('<title>Unicorn Dash: A Rainbow Running Game</title>');
  });

  it.each(PAGES)('%s has a description short enough for a search result', (page) => {
    const description = meta(readFileSync(file(page), 'utf8'), 'name', 'description');
    expect(description).toBeTruthy();
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it.each(PAGES)('%s says where it lives, for search engines and shared links', (page) => {
    const html = readFileSync(file(page), 'utf8');
    const address = page === 'index.html' ? SITE : SITE + page;
    expect(html).toContain(`<link rel="canonical" href="${address}" />`);
    expect(meta(html, 'property', 'og:url')).toBe(address);
  });

  it.each(PAGES)('%s shows a picture when its link is shared', (page) => {
    const html = readFileSync(file(page), 'utf8');
    const image = meta(html, 'property', 'og:image');
    expect(image.startsWith(SITE)).toBe(true); // apps need the full address
    expect(existsSync(file(image.slice(SITE.length)))).toBe(true);
    expect(meta(html, 'property', 'og:title')).toBeTruthy();
    expect(meta(html, 'property', 'og:description')).toBe(meta(html, 'name', 'description'));
    expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
  });

  it('lists real pages in the sitemap', () => {
    const sitemap = readFileSync(file('sitemap.xml'), 'utf8');
    const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(pages).toContain(SITE);
    for (const address of pages) {
      expect(address.startsWith(SITE)).toBe(true);
      expect(existsSync(file(address.slice(SITE.length) || 'index.html')), address).toBe(true);
    }
  });
});
