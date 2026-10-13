# Unicorn Dash 🦄

A rainbow running game for the browser. Your unicorn gallops across a sky world on her own. You only decide when to **jump** and when to **dash** on a rainbow, and try to make it to the castle.

**[▶ Play Unicorn Dash](https://jessicasogge.github.io/unicorn-dash/)**: works on computers, phones and tablets.

<img src="docs/screenshot.png" alt="The start screen: a white unicorn with a pink mane leaping on a rainbow trail under the words Unicorn Dash, with a big pink Play button below" width="600">

## What's here so far

The **start screen** and the **world map**:

- **Tap the unicorn** and she hops into a new mane color: pink, then blue, then yellow, then pink again. In the game, gates only let a matching mane through.
- **Press Play** and she dashes off on her rainbow to the **world map**, keeping her mane color.
- **On the map**, she stands on the Meadow, the first of five worlds. The other four are locked for now, and so are levels 2 to 5. The levels themselves aren't built yet, so tapping level 1 just gets a hop from her. The house button takes you back to the start.

Everything is pictures and numbers, not words. Each button has a name for screen readers, and if a device asks for less motion, she stays still.

## The plan

- **One button, two moves.** Tap (or space or the up arrow) to jump, tap again in the air to double jump. Hold to **rainbow dash**: it bridges gaps and smashes crystal walls, but uses up the **sparkle meter**. Sparkle gems fill it back up.
- **Mane magic.** Paint pots change her mane to pink ♥, blue ★ or yellow ☾. Gates only let a matching mane through. Every color has its own shape, so colorblind players can play too.
- **Five worlds**, each adding one new idea: Meadow, Candy Canyon (bouncy gumdrops), Cloud Kingdom (color gates), Crystal Caves (dash-only walls) and Night Sky (everything, plus shooting stars).
- **No game over.** A fall puts her back at the last checkpoint flag. Three hidden golden horseshoes per level earn up to three stars, and stars unlock new unicorns in the **stable**, just for looks.

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
| `public/world-map.html` | The world map: the five worlds and the Meadow's levels |
| `public/game/world-map.js` | Puts her on the map, with the mane she came with |
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
