// SVG unicorn: white pony facing right, golden horn, colored mane/tail/hooves.
// Each mane color has a matching shape (heart, star, moon) for accessibility.
// Paint pots change her mane; tapping on the start screen cycles manes.

const SVG = 'http://www.w3.org/2000/svg';

export const INK = '#2B2350'; // her outline, the same deep purple as the page
export const COAT = '#FFFFFF';
export const HORN = '#FFC93C';

export const HOP_MS = 450;

export const MANES = [
  { name: 'pink', shape: 'heart', color: '#FF5FA2' },
  { name: 'blue', shape: 'star', color: '#3A8DFF' },
  { name: 'yellow', shape: 'moon', color: '#FFC21A' },
];

// One SVG element with its attributes.
function el(tag, attrs) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

// A leg (or her neck) is a thick line drawn twice: a wide outline, then a
// slightly thinner white line on top, so it looks outlined.
function limb(d, width) {
  const common = { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  return [
    el('path', { ...common, stroke: INK, 'stroke-width': width + 8 }),
    el('path', { ...common, stroke: COAT, 'stroke-width': width }),
  ];
}

// The parts drawn in her mane color, so changing it is one loop.
function maned(tag, attrs) {
  return el(tag, { ...attrs, class: 'mane', stroke: INK });
}

// Draws her, `mane` being one of MANES. The picture is 200 by 160 units;
// size it with CSS.
export function drawUnicorn(mane = MANES[0]) {
  const svg = el('svg', {
    class: 'unicorn',
    viewBox: '0 0 200 160',
    role: 'img',
    'aria-label': `A unicorn with a ${mane.name} mane`,
  });

  svg.append(
    // tail
    maned('path', { d: 'M50 80 C22 64 4 88 16 112 C26 100 34 96 52 94 Z', 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    // legs, mid-gallop: two reaching back, two tucked up in front
    ...limb('M72 98 L54 124 L46 138', 11),
    ...limb('M86 102 L80 140', 11),
    ...limb('M112 102 L132 120 L124 138', 11),
    ...limb('M122 98 L148 116', 11),
    // hooves
    ...[[46, 138], [80, 140], [124, 138], [148, 116]].map(([cx, cy]) =>
      maned('circle', { cx, cy, r: 7, 'stroke-width': 3 })),
    // neck, then her body over the bottom of it
    ...limb('M114 80 L144 46', 34),
    el('ellipse', { cx: 92, cy: 84, rx: 50, ry: 30, fill: COAT, stroke: INK, 'stroke-width': 4 }),
    // mane, down the back of her neck
    ...[[106, 62, 10], [114, 50, 11], [123, 39, 12], [133, 28, 12]].map(([cx, cy, r]) =>
      maned('circle', { cx, cy, r, 'stroke-width': 3 })),
    // ear and horn, tucked behind her head
    el('path', { d: 'M140 30 L141 12 L153 27 Z', fill: COAT, stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    el('path', { d: 'M150 28 L168 2 L162 30 Z', fill: HORN, stroke: INK, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }),
    el('path', { d: 'M156 21 L164 18 M160 13 L166 11', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    // head and muzzle
    el('ellipse', { cx: 152, cy: 46, rx: 25, ry: 20, fill: COAT, stroke: INK, 'stroke-width': 4 }),
    el('ellipse', { cx: 172, cy: 58, rx: 16, ry: 13, fill: '#FFD6E8', stroke: INK, 'stroke-width': 4 }),
    // forelock, over the base of her horn
    maned('circle', { cx: 143, cy: 29, r: 9, 'stroke-width': 3 }),
    // face: eye with a shine, blush, nostril, smile
    el('circle', { cx: 156, cy: 44, r: 5, fill: INK }),
    el('circle', { cx: 157.6, cy: 42.4, r: 1.8, fill: '#FFFFFF' }),
    el('ellipse', { cx: 160, cy: 55, rx: 6, ry: 4, fill: '#FF8FBF', opacity: 0.6 }),
    el('circle', { cx: 180, cy: 55, r: 2.2, fill: INK }),
    el('path', { d: 'M169 65 Q175 69 181 63', fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
  );

  setMane(svg, mane);
  return svg;
}

// Recolors her mane, tail and hooves.
export function setMane(svg, mane) {
  for (const part of svg.querySelectorAll('.mane')) part.setAttribute('fill', mane.color);
  svg.dataset.mane = mane.name;
  svg.setAttribute('aria-label', `A unicorn with a ${mane.name} mane`);
}

// The mane after `mane`, back to the first after the last.
export function nextMane(mane) {
  return MANES[(MANES.indexOf(mane) + 1) % MANES.length];
}

// The mane named in a page's address (like ?mane=blue), so she keeps her
// color from one screen to the next. Pink if there's none, or it's not one
// of hers.
export function maneFromAddress(search) {
  const name = new URLSearchParams(search).get('mane');
  return MANES.find((mane) => mane.name === name) ?? MANES[0];
}

// Return (Enter) on a keyboard presses the screen's main button: whichever
// `pick` gives, if any. A focused button or link keeps Return for itself.
export function pressOnReturn(pick) {
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.repeat || event.target.closest?.('button, a')) return;
    const button = pick();
    if (!button?.isConnected) return; // none, or not on the page
    event.preventDefault();
    button.click();
  });
}
