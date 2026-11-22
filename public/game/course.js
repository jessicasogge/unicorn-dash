// The levels' courses, in world units (x right, y up): short gaps take a
// jump, long gaps a rainbow dash. Each world has one more gap than the one
// before, and more diamonds, so they get harder (and richer) as you go.

export const MEADOW = {
  // Ground, as [from, to] along x. The spaces between are gaps.
  ground: [
    [-400, 900],
    [1020, 2700], // short gap before: a jump
    [3220, 3880], // long gap before: a dash
    [4000, 4700], // short gap, with a run-up to the cloud
    [5240, 5700], // long gap
    [5820, 9500], // short gap; runs on well past the castle, so no empty sky
  ],
  // Floating clouds to land on, for the gems up high.
  clouds: [
    { from: 1300, to: 1520, top: 170 },
    { from: 4300, to: 4520, top: 170 },
  ],
  gems: [
    [500, 60], [700, 60],
    [1360, 240], [1410, 240], [1460, 240],
    [2300, 150], // up over a thistle
    [2500, 60], [2600, 60],
    [2900, 150], [3000, 150], // over the gap, at dashing height
    [3625, 150], // up over a thistle
    [4360, 240], [4410, 240], [4460, 240],
    [4900, 150], [5000, 150], // over the gap
    [5450, 60], [5550, 60],
    [5760, 150], // over the last gap, up a jump
    [6000, 60],
  ],
  // Clouds in the sky, just for looks: [x, y, size]
  sky: [
    [200, 330, 1], [800, 260, 0.7], [1500, 360, 1.2], [2200, 290, 0.8],
    [2900, 370, 1], [3600, 280, 1.1], [4300, 340, 0.7], [5000, 300, 1.2],
    [5700, 360, 0.9], [6400, 280, 1],
  ],
  // Prickly things to jump over (game over if she runs into one), by x:
  // only between the first gap and the last
  thorns: [2300, 3625],
  bouncers: [],
  trees: [],
  pots: [],
  walls: [],
  crystals: [],
  stars: [],
  bubbles: [],
  start: 0,
  castle: 6300,
};

// Candy Canyon: gumdrops in the ground bounce her up high, to diamonds in
// the air that a jump can't reach.
export const CANDY = {
  ground: [
    [-400, 1000],
    [1120, 2100], // short gap
    [2650, 3500], // long gap
    [3620, 4700], // short gap
    [5250, 5900], // long gap
    [6020, 6320], // short gap, with a gumdrop to bounce her right over the next
    [6440, 10320], // short gap; on past the castle
  ],
  clouds: [],
  // Prickly things to jump over (game over if she runs into one), by x:
  // only between the first gap and the last
  thorns: [1875, 3825, 5650],
  // Gumdrops, by where they are along x, each well before the next gap so
  // she comes down on solid ground.
  bouncers: [450, 1450, 2950, 4050, 6150],
  gems: [
    [570, 330], [620, 390], [670, 330], // up a bounce
    [1570, 330], [1620, 390], [1670, 330],
    [1875, 150], // up over a spiky candy
    [2350, 150], [2450, 150], // over the gap, at dashing height
    [3070, 330], [3120, 390], [3170, 330],
    [3825, 150], // up over a spiky candy
    [4170, 330], [4220, 390], [4270, 330],
    [4950, 150], [5050, 150],
    [5650, 150], // up over a spiky candy
    [5960, 150], // over the gap, up a jump
    [6230, 330], [6320, 390], [6410, 330], // up a bounce, over the last gap
  ],
  // Lollipop trees in the background, just for looks: [x, height]
  trees: [
    [150, 230], [1300, 250], [2800, 240], [3800, 260], [5450, 240], [7020, 250],
  ],
  sky: [
    [150, 320, 1], [900, 270, 0.8], [1700, 360, 1.1], [2500, 290, 0.9],
    [3300, 360, 1.2], [4100, 280, 0.8], [4900, 350, 1], [5700, 300, 1.1],
    [6600, 280, 1], [7300, 360, 0.9], [7900, 280, 1],
  ],
  pots: [],
  walls: [],
  crystals: [],
  stars: [],
  bubbles: [],
  start: 0,
  castle: 7420,
};

