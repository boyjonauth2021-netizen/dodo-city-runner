// Central game configuration. Only LEVELS_ENABLED levels are shown/playable.
export const LANE_W = 2.4;
export const CHUNK_LEN = 40;
export const LEVELS_ENABLED = 1;   // set to 1 for a single-level build
export const LEVELS = [
  {
    id: 1, name: 'Port Louis Streets', tagline: 'Easy start: barriers, cones, cars and a few buses.',
    goal: 1100, speed: [15, 20.5], gap: [32, 22], coinStar: 55, stationShare: 0.18,
    weights: { barrier: 3, cones: 2, bar: 2, car: 2.5, bus: 1.2, trainRamp: 0.6, row: 1.2, oncomingCar: 0 },
    music: 0, sky: 'day',
  },
  {
    id: 2, name: 'Metro Express Rush', tagline: 'Faster and denser: trains, buses, oncoming metros.',
    goal: 1900, speed: [20, 27.5], gap: [28, 18], coinStar: 110, stationShare: 0.7,
    weights: { barrier: 1.5, cones: 1, bar: 2.5, car: 2, bus: 3, trainRamp: 2.4, row: 1.8, oncomingTrain: 2.4, oncomingBus: 1.4, oncomingCar: 1 },
    music: 1, sky: 'dusk',
  },
];
export const PLAYER = { gravity: 52, jumpV: 18.2, slideTime: 0.75, laneSpeed: 16, height: 1.6, slideHeight: 0.6 };
export const STUMBLE_HEAL = 14; // seconds: a second stumble within this window = caught
export const SAVE_KEY = 'dodoCityRunner.v1';
