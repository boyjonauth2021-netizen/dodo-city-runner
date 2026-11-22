# Dodo City Runner — Port Louis

A 3D endless runner set in Mauritius. You are a **dodo** running through Port Louis streets and metro stations, dodging
barriers, buses, cars and metro trains while a **guard (chef)** chases you. Static web game (three.js, ES modules), runs fully offline.

## Run it

The game loads models and audio, so it must be served over HTTP (opening `index.html` with a double-click will not work).

```bash
cd DodoCityRunner
python3 -m http.server 8080        # or: ./run.sh   (macOS/Linux)   |   run.bat (Windows)
# then open  http://localhost:8080
```
(`npx serve .` works too.) Any modern desktop or mobile browser; best in Chrome/Edge/Safari. Audio starts on your first click/keypress.

## Controls
| Action | Keyboard | Touch |
|---|---|---|
| Change lane | ← → or A / D | swipe left / right |
| Jump | ↑ / W / Space | swipe up |
| Slide (under high bars) / fast-fall in air | ↓ / S | swipe down |
| Pause / resume | P or Esc | ❚❚ button |
| Mute | M | 🔊 button (volume sliders under SOUND) |

## The 2 levels
| # | Name | Goal | Speed | What's in it |
|---|---|---|---|---|
| 1 | **Port Louis Streets** (easy) | 1100 m | 15 → 20.5 | Street with shops, palms, Port Louis signs; low barriers, traffic cones, "LOW BRIDGE" bars, cars, a few buses, rare ramp + metro train, short station segments. Wide gaps between obstacles. |
| 2 | **Metro Express Rush** (faster, denser, dusk) | 1900 m | 20 → 27.5 | Mostly metro stations (platforms, pillars, rails, canopy). Many buses and trains in your lanes, ramps to run on **train tops**, **oncoming metros / buses / cars** with horns, closer obstacle spacing, full-width rows. |

Reach the distance goal to finish a level. Stars: ★ finish · ★ collect enough coins (55 / 110) · ★ finish with no stumbles.
Beating level 1 unlocks level 2 (progress, best scores and stars are saved in `localStorage`; sound settings too).

### Chaser rules
* Low barrier / cones / high bar / car = **stumble** (you slow down, the guard closes in right behind you).
* A **second stumble within 14 s** = the guard catches you → game over. If you stay clean for 14 s he falls back and the next stumble counts as a first one again.
* Running head-on into a **bus, train or ramp-less train side** = hard crash → game over. Bumping the side of a vehicle while changing lane only counts as a stumble and bounces you back.
* Ramps (hazard-striped wedges) let you run up onto a train roof for coins; jumping alone cannot reach train tops.

## Features
* Dodo = the rigged BlueMesh GLB (`assets/models/dodo-extinct-bird.glb`, 21 bones). Its single idle clip (breathing / beak / neck sway) is sampled by hand as a base layer; the two foot bones, spine and neck are then driven procedurally every frame for a real run cycle (alternating stance/swing steps, lift, forward lean, head bob + waddle roll), a jump tuck (feet pulled up) and a slide crouch (low pitch, feet trailing, squash). Squash/stretch on landing is kept. Guard = animated Quaternius chef (`Run` clip), follows the dodo's exact path (so he also climbs trains and dodges buses).
* 3 lanes, endlessly recycled 40 m chunks (street / metro-station themes), generated buses & metro trains, Quaternius cars, street lights, palms, shop signs, gantry signs, Le Pouce / Pieter Both backdrop, shadows, fog, day and dusk skies.
* Coins with combo pitch, coin arcs over obstacles, score, level progress bar, guard-proximity meter.
* Title screen (with live attract-mode demo), level select with locks/stars, pause, game over, level complete, countdown, HUD, volume + mute.

## Audio
* **Music** (looping, one track per level, muffled when paused): the full soundtrack is in `assets/music/` and listed in the Moris Tour / v3 section below. The two original bundled tracks (`Tousse Sali`, `Ratintin`) remain; the rest are instrumental versions of commercial sega/seggae. **Confirm rights before any public release.**
* **Sound effects** — jump, land, slide, lane switch, coin (rising combo), stumble + guard whistle, crash, caught, game over, level complete, countdown, UI click: synthesized live with WebAudio (no audio files, no licence issues).
* **City ambience** — synthesized: traffic bed, distant car horns, bus air-brakes, distant sirens, metro-station hum/drone and station chimes (fades in inside stations), pass-by whooshes. **Positional vehicle audio** (WebAudio HRTF panners at the vehicle position): trains rumble + clack + horn, buses and cars have engine hum; oncoming ones honk as they approach (the 4 nearest vehicles get voices).
* Audio unlocks on the first user gesture; master / music / effects sliders + mute (saved).