// Cloud Kingdom: paint pots along the way change her mane's color, one
// color after another.
export const CLOUD = {
  ground: [
    [-400, 1150],
    [1270, 2450], // short gap
    [3000, 3950], // long gap
    [4070, 5250], // short gap
    [5800, 6800], // long gap
    [6920, 7220], // short gap
    [7770, 8270], // long gap, with a paint pot after it
    [8390, 11400], // short gap; on past the castle
  ],
  clouds: [
    { from: 1700, to: 1920, top: 170 },
    { from: 4500, to: 4720, top: 170 },
  ],
  pots: [
    { x: 500, mane: 'blue' },
    { x: 2050, mane: 'yellow' },
    { x: 3300, mane: 'pink' },
    { x: 4900, mane: 'blue' },
    { x: 6200, mane: 'yellow' },
    { x: 8020, mane: 'pink' },
  ],
  // Prickly things to jump over (game over if she runs into one), by x:
  // only between the first gap and the last
  thorns: [3600, 6500],
  bouncers: [],
  trees: [],
  gems: [
    [300, 60], [400, 60],
    [1760, 240], [1810, 240], [1860, 240], // up on a cloud
    [2650, 150], [2750, 150], [2850, 150], // over the gap
    [3600, 150], // up over a thundercloud
    [3800, 60],
    [4560, 240], [4610, 240], [4660, 240],
    [5450, 150], [5550, 150], [5650, 150],
    [6700, 60],
    [6860, 150], // over the gap, up a jump
    [6500, 150], [7050, 60],
    [7400, 150], [7500, 150], [7600, 150], // over the long gap
    [8280, 160], [8340, 200], [8400, 160], // an arc over the last gap
  ],
  sky: [
    [100, 330, 1.2], [700, 260, 0.9], [1400, 360, 1.3], [2100, 290, 1],
    [2800, 370, 1.2], [3500, 270, 1], [4200, 350, 1.3], [4900, 290, 0.9],
    [5600, 360, 1.2], [6300, 280, 1.1], [7000, 340, 1], [7700, 290, 1.2], [8400, 350, 0.9],
  ],
  walls: [],
  crystals: [],
  stars: [],
  bubbles: [],
  start: 0,
  castle: 8900,
};

// Crystal Caves: crystal walls only break for a rainbow dash, and knock
// her back otherwise. Each wall stands well after the gap before it, so a
// knock back lands her on solid ground.
export const CRYSTAL = {
  ground: [
    [-400, 1200],
    [1320, 2500], // short gap
    [3050, 4100], // long gap
    [4220, 5400], // short gap
    [5950, 6850], // long gap
    [6970, 7270], // short gap
    [7390, 8090], // short gap, with a bramble
    [8640, 9140], // long gap
    [9260, 11500], // short gap; on past the castle
  ],
  clouds: [
    { from: 1700, to: 1920, top: 170 },
    { from: 4400, to: 4620, top: 170 },
  ],
  // Crystal walls, by where they are along x
  // Prickly things to jump over (game over if she runs into one), by x:
  // only between the first gap and the last
  thorns: [2300, 3900, 7740],
  walls: [800, 2150, 3550, 4950, 6450],
  gems: [
    [400, 60],
    [920, 150], [980, 150], // just past a wall, at dashing height
    [1760, 240], [1810, 240], [1860, 240], // up on a cloud
    [2300, 150], // up over a bramble
    [2700, 150], [2800, 150], [2900, 150], // over the gap
    [3670, 150], [3730, 150],
    [3900, 150], // up over a bramble
    [4460, 240], [4510, 240], [4560, 240],
    [5650, 150],
    [6700, 60],
    [6910, 150], // over the gap, up a jump
    [7280, 160], [7340, 200], [7400, 160], // an arc over a gap
    [7740, 150], // up over a bramble
    [8300, 150], [8430, 150], // over the long gap
    [9150, 160], [9210, 200], [9270, 160], // an arc over the last gap
    [7100, 60],
  ],
  // Glowing crystals in the background, just for looks: [x, height]
  crystals: [
    [250, 180], [1500, 220], [3300, 200], [4700, 240], [6100, 210], [7100, 230], [8850, 220],
  ],
  sky: [],
  bouncers: [],
  trees: [],
  pots: [],
  stars: [],
  bubbles: [],
  start: 0,
  castle: 9750,
};

