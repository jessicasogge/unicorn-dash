// The world map: the five worlds, with the unicorn standing on the one
// she's in, and that world's levels below. Only the Meadow and its first
// level are open to start with.
import { HOP_MS, drawUnicorn, maneFromAddress } from './unicorn.js';

const mane = maneFromAddress(location.search);

// She stands on the world she's in, with the mane she had on the start
// screen.
const world = document.querySelector('.world:not(.locked)');
const unicorn = drawUnicorn(mane);
world?.querySelector('.perch').append(unicorn);

// Home keeps her mane, too.
const home = document.querySelector('.home-btn');
if (home) home.href = `./index.html?mane=${mane.name}`;

// The levels themselves aren't built yet, so for now a tap on an open one
// gets a hop from her, to show it heard.
for (const level of document.querySelectorAll('.level:not(:disabled)')) {
  level.addEventListener('click', () => {
    if (!world || world.classList.contains('hopping')) return;
    world.classList.add('hopping');
    setTimeout(() => world.classList.remove('hopping'), HOP_MS);
  });
}
