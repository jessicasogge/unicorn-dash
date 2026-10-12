// The start screen: the unicorn on her rainbow, and the Play button.
// Nothing here needs reading: tap her and she hops into a new mane color,
// press Play and she dashes off.
import { MANES, drawUnicorn, nextMane, setMane } from './game/unicorn.js';

// How long each move takes, in milliseconds. styles.css uses the same
// lengths for the animations, so keep the two in step.
export const HOP_MS = 450;
export const DASH_MS = 900; // galloping off the right of the screen
export const RETURN_MS = 600; // and trotting back in from the left

const stage = document.querySelector('.stage');
const tapTarget = document.querySelector('.unicorn-btn');
const playButton = document.querySelector('.play-btn');

if (stage && tapTarget && playButton) {
  let mane = MANES[0];
  const unicorn = drawUnicorn(mane);
  tapTarget.append(unicorn);

  // Tap her: a hop, and the next mane color. A tap mid-hop is ignored, so
  // quick taps don't skip colors without a hop to show for it.
  tapTarget.addEventListener('click', () => {
    if (stage.classList.contains('hopping') || stage.classList.contains('dashing')) return;
    mane = nextMane(mane);
    setMane(unicorn, mane);
    stage.classList.add('hopping');
    setTimeout(() => stage.classList.remove('hopping'), HOP_MS);
  });

  // Play: she gallops off, then comes back. (The world map will open here
  // once it's built; for now the start screen is the whole game.)
  playButton.addEventListener('click', () => {
    playButton.disabled = true;
    stage.classList.remove('hopping');
    stage.classList.add('dashing');
    setTimeout(() => {
      stage.classList.replace('dashing', 'returning');
      setTimeout(() => {
        stage.classList.remove('returning');
        playButton.disabled = false;
      }, RETURN_MS);
    }, DASH_MS);
  });
}