// Under the Sea: bubbles on the sea floor. Running into one, she floats up
// inside it, along a trail of little fish, high over a gap, and it pops: she
// falls the rest of the way, landing on the far side. Each bubble is just
// before its gap, so she floats over it without a tap.
export const SEA = {
  ground: [
    [-400, 1100],
    [1220, 1650], // short gap; a bubble floats her over the next
    [1880, 3000],
    [3550, 4050], // long gap; a bubble floats her over the next
    [4280, 5300],
    [5420, 5950], // short gap; a bubble floats her over the next
    [6180, 7400],
    [7950, 8300], // long gap
    [8420, 8800], // short gap
    [8920, 11000], // short gap; on past the castle
  ],
  clouds: [],
  // Bubbles, by where they are along x
  bubbles: [1500, 3900, 5800],
  gems: [
    [400, 60],
    [1500, 100], [1600, 190], [1700, 275], [1800, 345], // up in a bubble
    [2200, 60],
    [2450, 150], // up over a sea urchin
    [3200, 150], [3350, 150], // over the long gap
    [3900, 100], [4000, 190], [4100, 275], [4200, 345],
    [4800, 150],
    [5360, 150], // over the gap, up a jump
    [5800, 100], [5900, 190], [6000, 275], [6100, 345],
    [6500, 60], [6600, 60],
    [6950, 150],
    [7600, 150], [7750, 150],
    [8310, 160], [8370, 200], [8430, 160], // an arc over a gap
    [8810, 160], [8870, 200], [8930, 160], // an arc over the last gap
  ],
  // Prickly things to jump over (game over if she runs into one), by x:
  // only between the first gap and the last
  thorns: [2450, 4800, 6950],
  bouncers: [],
  pots: [],
  walls: [],
  stars: [],
  trees: [],
  crystals: [],
  sky: [],
  start: 0,
  castle: 9400,
};

// The Night Sky, the last world: a bit of everything (a gumdrop, a paint
// pot, a crystal wall, a bubble, gaps to jump and dash), plus shooting stars
// to ride across the sky. A gumdrop launches her up to each star, and each
// one drops her off on solid ground.
export const NIGHT = {
  ground: [
    [-400, 1100],
    [1220, 2300], // short gap
    [2900, 3900], // long gap, under a shooting star
    [4020, 5200], // short gap
    [5800, 6900], // long gap
    [7700, 8150], // a very long gap, under a shooting star
    [8270, 8570], // short gap
    [8690, 9290], // short gap, with a gumdrop up to a shooting star
    [9890, 11450], // long gap, under the shooting star; then a bramble, and a bubble
    [11680, 12100], // a gap the bubble floats her over
    [12220, 14300], // short gap; on past the castle
  ],
  clouds: [],
  bouncers: [1700, 6250, 8840],
  stars: [
    { x: 1950, y: 260, length: 1100 },
    { x: 6500, y: 260, length: 1300 },
    { x: 9090, y: 260, length: 1000 },
  ],
  bubbles: [11300],
  // Prickly things to jump over (game over if she runs into one), by x:
  // only between the first gap and the last
  thorns: [1450, 4800, 10500],
  walls: [3450],
  pots: [{ x: 4400, mane: 'blue' }],
  gems: [
    [400, 60],
    [1450, 150], // up over a bramble
    [2200, 310], [2350, 310], [2500, 310], [2650, 310], // along a shooting star
    [3560, 150], [3620, 150], // just past the wall, at dashing height
    [4200, 60], [4800, 150], // up over a bramble
    [5450, 150], [5550, 150], // over the gap
    [6800, 310], [7000, 310], [7200, 310], [7400, 310],
    [8050, 60],
    [8210, 150], // over the gap, up a jump
    [8400, 60], [8500, 60],
    [8580, 160], [8640, 200], [8700, 160], // an arc over a gap
    [9300, 310], [9500, 310], [9700, 310], [9900, 310], // along the shooting star
    [10500, 150], // up over a bramble
    [11300, 100], [11400, 190], [11500, 275], [11600, 345], // up in a bubble
    [12110, 160], [12170, 200], [12230, 160], // an arc over the last gap
  ],
  trees: [],
  crystals: [],
  sky: [],
  start: 0,
  castle: 12750,
};

export const LEVELS = { meadow: MEADOW, candy: CANDY, cloud: CLOUD, crystal: CRYSTAL, sea: SEA, night: NIGHT };
