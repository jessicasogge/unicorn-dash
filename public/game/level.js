// A level (the Meadow, Candy Canyon): draws its course from course.js, the
// one the page names (<main data-level="meadow">), and runs the unicorn
// along it with runner.js. Tap (or space, or the up arrow) to jump; hold to
// dash.
import { LEVELS } from './course.js';
import { createRunner, step } from './runner.js';
import { MANES, drawUnicorn, maneFromAddress, pressOnReturn, setMane } from './unicorn.js';

export const VIEW_HEIGHT = 600; // world units from the bottom of the screen to the top
export const VIEW_WIDTH = 560; // at least this much course across, so she sees gaps coming
export const BASE = 140; // the ground's top, up from the bottom of the screen
export const LEAD = 0.3; // she runs this far across the screen
export const NARROW_LEAD = 0.2; // or on a narrow screen, nearer the left, to see as far ahead
export const FINISH_DELAY_MS = 700; // a moment at the castle before the buttons
export const HILL_WIDTH = 640; // the far hills' repeat, in screen pixels (styles.css)
export const HILLS_SPEED = 0.3; // they drift by this much slower than the ground
export const GAME_OVER_DELAY_MS = 500; // a moment to see her fall

const SVG = 'http://www.w3.org/2000/svg';
const mane = maneFromAddress(location.search);

const main = document.querySelector('main');
const LEVEL = LEVELS[main.dataset.level];

const view = document.querySelector('.view');
const hills = document.querySelector('.hills');
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

