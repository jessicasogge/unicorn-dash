// Meadow course in world units (x right, y up): short gaps jump, long gaps
// need a rainbow dash, fueled by gems just before them.

export const MEADOW = {
  // Ground, as [from, to] along x. The spaces between are gaps.
  ground: [
    [-400, 900],
    [1020, 1800], // short gap before: a jump
    [1920, 2700], // short gap
    [3220, 4000], // long gap before: a dash
    [4120, 4700], // short gap
    [5240, 6700], // long gap
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
    [2900, 90], [3000, 90],
    [4360, 240], [4410, 240], [4460, 240],
    [4900, 60], [5000, 90],
  ],
  start: 0,
  castle: 6300,
};
