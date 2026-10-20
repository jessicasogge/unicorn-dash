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
    [5240, 9500], // long gap; runs on well past the castle, so no empty sky
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
  gates: [],
  walls: [],
  crystals: [],
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
    [5250, 9800], // long gap; on past the castle
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
  gates: [],
  walls: [],
  crystals: [],
  start: 0,
  castle: 6900,
};

// Cloud Kingdom: paint pots change her mane's color, and rainbow gates only
// let the matching color through. Each pot is a short run before its gate,
// so a wrong gate knocks her back over the pot, for the right color.
export const CLOUD = {
  ground: [
    [-400, 1150],
    [1270, 2450], // short gap
    [3000, 3950], // long gap
    [4070, 5250], // short gap
    [5800, 10300], // long gap; on past the castle
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
  gates: [
    { x: 800, mane: 'blue' },
    { x: 2350, mane: 'yellow' },
    { x: 3600, mane: 'pink' },
    { x: 5150, mane: 'blue' },
    { x: 6500, mane: 'yellow' },
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
  ],
  sky: [
    [100, 330, 1.2], [700, 260, 0.9], [1400, 360, 1.3], [2100, 290, 1],
    [2800, 370, 1.2], [3500, 270, 1], [4200, 350, 1.3], [4900, 290, 0.9],
    [5600, 360, 1.2], [6300, 280, 1.1], [7000, 340, 1],
  ],
  walls: [],
  crystals: [],
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
    [5950, 10500], // long gap; on past the castle
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
  ],
  // Glowing crystals in the background, just for looks: [x, height]
  crystals: [
    [250, 180], [1500, 220], [3300, 200], [4700, 240], [6100, 210], [7200, 230],
  ],
  sky: [],
  bouncers: [],
  trees: [],
  pots: [],
  gates: [],
  start: 0,
  castle: 7500,
};

export const LEVELS = { meadow: MEADOW, candy: CANDY, cloud: CLOUD, crystal: CRYSTAL };
