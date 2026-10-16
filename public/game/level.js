// A level (the Meadow, Candy Canyon): draws its course from course.js, the
// one the page names (<main data-level="meadow">), and runs the unicorn
// along it with runner.js. Tap (or space, or the up arrow) to jump; hold to
// dash.
import { LEVELS } from './course.js';
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

const main = document.querySelector('main');
const LEVEL = LEVELS[main.dataset.level];

const view = document.querySelector('.view');
const course = document.querySelector('.course');
const finish = document.querySelector('.finish');
const gameOver = document.querySelector('.game-over');

for (const link of document.querySelectorAll('.map-btn, .finish-map-btn, .over-map-btn')) {
  link.href = `./world-map.html?mane=${mane.name}`;
}

// At the castle, a button on to the next level, if there is one.
const next = document.querySelector('.next-btn');
if (main.dataset.next) next.href = `${main.dataset.next}?mane=${mane.name}`;
else next.remove();

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

// Diamonds come in every color, round the rainbow.
export const GEM_COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#5BD06B', '#3A8DFF', '#9B6BFF', '#FF5FA2'];
const gem = (color) => `<path d="M16 3 L29 14 L16 35 L3 14 Z" fill="${color}" stroke="#2B2350" stroke-width="3.5" stroke-linejoin="round"/><path d="M8 13 L14 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;

// Fireworks behind the castle, for catching every diamond: bursts of
// sparks flying out from a point.
function firework(x, y, color, delay) {
  const burst = document.createElement('div');
  burst.style.setProperty('--color', color);
  burst.style.animationDelay = `${delay}s`;
  for (let i = 0; i < 12; i++) {
    const spark = document.createElement('span');
    spark.style.setProperty('--angle', `${i * 30}deg`);
    spark.style.animationDelay = `${delay}s`;
    burst.append(spark);
  }
  return place(burst, 'firework', x, y);
}
const CASTLE = '<g stroke="#2B2350" stroke-width="6" stroke-linejoin="round"><rect x="70" y="120" width="200" height="176" fill="#FFD6EC"/><rect x="20" y="90" width="70" height="206" fill="#FFB3D6"/><rect x="250" y="90" width="70" height="206" fill="#FFB3D6"/><path d="M14 92 L55 24 L96 92 Z" fill="#9B6BFF"/><path d="M244 92 L285 24 L326 92 Z" fill="#9B6BFF"/><rect x="135" y="70" width="70" height="60" fill="#FFB3D6"/><path d="M128 72 L170 6 L212 72 Z" fill="#3A8DFF"/></g><path d="M140 296 V230 a30 30 0 0 1 60 0 V296" fill="#2B2350"/><g class="windows" fill="#2B2350"><path d="M46 156 V140 a9 9 0 0 1 18 0 V156 Z"/><path d="M276 156 V140 a9 9 0 0 1 18 0 V156 Z"/><path d="M46 216 V200 a9 9 0 0 1 18 0 V216 Z"/><path d="M276 216 V200 a9 9 0 0 1 18 0 V216 Z"/><path d="M161 106 V90 a9 9 0 0 1 18 0 V106 Z"/><path d="M106 181 V165 a9 9 0 0 1 18 0 V181 Z"/><path d="M216 181 V165 a9 9 0 0 1 18 0 V181 Z"/></g>';

// A gumdrop, half sunk in the ground, with sugar sparkles.
const GUMDROP = (color) => `<path d="M6 46 C6 14 20 4 45 4 C70 4 84 14 84 46 Z" fill="${color}" stroke="#2B2350" stroke-width="5" stroke-linejoin="round"/><g fill="#fff" opacity="0.8"><circle cx="30" cy="20" r="3"/><circle cx="50" cy="14" r="2.5"/><circle cx="62" cy="28" r="3"/><circle cx="38" cy="34" r="2.5"/></g>`;

// A lollipop tree: a big swirly lollipop on a striped stick.
const LOLLIPOP = (color) => `<g stroke="#2B2350" stroke-width="5"><rect x="44" y="84" width="12" height="160" rx="4" fill="#fff"/><path d="M44 110 L56 100 M44 140 L56 130 M44 170 L56 160 M44 200 L56 190 M44 230 L56 220" stroke="${color}" stroke-width="5"/><circle cx="50" cy="50" r="44" fill="${color}"/></g><path d="M50 50 m0 -6 a6 6 0 0 1 6 6 a12 12 0 0 1 -12 12 a18 18 0 0 1 -18 -18 a24 24 0 0 1 24 -24 a30 30 0 0 1 30 30" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;

