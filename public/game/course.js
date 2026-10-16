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
    [150, 230], [800, 180], [1300, 250], [1900, 200], [2800, 240], [3300, 190],
    [3800, 260], [4450, 210], [5450, 240], [5900, 190], [6500, 250], [7500, 220],
  ],
  sky: [
    [150, 320, 1], [900, 270, 0.8], [1700, 360, 1.1], [2500, 290, 0.9],
    [3300, 360, 1.2], [4100, 280, 0.8], [4900, 350, 1], [5700, 300, 1.1],
    [6500, 360, 0.9], [7200, 280, 1],
  ],
  start: 0,
  castle: 6900,
};

export const LEVELS = { meadow: MEADOW, candy: CANDY };