## Credits & licences
* **Dodo model** — "Dodo [ Extinct Bird ]" by **BlueMesh** on Sketchfab, licensed **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/; source https://sketchfab.com/3d-models/dodo-extinct-bird-68f873e9f9144fc4b99a8f7475bf336d). File: `assets/models/dodo-extinct-bird.glb`, unmodified except at runtime: the broken exported eye mesh is hidden and replaced by two simple eyes, and bones are posed by code. Credit is shown in-game (title + Credits). (The earlier Horniman Museum scan, CC BY-NC-ND, is no longer used by the game.)
* **Chef (`Chef_Male.glb`), cars (`NormalCar1/2`, `SUV`, `Taxi`, `Cop`), traffic cone** — Quaternius, CC0 1.0 (see `assets/models/city/QUATERNIUS_LICENSE.txt`). Copied from `/workspace/GamesMu/assets/glb/` (cars from the Quaternius cars pack).
* **three.js r170** — MIT (`vendor/three/LICENSE`). Buses, metro trains, buildings, textures (canvas-generated) and all SFX are original/generated.
* Music — see Audio above.

## Project layout
```
index.html  css/style.css
js/config.js   level definitions (LEVELS_ENABLED = 2), physics numbers
js/game.js     game loop, player, chaser, input, spawner, HUD/menus, bot
js/world.js    asset loading, obstacles, city chunks, backdrop
js/textures.js canvas-generated textures (asphalt, rails, facades, signs, buses, trains)
js/audio.js    music, WebAudio SFX, ambience, positional vehicle voices
assets/models  dodo (dodo-extinct-bird.glb) + chef + cars + cone      assets/audio  two music tracks
vendor/three   three.js + GLTFLoader/SkeletonUtils/BufferGeometryUtils (offline)
tools/         Playwright test + screenshot scripts   screenshots/
```
Debug URL flags: `?bot=1` (AI plays), `?god=1` (crashes don't kill), `?autoplay=2` (jump straight into level 2), `?unlock=2`.
Tests: `npm i` (installs three + playwright) then serve the folder on port 8123 and run `node tools/test.mjs` / `node tools/test2.mjs` (they use `/usr/bin/google-chrome`).

## Known limitations
* The dodo's only authored clip is an idle loop and each leg is a single bone (no knee), so the run/jump/slide are procedural: legs are stretched/swung rather than bent, and the wings are baked into the body (they can't flap).
* The real-time test was done in a software-rendered headless browser; target is 60 fps on a normal GPU (≈340 draw calls). Low-end phones may want a smaller window.
* Level 2 is hard by design; the bundled test bot clears level 1 every time and level 2 most of the time.
* Music licence is undocumented (see above). Audio could only be verified programmatically (signal present, mute silences it), not by ear.

## Moris Tour update
- **New world "Moris Tour"**: 9 levels in real Mauritian places (Caudan, Grand Baie, Pamplemousses, Curepipe/Trou aux Cerfs, Flacq cane fields, Black River Gorges, Chamarel, Le Morne, Mahébourg/Blue Bay sunset→night), alongside the 2 Port Louis levels (Metro Express re-enabled). Level select has world tabs.
- **New obstacles**: scooters, bicycles, dholl puri/gato piment carts, market stalls, fruit crates, sugarcane trucks/trailer ramps, tractors, potholes, puddles (slow you down), roadworks, fallen palm logs, pirogues, low branches (slide), rocks, lava rock, benches, wheelbarrows, tortoises, crabs, dogs, chickens, goats, cows, deer, boars. Each level has its own weights.
- **Characters**: ambient pedestrians/animals, one chaser per level (police, tourist, gardener, vendor, farmer, ranger, guide, fisherman, inspector), and a CHARACTER screen (dodo + 3 colour variants, shiba, hen, deer, boar; saved in localStorage).
- **Debug flags**: `?level=mt5` (or `pl2`, or 1-based number), `?bot=1`, `?god=1`, `?unlock=N`, `?char=shiba`.
- **Save**: key `dodoCityRunner.v2`; the v1 save is migrated automatically.
- **Extra credits**: Quaternius (CC0) people/animals/props; "Male Officer" by J-Toastie (CC BY 3.0); "Cartoony Purple Motorcycle" by AliceCassie (CC0); "Fruit Crate" by BlenderVoyage (CC0); dodo by BlueMesh (CC BY 4.0).

## 15-level Moris Tour (v3)
The Moris Tour is now **15 real places** (mt1–mt15), each rebuilt from an OpenStreetMap extract of that location. See **maps/README.md** for the chosen road, landmark order, water side and ODbL attribution. The in-game credits also credit OSM.

New places: Rose Hill & Quatre Bornes, Flic en Flac, Belle Mare, Souillac & Gris Gris, Cap Malheureux, and **Goodlands**.

**Rooftops:** you can jump or ramp onto buses, cars, cane trucks, stalls, houses and trains — including moving ones, which you ride. Coins sit on the roofs. A head-on hit with the front or side of a tall vehicle is still a crash; landing on top is safe. Touch-screen buttons are shown on phones (swipe still works).

**Music:** each level has a looping track (see `js/music.js` for the assignment). Fade-in/out between the menu and levels; mute is respected. Tracks live in `assets/music/` at 48 kbps:

