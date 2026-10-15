// The Meadow: draws the course from course.js and runs the unicorn along
// it with runner.js. Tap (or space, or the up arrow) to jump; hold to dash.
import { MEADOW } from './course.js';
import { createRunner, step } from './runner.js';
import { drawUnicorn, maneFromAddress } from './unicorn.js';

export const VIEW_HEIGHT = 600; // world units from the bottom of the screen to the top
export const VIEW_WIDTH = 700; // at least this much course across, so she sees gaps coming
export const BASE = 140; // the ground's top, up from the bottom of the screen
export const LEAD = 0.3; // she runs this far across the screen
export const FINISH_DELAY_MS = 700; // a moment at the castle before the buttons
export const GAME_OVER_DELAY_MS = 500; // a moment to see her fall

const SVG = 'http://www.w3.org/2000/svg';
const mane = maneFromAddress(location.search);

const view = document.querySelector('.view');
const course = document.querySelector('.course');
const segments = [...document.querySelectorAll('.sparkle-meter .seg')];
const finish = document.querySelector('.finish');
const gameOver = document.querySelector('.game-over');

for (const link of document.querySelectorAll('.map-btn, .finish-map-btn, .over-map-btn')) {
  link.href = `./world-map.html?mane=${mane.name}`;
}

function svg(viewBox, inner) {
  const node = document.createElementNS(SVG, 'svg');
  node.setAttribute('viewBox', viewBox);
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = inner;
  return node;
}

function place(node, className, x, y, width) {
  node.classList.add(className);
  node.style.left = `${x}px`;
  node.style.bottom = `${BASE + y}px`;
  if (width !== undefined) node.style.width = `${width}px`;
  course.append(node);
  return node;
}

const GEM = '<path d="M16 3 L29 14 L16 35 L3 14 Z" fill="#7FE3FF" stroke="#2B2350" stroke-width="3.5" stroke-linejoin="round"/><path d="M8 13 L14 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
const CASTLE = '<g stroke="#2B2350" stroke-width="6" stroke-linejoin="round"><rect x="70" y="120" width="200" height="176" fill="#FFD6EC"/><rect x="20" y="90" width="70" height="206" fill="#FFB3D6"/><rect x="250" y="90" width="70" height="206" fill="#FFB3D6"/><path d="M14 92 L55 24 L96 92 Z" fill="#9B6BFF"/><path d="M244 92 L285 24 L326 92 Z" fill="#9B6BFF"/><rect x="135" y="70" width="70" height="60" fill="#FFB3D6"/><path d="M128 72 L170 6 L212 72 Z" fill="#3A8DFF"/></g><path d="M140 296 V230 a30 30 0 0 1 60 0 V296" fill="#2B2350"/>';

const SKY_CLOUD = '<path d="M20 62 a20 20 0 0 1 8 -38 a30 30 0 0 1 56 -8 a24 24 0 0 1 44 16 a18 18 0 0 1 12 30 Z" fill="#fff"/>';

// The course, drawn once.
function build(course) {
  for (const [x, y, size] of course.sky) place(svg('0 0 160 70', SKY_CLOUD), 'sky-cloud', x, y, 160 * size);
  for (const [from, to] of course.ground) {
    const ground = place(document.createElement('div'), 'ground', from, -BASE, to - from);
    ground.style.height = `${BASE}px`;
  }
  for (const cloud of course.clouds) {
    place(document.createElement('div'), 'cloud-platform', cloud.from, cloud.top - 40, cloud.to - cloud.from);
  }
  place(svg('0 0 340 300', CASTLE), 'castle', course.castle - 170, 0); // door where she stops
  return course.gems.map(([x, y]) => place(svg('0 0 32 38', GEM), 'gem', x - 16, y - 19));
}

const gems = build(MEADOW);

const runnerEl = document.createElement('div');
runnerEl.className = 'runner';
runnerEl.innerHTML = '<div class="trail" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>';
runnerEl.append(drawUnicorn(mane));
course.append(runnerEl);

let state = createRunner(MEADOW);
let started = false; // not until Go, after the directions
let pressed = false;
let held = false;
let last = null;

// Draws her, the camera and the meter where the runner says.
export function render() {
  // (jsdom, in the tests, lays nothing out: then a square screen)
  const height = view.clientHeight || VIEW_HEIGHT;
  const width = view.clientWidth || VIEW_HEIGHT;
  const scale = Math.min(height / VIEW_HEIGHT, width / VIEW_WIDTH);
  const camera = state.x - (width / scale) * LEAD;
  course.style.transform = `scale(${scale}) translateX(${-camera}px)`;
  // Far hills drift by slower than the ground
  view.style.backgroundPositionX = `${-camera * 0.3 * scale}px`;
  runnerEl.style.left = `${state.x - 70}px`;
  runnerEl.style.bottom = `${BASE + state.y - 13}px`;
  runnerEl.classList.toggle('dashing', state.dashing);
  segments.forEach((seg, i) => seg.style.setProperty('--fill', Math.min(1, Math.max(0, state.sparkle - i))));
  gems.forEach((gem, i) => gem.classList.toggle('got', state.collected.has(i)));
}

function frame(time) {
  const dt = last === null ? 0 : Math.min(0.05, (time - last) / 1000);
  last = time;
  const events = step(state, dt, { pressed, held });
  pressed = false;
  render();
  if (events.includes('finish')) {
    setTimeout(() => { finish.hidden = false; }, FINISH_DELAY_MS);
    return;
  }
  if (events.includes('fall')) {
    setTimeout(() => { gameOver.hidden = false; }, GAME_OVER_DELAY_MS);
    return;
  }
  requestAnimationFrame(frame);
}

function press() {
  if (!started) return;
  if (!held) pressed = true;
  held = true;
}

function release() {
  held = false;
}

view.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  press();
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) view.addEventListener(type, release);

const KEYS = [' ', 'ArrowUp'];
window.addEventListener('keydown', (event) => {
  // Space on a focused button presses the button, not jump
  if (!KEYS.includes(event.key) || event.target.closest?.('button, a')) return;
  event.preventDefault(); // no page scroll on space
  if (event.repeat) return;
  if (started) press();
  else go(); // space or up also starts, from the directions
});
window.addEventListener('keyup', (event) => {
  if (KEYS.includes(event.key)) release();
});

// The game over picture: her, dizzy, with swirls going round.
const SWIRL = 'a2 2 0 0 1 2 2 a4 4 0 0 1 -4 4 a6 6 0 0 1 -6 -6 a8 8 0 0 1 8 -8';
document.querySelector('.oops').append(
  drawUnicorn(mane),
  svg('0 0 120 40', `<g fill="none" stroke="#9B6BFF" stroke-width="3" stroke-linecap="round"><path d="M20 18 ${SWIRL}"/><path d="M60 14 ${SWIRL}"/><path d="M100 18 ${SWIRL}"/></g>`),
);

// Play again, after the castle or a fall: back to the start, every gem
// back in place.
function restart() {
  state = createRunner(MEADOW);
  pressed = false;
  held = false;
  last = null;
  finish.hidden = true;
  gameOver.hidden = true;
  render();
  requestAnimationFrame(frame);
}

for (const button of document.querySelectorAll('.replay-btn, .retry-btn')) button.addEventListener('click', restart);

// The directions show first; Go starts her running.
const directions = document.querySelector('.directions');
const goButton = document.querySelector('.go-btn');

function go() {
  started = true;
  directions.hidden = true;
  requestAnimationFrame(frame);
}

goButton.addEventListener('click', go);
render();