const SKY_CLOUD = '<path d="M20 62 a20 20 0 0 1 8 -38 a30 30 0 0 1 56 -8 a24 24 0 0 1 44 16 a18 18 0 0 1 12 30 Z" fill="#fff"/>';

// The course, drawn once.
function build(course) {
  for (const [x, y, size] of course.sky) place(svg('0 0 160 70', SKY_CLOUD), 'sky-cloud', x, y, 160 * size);
  // Behind the ground, sticks standing in it
  course.trees.forEach(([x, height], i) => place(svg('0 0 100 244', LOLLIPOP(GEM_COLORS[(i * 2 + 1) % GEM_COLORS.length])), 'lollipop-tree', x, -30, height * 100 / 244 * (244 / 214)));
  for (const [from, to] of course.ground) {
    const ground = place(document.createElement('div'), 'ground', from, -BASE, to - from);
    ground.style.height = `${BASE}px`;
  }
  for (const cloud of course.clouds) {
    place(document.createElement('div'), 'cloud-platform', cloud.from, cloud.top - 40, cloud.to - cloud.from);
  }
  const gumdrops = course.bouncers.map((x, i) => place(svg('0 0 90 48', GUMDROP(GEM_COLORS[(i * 3) % GEM_COLORS.length])), 'gumdrop', x - 45, -8));
  // Six bursts, one after another, then done
  const fireworks = [[-130, 250, 0], [60, 300, 0.5], [220, 240, 1], [-40, 320, 1.5], [150, 280, 2], [-110, 300, 2.5]]
    .map(([dx, y, delay], i) => firework(course.castle + dx, y, GEM_COLORS[(i * 2) % GEM_COLORS.length], delay));
  place(svg('0 0 340 300', CASTLE), 'castle', course.castle - 170, 0); // door where she stops
  const gems = course.gems.map(([x, y], i) => place(svg('0 0 32 38', gem(GEM_COLORS[i % GEM_COLORS.length])), 'gem', x - 16, y - 19));
  return { gems, fireworks, gumdrops };
}

const { gems, fireworks, gumdrops } = build(LEVEL);
const count = document.querySelector('.gem-count');
const countNumber = count.querySelector('.count');

const runnerEl = document.createElement('div');
runnerEl.className = 'runner';
runnerEl.innerHTML = '<div class="trail" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>';
runnerEl.append(drawUnicorn(mane));
course.append(runnerEl);

let state = createRunner(LEVEL);
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
  gems.forEach((gem, i) => gem.classList.toggle('got', state.collected.has(i)));
  countNumber.textContent = state.collected.size;
  count.setAttribute('aria-label', `${state.collected.size} diamonds`);
}

// Every diamond caught?
const allGems = () => state.collected.size === LEVEL.gems.length;

function frame(time) {
  const dt = last === null ? 0 : Math.min(0.05, (time - last) / 1000);
  last = time;
  const events = step(state, dt, { pressed, held });
  pressed = false;
  render();
  if (events.includes('bounce')) {
    const gumdrop = gumdrops[state.bounced];
    gumdrop.classList.remove('squish');
    void gumdrop.offsetWidth; // restart the squish
    gumdrop.classList.add('squish');
  }
  if (events.includes('gem')) {
    count.classList.remove('bump');
    void count.offsetWidth; // restart the bump
    count.classList.add('bump');
  }
  if (events.includes('finish')) {
    for (const burst of fireworks) burst.classList.toggle('going', allGems());
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
  state = createRunner(LEVEL);
  pressed = false;
  held = false;
  last = null;
  finish.hidden = true;
  gameOver.hidden = true;
  for (const burst of fireworks) burst.classList.remove('going');
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

