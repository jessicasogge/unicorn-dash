// The world map: the five worlds, with the unicorn standing on the one
// she's in. Every world is open: tap one and she goes there, and it opens.
import { HOP_MS, drawUnicorn, maneFromAddress, pressOnReturn } from './unicorn.js';

const mane = maneFromAddress(location.search);
const worlds = [...document.querySelectorAll('.world')];

// She starts on the Meadow, every time: nothing is saved.
let here = worlds[0];

// She stands on the world she's in, with the mane she had on the start
// screen.
const unicorn = drawUnicorn(mane);

function goTo(world) {
  here.classList.remove('here', 'hopping');
  here.querySelector('.island').setAttribute('aria-pressed', 'false');
  here = world;
  here.classList.add('here');
  here.querySelector('.island').setAttribute('aria-pressed', 'true');
  here.querySelector('.perch').append(unicorn);
}

if (here) goTo(here);

// Where each world opens.
export const WORLD_PAGES = {
  meadow: './meadow.html',
  candy: './candy.html',
  cloud: './cloud.html',
  crystal: './crystal.html',
  night: './night.html',
};

// Tap a world, or its name: she goes there and hops in, then it opens.
// Another tap on it while she's hopping is ignored; a tap on a different
// world goes there instead.
let opening = null;
for (const world of worlds) {
  const open = () => {
    if (world.classList.contains('hopping')) return;
    clearTimeout(opening);
    goTo(world);
    world.classList.add('hopping');
    opening = setTimeout(() => {
      location.href = `${WORLD_PAGES[world.dataset.world]}?mane=${mane.name}`;
    }, HOP_MS);
  };
  world.querySelector('.island').addEventListener('click', open);
  world.querySelector('.world-name').addEventListener('click', open);
}

// Return on a keyboard opens the world she's on
if (here) pressOnReturn(() => here.querySelector('.island'));

// Home keeps her mane, too.
const home = document.querySelector('.home-btn');
if (home) home.href = `./index.html?mane=${mane.name}`;