// The shapes that go with each mane color (pink heart, blue star, yellow
// moon), so a player who can't tell the colors apart can still match them.
const SHAPES = {
  heart: '<path d="M12 21 C5 15.5 2 12 2 8 A4.8 4.8 0 0 1 12 6 A4.8 4.8 0 0 1 22 8 C22 12 19 15.5 12 21 Z"/>',
  star: '<path d="M12 1.8 L15 8.6 L22.3 9.3 L16.8 14.2 L18.4 21.4 L12 17.6 L5.6 21.4 L7.2 14.2 L1.7 9.3 L9 8.6 Z"/>',
  moon: '<path d="M15 2 a10 10 0 1 0 7 17 a8 8 0 0 1 -7 -17 Z"/>',
};
const maneNamed = (name) => MANES.find((m) => m.name === name);
const badge = (mane, x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="${mane.color}" stroke="#2B2350" stroke-width="${48 / size}" stroke-linejoin="round">${SHAPES[mane.shape]}</g>`;

// A paint pot, its paint and shape in one mane color.
const POT = (mane) => `<g stroke="#2B2350" stroke-width="5" stroke-linejoin="round"><path d="M10 26 H70 L62 88 H18 Z" fill="#fff"/><rect x="4" y="14" width="72" height="16" rx="8" fill="${mane.color}"/></g><path d="M20 30 v14 a5 5 0 0 0 10 0 v-14 M50 30 v8 a4 4 0 0 0 8 0 v-8" fill="${mane.color}"/>${badge(mane, 24, 44, 32)}`;

// A crystal wall: tall glassy shards, in pieces that fly apart when a dash
// smashes through.
const WALL = '<g stroke="#2B2350" stroke-width="5" stroke-linejoin="round">'
  + '<path class="shard" d="M8 330 L4 120 L30 40 L52 110 L48 330 Z" fill="#7FE3FF"/>'
  + '<path class="shard" d="M44 330 L46 70 L70 0 L92 80 L88 330 Z" fill="#B9F1FF"/>'
  + '<path class="shard" d="M84 330 L86 140 L108 60 L124 150 L120 330 Z" fill="#9B6BFF"/>'
  + '</g><g stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"><path d="M22 90 L16 150 M66 40 L58 110 M104 110 L98 160"/></g>';

// Something prickly on the ground to jump over, different in each world: a
// round bush with spikes all round it, in the world's colors, and a little
// something on top. Cloud Kingdom's is a grumpy thundercloud instead.
const SPIKES = [[9, 64, 0, 56, 11, 50], [14, 45, 6, 32, 24, 38], [26, 33, 18, 16, 35, 23], [43, 20, 50, 2, 57, 20],
  [65, 23, 82, 16, 74, 33], [76, 38, 94, 32, 86, 45], [89, 50, 100, 56, 91, 64]];
const BRAMBLE = (body, spikes, extra = '') => `<g stroke="#2B2350" stroke-linejoin="round">${SPIKES.map(([x1, y1, ax, ay, x2, y2]) => `<path d="M${x1} ${y1} L${ax} ${ay} L${x2} ${y2} Z" fill="${spikes}" stroke-width="4"/>`).join('')}<path d="M10 72 Q6 44 26 38 Q30 18 50 19 Q70 18 74 38 Q94 44 90 72 Z" fill="${body}" stroke-width="5"/></g>${extra}`;
const THORNS = {
  // A thistle: a green spiky bush with purple flowers
  meadow: BRAMBLE('#4FAF55', '#E9F7D0', '<g stroke="#2B2350" stroke-width="4"><circle cx="36" cy="22" r="8" fill="#B06BE0"/><circle cx="64" cy="22" r="8" fill="#B06BE0"/></g>'),
  // A spiky candy: minty, with white spikes and sprinkles
  candy: BRAMBLE('#7BE0A0', '#FFFFFF', '<g fill="#FF5FA2"><circle cx="34" cy="42" r="4"/><circle cx="62" cy="36" r="4"/></g><g fill="#FFC21A"><circle cx="48" cy="56" r="4"/><circle cx="72" cy="58" r="4"/><circle cx="24" cy="60" r="4"/></g>'),
  // A grumpy thundercloud, sitting on the ground, zapping it
  cloud: '<g transform="translate(4 4) scale(0.92)"><g stroke="#2B2350" stroke-linejoin="round"><path d="M40 52 L30 72 L44 64 L40 72 L58 52 Z" fill="#FFD23F" stroke-width="4"/><path d="M16 56 a14 14 0 0 1 4 -27 a20 20 0 0 1 36 -12 a18 18 0 0 1 32 13 a13 13 0 0 1 2 26 Z" fill="#8A8FB5" stroke-width="5"/></g><g stroke="#2B2350" stroke-width="4" stroke-linecap="round"><path d="M36 32 L46 36 M66 32 L56 36"/></g><g fill="#2B2350"><circle cx="43" cy="42" r="3.5"/><circle cx="59" cy="42" r="3.5"/></g></g>',
  // A purple bramble, its thorns pale like crystal
  crystal: BRAMBLE('#7B4FD6', '#E2D4FF'),
  // A blue bramble, with little stars in it
  night: BRAMBLE('#2E5FA8', '#BFE6FF', '<g fill="#FFE58A"><path d="M36 44 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 Z"/><path d="M64 36 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1 Z"/></g>'),
};
const THORN = THORNS[main.dataset.level];

// The directions show it too
document.querySelector('.thorn-pic').append(svg('0 0 100 74', THORN));

// A shooting star: a big glowing star with a sparkly tail behind it.
const SHOOTING_STAR = '<g stroke-linecap="round"><path d="M10 52 H70" stroke="#FFD23F" stroke-width="10" opacity="0.5"/><path d="M24 40 H72" stroke="#FFF3B0" stroke-width="6" opacity="0.7"/><path d="M30 64 H70" stroke="#FFF3B0" stroke-width="5" opacity="0.6"/></g><path d="M100 14 L111 39 L138 41 L117 58 L124 84 L100 70 L76 84 L83 58 L62 41 L89 39 Z" fill="#FFD23F" stroke="#2B2350" stroke-width="5" stroke-linejoin="round"/><circle cx="94" cy="48" r="4" fill="#2B2350"/><circle cx="108" cy="48" r="4" fill="#2B2350"/>';

// A cluster of glowing crystals for the cave's background.
const CRYSTALS = '<g stroke="#2B2350" stroke-width="5" stroke-linejoin="round"><path d="M10 240 L20 120 L40 80 L56 130 L50 240 Z" fill="#9B6BFF"/><path d="M46 240 L52 60 L78 0 L102 70 L96 240 Z" fill="#7FE3FF"/><path d="M92 240 L98 140 L118 100 L132 150 L128 240 Z" fill="#FF8FC0"/></g>';

// A lollipop tree: a big swirly lollipop on a striped stick.
const LOLLIPOP = (color) => `<g stroke="#2B2350" stroke-width="5"><rect x="44" y="84" width="12" height="160" rx="4" fill="#fff"/><path d="M44 110 L56 100 M44 140 L56 130 M44 170 L56 160 M44 200 L56 190 M44 230 L56 220" stroke="${color}" stroke-width="5"/><circle cx="50" cy="50" r="44" fill="${color}"/></g><path d="M50 50 m0 -6 a6 6 0 0 1 6 6 a12 12 0 0 1 -12 12 a18 18 0 0 1 -18 -18 a24 24 0 0 1 24 -24 a30 30 0 0 1 30 30" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;

const SKY_CLOUD = '<path d="M20 62 a20 20 0 0 1 8 -38 a30 30 0 0 1 56 -8 a24 24 0 0 1 44 16 a18 18 0 0 1 12 30 Z" fill="#fff"/>';

// The course, drawn once.
function build(course) {
  for (const [x, y, size] of course.sky) place(svg('0 0 160 70', SKY_CLOUD), 'sky-cloud', x, y, 160 * size);
  for (const [x, height] of course.crystals) place(svg('0 0 140 240', CRYSTALS), 'cave-crystals', x, -20, height * 140 / 240);
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
  const pots = course.pots.map((pot) => place(svg('0 0 80 92', POT(maneNamed(pot.mane))), 'paint-pot', pot.x - 40, -4));
  const walls = course.walls.map((x) => place(svg('0 0 128 334', WALL), 'crystal-wall', x - 64, -4));
  const stars = course.stars.map((star) => place(svg('0 0 140 96', SHOOTING_STAR), 'shooting-star', star.x - 100, star.y - 40));
  const thorns = course.thorns.map((x) => place(svg('0 0 100 74', THORN), 'thorns', x - 50, -4));
  const gems = course.gems.map(([x, y], i) => place(svg('0 0 32 38', gem(GEM_COLORS[i % GEM_COLORS.length])), 'gem', x - 16, y - 19));
  return { gems, fireworks, gumdrops, pots, walls, stars, thorns };
}

const { gems, fireworks, gumdrops, pots, walls, stars, thorns } = build(LEVEL);
const count = document.querySelector('.gem-count');
const countNumber = count.querySelector('.count');

const runnerEl = document.createElement('div');
runnerEl.className = 'runner';
runnerEl.innerHTML = '<div class="trail" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>';
const unicorn = drawUnicorn(mane);
runnerEl.append(unicorn);
runnerEl.style.bottom = `${BASE - 13}px`; // her feet on the ground; moved from here with a transform
course.append(runnerEl);

let state = createRunner(LEVEL, mane.name);
let started = false; // not until Go, after the directions
let pressed = false;
let held = false;
let last = null;

// The screen's size, read once and again only when it changes, since
// reading it every frame can make the browser lay the page out again.
let size = null;
function measure() {
  // (jsdom, in the tests, lays nothing out: then a square screen)
  const height = view.clientHeight || VIEW_HEIGHT;
  const width = view.clientWidth || VIEW_HEIGHT;
  size = { width, scale: Math.min(height / VIEW_HEIGHT, width / VIEW_WIDTH), lead: width < height ? NARROW_LEAD : LEAD };
}
window.addEventListener('resize', () => { size = null; });

let shownCount = null;

// Draws her, the camera and the counter where the runner says. Everything
// moves by transforms, which the graphics chip does without laying the
// page out again, so it stays smooth on phones and tablets.
export function render() {
  if (!size) measure();
  const { width, scale, lead } = size;
  // The camera stops on whole screen pixels, so edges don't shimmer
  const camera = Math.round((state.x - (width / scale) * lead) * scale) / scale;
  course.style.transform = `scale(${scale}) translate3d(${-camera}px, 0, 0)`;
  // (wrapped to 0 up to a hill, even while the camera's still left of the start)
  const drift = (((camera * scale * HILLS_SPEED) % HILL_WIDTH) + HILL_WIDTH) % HILL_WIDTH;
  hills.style.transform = `translate3d(${-drift}px, 0, 0)`;
  runnerEl.style.transform = `translate3d(${state.x - 70}px, ${-state.y}px, 0)`;
  runnerEl.classList.toggle('dashing', state.dashing);
  // A shooting star she's riding goes along with her
  if (state.riding !== null) {
    const star = LEVEL.stars[state.riding];
    stars[state.riding].style.transform = `translate3d(${state.x - star.x}px, 0, 0)`;
  }
  // Only when a diamond's caught (or they're all put back)
  if (state.collected.size !== shownCount) {
    shownCount = state.collected.size;
    gems.forEach((gem, i) => gem.classList.toggle('got', state.collected.has(i)));
    countNumber.textContent = shownCount;
    count.setAttribute('aria-label', `${shownCount} diamonds`);
  }
}

// Every diamond caught?
const allGems = () => state.collected.size === LEVEL.gems.length;

// Plays a one-off animation again, even if it played a moment ago.
function replay(element, className) {
  element.classList.remove(className);
  void element.offsetWidth; // restart it
  element.classList.add(className);
}

function frame(time) {
  const dt = last === null ? 0 : Math.min(0.05, (time - last) / 1000);
  last = time;
  const events = step(state, dt, { pressed, held });
  pressed = false;
  render();
  if (events.includes('paint')) {
    setMane(unicorn, maneNamed(state.mane));
    replay(pots[state.painted], 'splash');
  }
  if (events.includes('ride')) stars[state.riding].classList.add('riding');
  if (events.includes('hop-off')) {
    const star = [...state.rode].at(-1);
    stars[star].classList.replace('riding', 'gone'); // zooms off and fades
  }
  if (events.includes('smash')) walls[state.hit].classList.add('smashed');
  if (events.includes('thud')) replay(walls[state.hit], 'wobble');
  if (events.includes('bounce')) replay(gumdrops[state.bounced], 'squish');
  if (events.includes('gem')) replay(count, 'bump');
  if (events.includes('finish')) {
    for (const burst of fireworks) burst.classList.toggle('going', allGems());
    setTimeout(() => { finish.hidden = false; }, FINISH_DELAY_MS);
    return;
  }
  if (events.includes('ouch')) replay(thorns[state.ouch], 'ouch');
  if (events.includes('fall') || events.includes('ouch')) {
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

// A double tap on the course is a double jump, and a phone mustn't zoom in
// on it instead: once zoomed, the phone takes taps for moving the page
// about, and she can't jump or dash. (styles.css says so too, but not every
// phone listens.) Nor a pinch, on an iPhone.
view.addEventListener('touchend', (event) => event.preventDefault());
view.addEventListener('dblclick', (event) => event.preventDefault());
document.addEventListener('gesturestart', (event) => event.preventDefault());

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
  state = createRunner(LEVEL, mane.name);
  setMane(unicorn, mane); // back to the color she came with
  for (const wall of walls) wall.classList.remove('smashed', 'wobble');
  for (const thorn of thorns) thorn.classList.remove('ouch');
  for (const star of stars) {
    star.classList.remove('riding', 'gone');
    star.style.transform = '';
  }
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

// A card shows first, with two buttons: Go starts her running, and How to
// play opens the directions on it, for whoever wants them.
const directions = document.querySelector('.directions');
const goButton = document.querySelector('.go-btn');
const howButton = document.querySelector('.how-btn');

howButton.addEventListener('click', () => {
  document.querySelector('.how-to').hidden = false;
  howButton.hidden = true;
  goButton.focus();
});

function go() {
  started = true;
  directions.hidden = true;
  requestAnimationFrame(frame);
}

goButton.addEventListener('click', go);

// Return on a keyboard presses the showing screen's main button: Go, the
// next level (or play again, after the last), or try again.
pressOnReturn(() => {
  if (!directions.hidden) return goButton;
  if (!finish.hidden) return finish.querySelector('.next-btn') ?? finish.querySelector('.replay-btn');
  if (!gameOver.hidden) return gameOver.querySelector('.retry-btn');
  return null; // while she runs
});
render();

