import { HOP_MS, drawUnicorn, maneFromAddress, nextMane, setMane } from './game/unicorn.js';

export { HOP_MS }; // a hop, the same on every screen
export const DASH_MS = 900; // galloping off the right of the screen
export const RETURN_MS = 600; // trotting back in, when you come back to it
export const NEXT_PAGE = './world-map.html';

const stage = document.querySelector('.stage');
const tapTarget = document.querySelector('.unicorn-btn');
const playButton = document.querySelector('.play-btn');

if (stage && tapTarget && playButton) {
  // Back from the map, she still has the mane she left with.
  let mane = maneFromAddress(location.search);
  const unicorn = drawUnicorn(mane);
  tapTarget.append(unicorn);

  // Tap her: a hop, and the next mane color. A tap mid-hop is ignored, so
  // quick taps don't skip colors without a hop to show for it.
  tapTarget.addEventListener('click', () => {
    if (stage.classList.contains('hopping') || stage.classList.contains('dashing')) return;
    mane = nextMane(mane);
    setMane(unicorn, mane);
    // Put it in this page's address too, so the Back button from the map
    // brings her back with it.
    history.replaceState(null, '', `?mane=${mane.name}`);
    stage.classList.add('hopping');
    setTimeout(() => stage.classList.remove('hopping'), HOP_MS);
  });

  // Play: she gallops off the screen, and the map opens once she's gone.
  playButton.addEventListener('click', () => {
    playButton.disabled = true;
    stage.classList.remove('hopping', 'returning');
    stage.classList.add('dashing');
    setTimeout(() => {
      location.href = `${NEXT_PAGE}?mane=${mane.name}`;
    }, DASH_MS);
  });

  // On Back, reset the unicorn and Play button if the page was cached.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    playButton.disabled = false;
    stage.classList.replace('dashing', 'returning');
    setTimeout(() => stage.classList.remove('returning'), RETURN_MS);
  });
}