| Key | Title | Artist |
|---|---|---|
| toussesali | Tousse Sali | Unknown (bundled with the project) |
| ratintin | Ratintin | Unknown (bundled with the project) |
| roul_matak | Roul Matak | Bigg Frankii ft. Jor'Dan |
| sega_tioula | Sega Tioula | Bigg Frankii ft. Baron & DJ DarkSoul |
| reve_nou_ancetres | Rêve Nou Ancêtres | Cassiya |
| li_tourner | Li Tourner | Dj Assad ft. Alain Ramanisum & Willy William |
| angui_la_korde | Angui La Kordé | Médérice & Clarel Armel |
| la_metisse | La Métisse | Zulu ft. Mario Ramsamy |
| posson_sale | Posson Salé | Sylvio Louise |
| tik_tike | Tik Tiké | Laura Beg |
| natcho_beti | Natcho Beti (instrumental) | Unknown |

The previously unidentified “bonus” file was a lower-bitrate copy of *Natcho Beti* and has been removed. These last nine (including *Natcho Beti (instrumental)*, artist unknown) are **instrumental versions of commercial Mauritian sega/seggae songs**. **Kevin must have the rights before any public release** (or replace the files). They are provided for private use in this project only. Assignment: menu and Curepipe *Tousse Sali*; Grand Baie *Sega Tioula*; Le Morne *Rêve Nou Ancêtres*; Flic en Flac *Natcho Beti*; Cap Malheureux *Roul Matak*. 11 songs cover 18 slots (menu + 17 levels); 7 tracks repeat once, evenly spaced, and no two consecutive slots share a song.

**Debug:** `?level=mt15` (or `pl2`, or a 1-based index), `?bot=1`, `?god=1`, `?unlock=15`, `?char=shiba`.


## v4 — real routes, mountains, power-ups, lab intro

Seventeen levels now follow an **ordered polyline of real, connected named roads** (or the official Metro Express station list for pl2). Landmarks, shop signs, station names and street gantries appear **once, in true order**, at their real distance along that path. A HUD strip shows the current street and the next landmark. Camera bank and backdrop yaw hint at real turns; the track itself stays a 3-lane corridor (not full 90° Temple-Run corners). See **maps/README.md** for the roads, landmark distances, mountains and honest limits of each route.

**Mountains & sea.** Generic backdrop hills are replaced with recognisable Mauritian silhouettes (Le Pouce, Pieter Both, Signal Mountain, Lion Mountain, Le Morne, Trois Mamelles, Trou aux Cerfs, Coin de Mire, Île aux Cerfs, Île aux Aigrettes, and others) placed on the correct bearing from each route. Named massifs are real SRTM heightfield meshes (AWS Terrarium / Mapzen tiles, zoom 12) with slope-tinted vertex colours, basalt on steep faces, and atmospheric haze; relative heights are preserved, distances compressed so they read on the gameplay skyline. Coastal levels use a procedural water shader (waves, fresnel, sun glint, turquoise lagoon to deep blue, white reef surf) plus beach sand and bobbing pirogues, catamarans, sailboats and fishing boats.

**Longer levels.** Goals are about 2.5× the earlier lengths and still ramp from pl1 (~2800 m) to mt15 (5100 m), with Metro Express the long exception (~4845 m of in-game track scaled from the real 25.6 km line).

**Traffic & obstacles.** Moving cars, 4×4s, vans, taxis, tap-taps, lorries, scooters and buses come toward you and some travel the same way more slowly; some change lanes with indicator lights. Rooftop running still works, including on moving vehicles. Place-specific static hazards include coconut piles, fishing nets, cane carts, market crates, roadworks, parked cars, dogs, goats, monkeys (Black River Gorges) and deer (Chamarel).

**Power-up coins** (glowing, rarer than gold), each with a HUD timer and a synth sting: Fly (~8 s, flaps above traffic and a coin trail, then lands), Super Jump (~10 s), Speed Boost (faster + invulnerable, ~6 s), Magnet (~10 s), Shield (absorbs one hit).

**Lab-escape intro.** An 8-second in-engine cutscene plays once before Port Louis Streets (skippable with a tap or Space / Esc / Enter). Replay it from the title-screen **LAB INTRO** button. `?intro=1` forces it; `?intro=0` skips it. Bot and screenshot runs skip it unless `intro=1`.

**Debug flags:** `?level=pl1` / `mt8`, `?bot=1`, `?god=1`, `?shot=1`, `?unlock=15`, `?intro=1`, `?intro=0`, `?char=shiba`.

## v4.1 — mountain polish, brighter intro, fairer traffic

Heightfield mountains replace the v4 extruded profiles. The lab intro is relit (cool cyan practicals, glowing monitors, a lit pod, a red alarm sweep that does not crush the room, sparks/shards, a bright doorway). Oncoming vehicles show headlights and horn earlier, with enough reaction distance; patterns never seal all three lanes without a jump, slide or roof; density ramps from gentle early levels to hard-but-fair late ones. The gameplay camera is still the original behind-the-chaser framing; it only pulls back when the dodo is flying or on a high rooftop so the chef does not become the subject.
