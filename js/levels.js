// Level worlds. A level = { uid, num, name, region, tagline, goal(m), speed[start,end] (m/s), gap[start,end] (m between patterns),
// coinStar, music (0|1), sky (key of SKIES), biome (scenery builder), chaser (key of characters.CHASERS), peds {kinds, animals, n},
// weights {pattern: weight}, signs (French / Kreol strings used on gantries and shops), icon }.
export const SKIES = {
  day:    { tex: 'day',    fog: [0xcfe4f0, 45, 215], hemi: [0xcfe6ff, 1.7],  sun: [0xfff0d0, 2.4], hills: [0x6f8fae, 0x86a4c0], sunPos: [160, 210] },
  dusk:   { tex: 'dusk',   fog: [0xf1c9a6, 45, 215], hemi: [0xffd9c0, 1.35], sun: [0xffb070, 2.2], hills: [0x6a5f86, 0x8a6f8a], sunPos: [90, 60] },
  tropic: { tex: 'tropic', fog: [0xd2eef2, 55, 240], hemi: [0xd8f0ff, 1.8],  sun: [0xfff4d8, 2.6], hills: [0x5f8f98, 0x7fb0b8], sunPos: [140, 220] },
  mist:   { tex: 'mist',   fog: [0xb9c6cc, 22, 120], hemi: [0xdce6ec, 1.9],  sun: [0xe8eef2, 1.5], hills: [0x7f93a0, 0x9aabb6], sunPos: [90, 170] },
  gold:   { tex: 'gold',   fog: [0xf3dcb4, 50, 220], hemi: [0xfff0d8, 1.6],  sun: [0xffdca0, 2.5], hills: [0x8f7f6a, 0xb09878], sunPos: [200, 110] },
  forest: { tex: 'forest', fog: [0xc6dccf, 28, 150], hemi: [0xdaf0e0, 1.75], sun: [0xf4f2d8, 1.9], hills: [0x4f7a5c, 0x6c9578], sunPos: [100, 200] },
  sunset: { tex: 'sunset', fog: [0xe8a070, 40, 200], hemi: [0xffc8a0, 1.2],  sun: [0xff8a50, 2.0], hills: [0x5a3f6a, 0x8a5070], sunPos: [-150, 40] },
  night:  { tex: 'night',  fog: [0x16224a, 30, 150], hemi: [0x7f90d0, 0.95], sun: [0x8fa4e8, 0.9], hills: [0x1a2650, 0x232f60], sunPos: [-120, 150], night: true },
};

