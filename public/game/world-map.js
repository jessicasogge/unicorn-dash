// The world map: the five worlds, with the unicorn standing on the one
// she's in. Every world is open: tap one and she goes there.
import { HOP_MS, drawUnicorn, maneFromAddress } from './unicorn.js';

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

// The worlds that are built so far, and where each one opens.
export const WORLD_PAGES = { meadow: './meadow.html', candy: './candy.html', cloud: './cloud.html' };

for (const world of worlds) {
  world.querySelector('.island').addEventListener('click', () => {
    const page = WORLD_PAGES[world.dataset.world];
    if (page) open(world, page);
    else if (world === here) hop();
    else goTo(world);
  });
}

// She goes to the world and hops in, then it opens.
function open(world, page) {
  if (world.classList.contains('hopping')) return;
  goTo(world);
  hop();
  setTimeout(() => {
    location.href = `${page}?mane=${mane.name}`;
  }, HOP_MS);
}

// Home keeps her mane, too.
const home = document.querySelector('.home-btn');
if (home) home.href = `./index.html?mane=${mane.name}`;

// Tap a world that isn't built yet, while she's on it, and she hops. A tap
// mid-hop is ignored.
function hop() {
  if (here.classList.contains('hopping')) return;
  const world = here;
  world.classList.add('hopping');
  setTimeout(() => world.classList.remove('hopping'), HOP_MS);
}
