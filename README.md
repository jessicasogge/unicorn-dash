# Unicorn Dash 🦄

A rainbow running game for the browser. Your unicorn gallops across a sky world on her own. You only decide when to **jump** and when to **dash** on a rainbow, and try to make it to the castle.

**[▶ Play Unicorn Dash](https://jessicasogge.github.io/unicorn-dash/)**: works on computers, phones and tablets.

<img src="docs/screenshot.png" alt="The start screen: a white unicorn with a pink mane leaping on a rainbow trail under the words Unicorn Dash, with a big pink Play button below" width="600">

## What's here so far

The **start screen**, the **world map**, and the first two worlds, the **Meadow** and **Candy Canyon**:

- **Tap the unicorn** on the start screen and she hops into a new mane color: pink, then blue, then yellow, then pink again. **Press Play** and she dashes off to the map, keeping her color.
- **On the map**, tap a world and she goes there. Tap the flower world, the **Meadow**, or the lollipop world, **Candy Canyon**, and it opens. The other three worlds aren't built yet, so tapping the one she's on just gets a hop from her. The house button goes back to the start.
- **In the Meadow**, a "How to play" card comes first: a **quick tap** jumps, a **long tap** (hold) dashes. Press **Go!** (or the space bar) and she runs on her own. **Tap** (or press space or the up arrow) to jump, and tap again in the air to jump higher, up to the gems on the clouds. **Hold** to rainbow dash across the long gaps, as long as you like. A counter at the top right counts the rainbow-colored diamonds as she catches them. Catch every diamond and six fireworks go off behind the castle. Fall into a gap and it's **game over**: try again from the start, or go back to the map. Reach the castle and "You beat the level!" comes up: play again, go back to the map, or (from the Meadow) go on to the next level.
- **In Candy Canyon**, it's the same, plus **gumdrops** in the ground: run onto one and she bounces up high, to diamonds in the sky. The sky and hills are pink, and the ground is frosting on chocolate.

There are no stars or scores, and nothing is saved. There are a few words, like "Game Over", but reading isn't the point: everything you need to play is shown with pictures, and each button has a name for screen readers.

## The plan

- **One button, two moves.** Tap (or space or the up arrow) to jump, tap again in the air to double jump. Hold to **rainbow dash**, for as long as you like: it bridges gaps and smashes crystal walls.
- **Mane magic.** Paint pots change her mane to pink ♥, blue ★ or yellow ☾. Gates only let a matching mane through. Every color has its own shape, so colorblind players can play too.
- **Five worlds**, each adding one new idea: Meadow, Candy Canyon (bouncy gumdrops), Cloud Kingdom (color gates), Crystal Caves (dash-only walls) and Night Sky (everything, plus shooting stars).
- **Nothing to unlock.** Every world, level and unicorn in the **stable** is open from the start, and there are no stars or scores: nothing is saved. A fall into a gap is game over, and you try the level again from the start.

## Running it locally

The game is plain HTML, CSS and JavaScript in [`public/`](public/), with no build step. To run it with the included dev server:

```sh
npm install
npm run dev
```

Then open http://localhost:3006.

## Tests

```sh
npm test                # run the tests
npm run test:coverage   # run them and check how much of the game they cover
```

The tests use [Vitest](https://vitest.dev/). The game logic runs in [jsdom](https://github.com/jsdom/jsdom), a simulated browser page. The coverage check fails if the tests leave game code untested (the thresholds are in [`vitest.config.js`](vitest.config.js)), and the deploy runs it, so untested code doesn't ship.

## Project layout

| Path | What's there |
|---|---|
| `public/index.html` | The start screen |
| `public/script.js` | The start screen's taps: a new mane color, and Play |
| `public/world-map.html` | The world map: the five worlds |
| `public/game/world-map.js` | Puts her on the map, with the mane she came with, and moves her to the world you tap |
| `public/meadow.html`, `public/candy.html` | The Meadow and Candy Canyon, the first two worlds |
| `public/game/level.js` | Draws a level and runs her through it: the controls, the camera, the castle. Each level page names its course (`data-level`) and the level after it (`data-next`) |
| `public/game/runner.js` | Her running, jumping, dashing and bouncing, with no drawing: speeds, gravity, diamonds |
| `public/game/course.js` | Each level's course: where the ground, gaps, clouds, gumdrops and gems are |
| `public/game/unicorn.js` | The unicorn's drawing and her three mane colors, in one place |
| `public/styles.css` | How every screen looks, and the hop and dash animations |
| `test/` | Tests |
| `src/index.ts` | Small Express server for local development |

## Deployment

Every push to `main` runs the tests and the coverage check and, if they pass, publishes `public/` to GitHub Pages (see [`.github/workflows/pages.yml`](.github/workflows/pages.yml)).

## Contributing

Bug reports, ideas and fixes are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Unicorn Dash is released under the [MIT License](LICENSE). It uses the [Fredoka](https://github.com/hafontia/Fredoka-One) and [Nunito](https://github.com/googlefonts/nunito) fonts, under the SIL Open Font License ([`public/fonts/`](public/fonts/)).

## Credits

Made by Jessica Sogge. 