const PL = [
  {
    uid: 'pl1', num: 1, name: 'Port Louis Streets', region: 'Port Louis', icon: '🏙️', tagline: 'Easy start: barriers, cones, scooters, carts and a few buses.',
    goal: 2805, speed: [15, 20.5], gap: [32, 22], coinStar: 121, music: 'la_metisse', sky: 'day', biome: 'portlouis', chaser: 'chef', stationShare: 0.18,
    peds: { kinds: ['man', 'woman_casual', 'woman_dress', 'woman_tank'], n: 0.9 },
    weights: { barrier: 2.4, cones: 1.6, bar: 1.8, car: 2.2, bus: 1.4, busRoof: 1.2, trainRamp: 0.8, row: 1, scooter: 1.2, bicycle: 1, dholl: 0.8, pothole: 0.8, puddle: 0.7, roadworks: 0.7, dog: 0.4, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
  {
    uid: 'pl2', num: 2, name: 'Metro Express Rush', region: 'Metro Express', icon: '🚆', tagline: 'Faster and denser: trains, buses, oncoming metros.',
    goal: 4845, speed: [20.5, 28], gap: [28, 19], coinStar: 242, music: 'li_tourner', sky: 'dusk', biome: 'portlouis', chaser: 'chef', stationShare: 0.7,
    peds: { kinds: ['man', 'woman_casual', 'woman_dress', 'woman_tank'], n: 1.2 },
    weights: { barrier: 1.2, cones: 0.8, bar: 2.2, car: 1.8, bus: 2.4, busRoof: 2.2, trainRamp: 2.6, roofRun: 1.6, row: 1.6, oncomingTrain: 1.5, oncomingBus: 1.2, oncomingCar: 0.9, scooter: 1, roadworks: 0.6, pothole: 0.6, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
];

const MT = [
  {
    uid: 'mt1', num: 1, name: 'Caudan Waterfront', region: 'Port Louis harbour', icon: '⚓', tagline: 'Harbour promenade: port crates, gato piment carts, scooters.',
    goal: 2295, speed: [15, 20], gap: [30, 21], coinStar: 106, music: 'roul_matak', sky: 'day', biome: 'caudan', chaser: 'police',
    peds: { kinds: ['man', 'woman_casual', 'woman_dress', 'woman_tank', 'adventurer'], n: 1.1 },
    signs: ['CAUDAN WATERFRONT', 'Bienvenue au Caudan', 'Le Caudan · Port Louis', 'Quai de la Chaux', 'Marché Central →'],
    weights: { barrier: 1.8, cones: 1.6, bar: 1.2, car: 1.6, bus: 0.8, busRoof: 1.2, scooter: 1.4, bicycle: 1.2, dholl: 1.4, crates: 1.6, stallRoof: 0.8, roadworks: 1, puddle: 0.8, pothole: 0.6, row: 0.6, dog: 0.5, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },
  {
    uid: 'mt2', num: 2, name: 'Grand Baie Beach Road', region: 'Grand Baie', icon: '🏖️', tagline: 'Sea-side road: fallen palms, pirogues, crabs and scooters.',
    goal: 2550, speed: [16, 21.5], gap: [29, 20], coinStar: 114, music: 'sega_tioula', sky: 'tropic', biome: 'grandbaie', chaser: 'tourist',
    peds: { kinds: ['woman_tank', 'woman_casual', 'man', 'woman_dress'], animals: ['shiba'], n: 1.0 },
    signs: ['GRAND BAIE', 'Plage Publique', 'Sunset Boulevard', 'La Salette →', 'Bon ti lafet!'],
    weights: { scooter: 1.8, bicycle: 1.4, dholl: 1, car: 1.3, log: 1.6, pirogue: 1.5, crab: 1.3, dog: 1, puddle: 1, cones: 1, barrier: 1, branch: 1, bus: 0.8, busRoof: 1, houseRoof: 0.8, chickens: 0.6, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },
  {
    uid: 'mt3', num: 3, name: 'Pamplemousses Garden', region: 'Pamplemousses', icon: '🪷', tagline: 'Botanical garden: giant water lilies, benches, tortoises, low branches.',
    goal: 2805, speed: [17, 22.5], gap: [28, 19], coinStar: 128, music: 'angui_la_korde', sky: 'tropic', biome: 'pample', chaser: 'gardener',
    peds: { kinds: ['woman_dress', 'woman_casual', 'man', 'adventurer'], n: 1.0 },
    signs: ['JARDIN DE PAMPLEMOUSSES', 'Victoria Regia', 'Sir Seewoosagur Ramgoolam', 'Pa maye pelouz!', 'Entrée · Lantre'],
    weights: { bench: 2, wheelbarrow: 1.5, tortoise: 1.8, branch: 1.9, puddle: 1.6, crates: 0.6, dog: 0.8, bicycle: 1, logRow: 0.6, stall: 0.6, cones: 0.8, barrier: 1, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
  {
    uid: 'mt4', num: 4, name: 'Curepipe & Trou aux Cerfs', region: 'Curepipe', icon: '🌋', tagline: 'Misty highland town: market stalls, buses, potholes, crater lake.',
    goal: 3060, speed: [18, 24], gap: [27, 18.5], coinStar: 136, music: 'toussesali', sky: 'mist', biome: 'curepipe', chaser: 'vendor',
    peds: { kinds: ['man', 'woman_casual', 'woman_dress', 'woman_tank'], n: 1.2 },
    signs: ['CUREPIPE', 'TROU AUX CERFS', 'Place Elizabeth', 'Marché de Curepipe', 'Ala dilo!'],
    weights: { bus: 1.8, busRoof: 1.6, houseRoof: 1.2, car: 1.8, scooter: 1.5, bicycle: 1, stall: 1.2, stallRoof: 1, dholl: 1.2, roadworks: 1.3, pothole: 1.5, puddle: 1.4, dog: 0.8, goat: 0.5, bar: 1.4, oncomingBus: 0.7, oncomingCar: 0.8, row: 1, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
  {
    uid: 'mt5', num: 5, name: 'Sugarcane Fields of Flacq', region: 'Flacq · north', icon: '🌾', tagline: 'Cane roads: sugar trucks (ramp up!), tractors, cows and a mill chimney.',
    goal: 3315, speed: [19, 25], gap: [26, 18], coinStar: 150, music: 'posson_sale', sky: 'gold', biome: 'cane', chaser: 'farmer',
    peds: { kinds: ['farmer', 'worker', 'man'], animals: ['cow', 'sheep'], n: 0.7 },
    signs: ['USINE SUCRIÈRE', 'FLACQ', 'Planteur · Plantè', 'Lasam kann!', 'Belle Vue Harel'],
    weights: { caneTruck: 1.8, truckRamp: 2.2, tractor: 1.8, cow: 1.2, goat: 1, dog: 0.8, pothole: 1.5, bicycle: 1, scooter: 1.1, crates: 1, rock: 1, oncomingCar: 0.8, stall: 0.4, barrier: 0.8, busRoof: 0.8, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
  {
    uid: 'mt6', num: 6, name: 'Black River Gorges', region: 'Black River Gorges', icon: '🌳', tagline: 'Deep forest road: fallen trees, low branches, deer, wild boar, rocks.',
    goal: 3570, speed: [20, 26.5], gap: [25, 17.5], coinStar: 158, music: 'ratintin', sky: 'forest', biome: 'blackriver', chaser: 'ranger',
    peds: { kinds: ['adventurer', 'man'], animals: ['deer', 'pig'], n: 0.5 },
    signs: ['PARC NATIONAL', 'GORGES DE LA RIVIÈRE NOIRE', 'Alexandra Falls →', 'Atansyon: Sèf!', 'Pétrin Trail'],
    weights: { log: 2, logRow: 1.2, branch: 2.2, rock: 1.6, deer: 1.6, boar: 1.6, puddle: 1.8, pothole: 0.8, bicycle: 0.5, row: 0.6, scooter: 0.3, truckRamp: 0.8, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, monkey: 1.6 },
  },
  {
    uid: 'mt7', num: 7, name: 'Chamarel Seven Coloured Earth', region: 'Chamarel', icon: '🌈', tagline: 'Striped dunes and lava rocks: boulders, goats, tour buses, ramp trucks.',
    goal: 3825, speed: [21, 27.5], gap: [24, 17], coinStar: 172, music: 'tik_tike', sky: 'gold', biome: 'chamarel', chaser: 'guide',
    peds: { kinds: ['woman_tank', 'woman_casual', 'man', 'adventurer'], animals: ['sheep'], n: 0.8 },
    signs: ['TERRES DES SEPT COULEURS', 'CHAMAREL', 'Cascade de Chamarel →', 'Pa koz ek tòrti!', 'Rhumerie de Chamarel'],
    weights: { lavaRock: 2.2, rock: 1.8, branch: 1.4, log: 1, goat: 1.3, dog: 0.8, puddle: 0.8, pothole: 1.3, scooter: 1, car: 1, bus: 1, busRoof: 1, truckRamp: 1.2, deer: 0.8, tortoise: 0.7, oncomingCar: 0.9, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
  {
    uid: 'mt8', num: 8, name: 'Le Morne Brabant Lagoon', region: 'Le Morne', icon: '🏔️', tagline: 'Turquoise lagoon road beneath the Brabant: pirogues, crabs, kites, buses.',
    goal: 3952, speed: [21.5, 28.5], gap: [23, 17], coinStar: 180, music: 'reve_nou_ancetres', sky: 'tropic', biome: 'lemorne', chaser: 'fisherman',
    peds: { kinds: ['woman_tank', 'man', 'woman_casual'], animals: ['shiba'], n: 0.8 },
    signs: ['LE MORNE', 'Patrimoine Mondial UNESCO', 'Kitesurf · Lagon', 'One Eye Beach →', 'Mon Morne, Mon Lafyèrte'],
    weights: { pirogue: 1.8, crab: 1.6, log: 1.6, rock: 1.3, scooter: 1.4, bicycle: 1.1, branch: 1.2, dog: 1.1, puddle: 1.4, bus: 1, busRoof: 1.3, houseRoof: 0.8, oncomingBus: 1.1, oncomingCar: 1.0, row: 1.2, barrier: 0.9, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },
  {
    uid: 'mt9', num: 9, name: 'Mahébourg & Blue Bay', region: 'Mahébourg', icon: '🌅', tagline: 'Sunset-to-night waterfront. The hardest run: everything at once, fast.',
    goal: 4208, speed: [22, 28.5], gap: [23, 16.5], coinStar: 194, music: 'la_metisse', sky: 'sunset', skyEnd: 'night', biome: 'mahebourg', chaser: 'inspector',
    peds: { kinds: ['man', 'woman_dress', 'woman_casual'], animals: ['shiba'], n: 0.8 },
    signs: ['MAHÉBOURG', 'BLUE BAY', 'Île aux Aigrettes', 'Marché Lundi · Lindi', 'Waterfront · Bord de mer'],
    weights: { bus: 1.8, busRoof: 1.8, roofRun: 1.4, houseRoof: 1, oncomingBus: 1.0, oncomingCar: 1.0, scooter: 1.8, bicycle: 1, dholl: 1.3, stall: 0.8, pothole: 1.6, puddle: 1.4, roadworks: 1.6, pirogue: 1.3, crab: 1, dog: 1.1, caneTruck: 1.2, tractor: 0.7, row: 1.5, log: 0.8, branch: 1.2, bar: 1.8, truckRamp: 1.2, lavaRock: 0.5, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },

  {
    uid: 'mt10', num: 10, name: 'Rose Hill & Quatre Bornes', region: 'Plaines Wilhems', icon: '🛍️', tagline: 'Royal Road (A8) through two busy towns: buses, stalls, rooftops, Metro.',
    goal: 4335, speed: [23, 29.5], gap: [22, 16], coinStar: 202, music: 'li_tourner', sky: 'dusk', biome: 'rosehill', chaser: 'trader',
    peds: { kinds: ['man', 'woman_casual', 'woman_dress', 'woman_tank', 'worker'], n: 1.3 },
    signs: ['ROSE HILL', 'QUATRE BORNES', 'Arab Town', 'Metro Express', 'Marché · Bazar'],
    weights: { bus: 2, busRoof: 2, roofRun: 1.6, houseRoof: 1.4, stallRoof: 1.4, stall: 1.2, dholl: 1.4, car: 2, scooter: 1.6, oncomingBus: 1.1, oncomingCar: 1.1, roadworks: 1.4, pothole: 1.4, bar: 1.6, row: 1.3, dog: 0.8, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
  {
    uid: 'mt11', num: 11, name: 'Flic en Flac', region: 'Flic en Flac · Wolmar', icon: '🌊', tagline: 'West-coast beach road: casuarinas, pirogues, scooters, hotel buses.',
    goal: 4462, speed: [23.5, 30], gap: [21, 16], coinStar: 209, music: 'natcho_beti', sky: 'tropic', biome: 'flic', chaser: 'surfer',
    peds: { kinds: ['woman_tank', 'woman_casual', 'man', 'adventurer'], animals: ['shiba'], n: 1.0 },
    signs: ['FLIC EN FLAC', 'WOLMAR', 'Plage Publique', 'Casuarinas · Filao', 'Al naze!'],
    weights: { scooter: 2, bicycle: 1.4, pirogue: 1.8, log: 1.6, crab: 1.4, dog: 1.2, puddle: 1.4, bus: 1.2, busRoof: 1.4, houseRoof: 1, car: 1.4, oncomingCar: 1.0, oncomingBus: 0.9, branch: 1.2, row: 1, dholl: 1, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0, monkey: 0.4 },
  },
  {
    uid: 'mt12', num: 12, name: 'Belle Mare', region: 'Belle Mare · Palmar', icon: '🌅', tagline: 'Long east-coast lagoon road: hotels, cane trucks, beach debris, buses.',
    goal: 4590, speed: [24, 30.5], gap: [20.5, 15.5], coinStar: 216, music: 'sega_tioula', sky: 'gold', biome: 'bellemare', chaser: 'porter',
    peds: { kinds: ['woman_casual', 'man', 'worker', 'adventurer'], animals: ['shiba'], n: 0.9 },
    signs: ['BELLE MARE', 'PALMAR', 'Plage Publique', 'Lagon Est', 'Palmar · Poste Lafayette'],
    weights: { caneTruck: 1.6, truckRamp: 1.6, bus: 1.6, busRoof: 1.6, scooter: 1.6, car: 1.6, pirogue: 1.4, log: 1.4, crab: 1.2, puddle: 1.4, oncomingCar: 1.1, oncomingBus: 1.0, pothole: 1.3, houseRoof: 1, row: 1.2, dog: 1, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },
  {
    uid: 'mt13', num: 13, name: 'Souillac & Gris Gris', region: 'Savanne', icon: '🪨', tagline: 'Wild south coast: cliffs, spray, rocks, buses to the Gris Gris headland.',
    goal: 4718, speed: [24.5, 31], gap: [20.5, 15.5], coinStar: 220, music: 'angui_la_korde', sky: 'mist', biome: 'souillac', chaser: 'keeper',
    peds: { kinds: ['man', 'adventurer', 'farmer', 'woman_casual'], animals: ['sheep'], n: 0.7 },
    signs: ['SOUILLAC', 'GRIS GRIS', 'Rochester Falls →', 'Falaise du Sud', 'Atansyon: vag!'],
    weights: { rock: 2.2, lavaRock: 1.6, log: 1.6, branch: 1.4, bus: 1.4, busRoof: 1.4, pothole: 1.6, puddle: 1.6, oncomingCar: 1.1, oncomingBus: 1.0, scooter: 1.2, car: 1.3, goat: 1, dog: 0.8, row: 1.3, houseRoof: 0.8, bar: 1.2, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },
  {
    uid: 'mt14', num: 14, name: 'Cap Malheureux', region: 'Cap Malheureux', icon: '⛪', tagline: 'North-coast road to the red church: fishing boats, scooters, tight gaps.',
    goal: 4845, speed: [25, 31.5], gap: [20, 15], coinStar: 231, music: 'roul_matak', sky: 'tropic', biome: 'capmal', chaser: 'photographer',
    peds: { kinds: ['man', 'woman_dress', 'woman_casual', 'adventurer'], animals: ['shiba'], n: 0.8 },
    signs: ['CAP MALHEUREUX', 'Notre Dame Auxiliatrice', 'Coin de Mire →', 'LégLiz Rouz', 'Pêcheurs · Pêche'],
    weights: { pirogue: 2, crab: 1.6, scooter: 1.8, bicycle: 1.3, log: 1.4, bus: 1.4, busRoof: 1.6, roofRun: 1.2, oncomingCar: 1.2, oncomingBus: 1.1, car: 1.5, dog: 1.2, puddle: 1.3, branch: 1.2, row: 1.3, houseRoof: 1, dholl: 1, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6, coconuts: 1.1, nets: 1.0 },
  },
  {
    uid: 'mt15', num: 15, name: 'Goodlands', region: 'Goodlands', icon: '🏘️', tagline: "Kevin's hometown. Market streets, rooftops, buses — the longest, fastest run.",
    goal: 5100, speed: [25.5, 32], gap: [19.5, 14.5], coinStar: 242, music: 'posson_sale', sky: 'day', biome: 'goodlands', chaser: 'neighbour',
    peds: { kinds: ['man', 'woman_casual', 'woman_dress', 'woman_tank', 'worker', 'farmer'], animals: ['shiba', 'chicken'], n: 1.2 },
    signs: ['GOODLANDS', 'Bienvenue kot nou', 'Marché de Goodlands', 'Route Royale', 'Moris mo pei'],
    weights: { bus: 2, busRoof: 2.2, roofRun: 2, houseRoof: 1.8, stallRoof: 1.6, stall: 1.2, dholl: 1.4, car: 1.8, scooter: 1.8, oncomingBus: 1.3, oncomingCar: 1.2, roadworks: 1.4, pothole: 1.5, puddle: 1.2, bar: 1.6, row: 1.6, caneTruck: 1, truckRamp: 1.2, dog: 1, chickens: 0.8, van: 1.0, suv: 0.9, taxi: 0.9, taptap: 0.8, sameway: 1.2, laneChange: 1.0, parked: 0.6 },
  },
];


export const WORLDS = [
  { id: 'pl', name: 'Port Louis', sub: 'Streets & Metro', levels: PL },
  { id: 'mt', name: 'Moris Tour', sub: '15 levels across Mauritius', levels: MT },
];
for (const w of WORLDS) for (const l of w.levels) { l.world = w.id; l.biome = l.biome || 'portlouis'; l.stationShare = l.stationShare || 0; }
export const ALL_LEVELS = WORLDS.flatMap((w) => w.levels);
export const levelByUid = (uid) => ALL_LEVELS.find((l) => l.uid === uid);
export function resolveLevel(q) { // 'mt5' | 'pl2' | number (1-based position in ALL_LEVELS)
  if (!q) return null; q = String(q).toLowerCase();
  return levelByUid(q) || ALL_LEVELS[+q - 1] || null;
}
