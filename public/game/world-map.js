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

for (const world of worlds) {
  world.querySelector('.island').addEventListener('click', () => {
    if (world === here) hop();
    else goTo(world);
  });
}

// Home keeps her mane, too.
const home = document.querySelector('.home-btn');
if (home) home.href = `./index.html?mane=${mane.name}`;

// Tap the world she's already on and she hops. (The worlds themselves
// aren't built yet; this is where one will open.) A tap mid-hop is ignored.
function hop() {
  if (here.classList.contains('hopping')) return;
  const world = here;
  world.classList.add('hopping');
  setTimeout(() => world.classList.remove('hopping'), HOP_MS);
}
