// The levels' courses, in world units (x right, y up): short gaps take a
// jump, long gaps a rainbow dash.

export const MEADOW = {
  // Ground, as [from, to] along x. The spaces between are gaps.
  ground: [
    [-400, 900],
    [1020, 1800], // short gap before: a jump
    [1920, 2700], // short gap
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
    [500, 60], [600, 60], [700, 60],
    [1360, 240], [1410, 240], [1460, 240],
    [2300, 60], [2400, 60], [2500, 60],
    [2900, 150], [3000, 150], // over the gap, at dashing height
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
  bouncers: [],
  trees: [],
  pots: [],
  walls: [],
  crystals: [],
  stars: [],
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
    [6020, 9800], // short gap; on past the castle
  ],
  clouds: [],
  // Gumdrops, by where they are along x, each well before the next gap so
  // she comes down on solid ground.
  bouncers: [450, 1450, 2950, 4050],
  gems: [
    [570, 330], [620, 390], [670, 330], // up a bounce
    [1570, 330], [1620, 390], [1670, 330],
    [2350, 150], [2450, 150], // over the gap, at dashing height
    [3070, 330], [3120, 390], [3170, 330],
    [4170, 330], [4220, 390], [4270, 330],
    [4950, 150], [5050, 150],
    [5650, 60], [5750, 60],
    [5960, 150], // over the last gap, up a jump
    [6300, 60],
  ],
  // Lollipop trees in the background, just for looks: [x, height]
  trees: [
    [150, 230], [1300, 250], [2800, 240], [3800, 260], [5450, 240], [6500, 250],
  ],
  sky: [
    [150, 320, 1], [900, 270, 0.8], [1700, 360, 1.1], [2500, 290, 0.9],
    [3300, 360, 1.2], [4100, 280, 0.8], [4900, 350, 1], [5700, 300, 1.1],
    [6500, 360, 0.9], [7200, 280, 1],
  ],
  pots: [],
  walls: [],
  crystals: [],
  stars: [],
  start: 0,
  castle: 6900,
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
    [6920, 10300], // short gap; on past the castle
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
  ],
  bouncers: [],
  trees: [],
  gems: [
    [300, 60], [400, 60],
    [1760, 240], [1810, 240], [1860, 240], // up on a cloud
    [2650, 150], [2750, 150], [2850, 150], // over the gap
    [3450, 60], [3800, 60],
    [4560, 240], [4610, 240], [4660, 240],
    [5450, 150], [5550, 150], [5650, 150],
    [6700, 60],
    [6860, 150], // over the last gap, up a jump
    [7050, 60], [7150, 60],
  ],
  sky: [
    [100, 330, 1.2], [700, 260, 0.9], [1400, 360, 1.3], [2100, 290, 1],
    [2800, 370, 1.2], [3500, 270, 1], [4200, 350, 1.3], [4900, 290, 0.9],
    [5600, 360, 1.2], [6300, 280, 1.1], [7000, 340, 1],
  ],
  walls: [],
  crystals: [],
  stars: [],
  start: 0,
  castle: 7300,
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
    [6970, 10500], // short gap; on past the castle
  ],
  clouds: [
    { from: 1700, to: 1920, top: 170 },
    { from: 4400, to: 4620, top: 170 },
  ],
  // Crystal walls, by where they are along x
  walls: [800, 2150, 3550, 4950, 6450],
  gems: [
    [400, 60], [500, 60],
    [920, 150], [980, 150], // just past a wall, at dashing height
    [1760, 240], [1810, 240], [1860, 240], // up on a cloud
    [2700, 150], [2800, 150], [2900, 150], // over the gap
    [3670, 150], [3730, 150],
    [4460, 240], [4510, 240], [4560, 240],
    [5650, 150],
    [6700, 60],
    [6910, 150], // over the last gap, up a jump
    [7100, 60], [7250, 60],
  ],
  // Glowing crystals in the background, just for looks: [x, height]
  crystals: [
    [250, 180], [1500, 220], [3300, 200], [4700, 240], [6100, 210], [7200, 230],
  ],
  sky: [],
  bouncers: [],
  trees: [],
  pots: [],
  stars: [],
  start: 0,
  castle: 7500,
};

// The Night Sky, the last world: a bit of everything (a gumdrop, a paint
// pot, a crystal wall, gaps to jump and dash), plus shooting stars
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
    [8270, 12500], // short gap; on past the castle
  ],
  clouds: [],
  bouncers: [1700, 6250],
  stars: [
    { x: 1950, y: 260, length: 1100 },
    { x: 6500, y: 260, length: 1300 },
  ],
  walls: [3450],
  pots: [{ x: 4400, mane: 'blue' }],
  gems: [
    [400, 60], [500, 60],
    [2200, 310], [2350, 310], [2500, 310], [2650, 310], // along a shooting star
    [3560, 150], [3620, 150], // just past the wall, at dashing height
    [4200, 60], [4300, 60],
    [5450, 150], [5550, 150], // over the gap
    [6800, 310], [7000, 310], [7200, 310], [7400, 310],
    [8050, 60],
    [8210, 150], // over the last gap, up a jump
    [8400, 60], [8500, 60],
  ],
  trees: [],
  crystals: [],
  sky: [],
  start: 0,
  castle: 8600,
};

export const LEVELS = { meadow: MEADOW, candy: CANDY, cloud: CLOUD, crystal: CRYSTAL, night: NIGHT };
