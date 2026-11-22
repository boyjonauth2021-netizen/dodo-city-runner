# Maps used to build the Dodo City Runner routes

Every playable level (Port Louis Streets, Metro Express, and the 15 Moris Tour places) follows an **ordered path along real, connected, named roads** taken from OpenStreetMap. Landmarks, shop signs, station names and street gantries are placed **once, in true order**, at their real distance along that path — they are not randomly repeated.

**Attribution:** Map data © OpenStreetMap contributors, licensed under the [Open Database Licence (ODbL)](https://www.openstreetmap.org/copyright).

**Source:** Official OSM map API (`https://api.openstreetmap.org/api/0.6/map`) and the Overpass API, downloaded 22 November 2026. Metro Express station order follows the OSM relation *Metro Express: Port Louis Victoria → Curepipe Central*, with Place d’Armes prepended (it sits ~320 m before Victoria). That order matches the Light Rail Fares Regulations 2022 (Immigration / Place d’Armes → Victoria → … → Curepipe Central).

Raw extracts live in `maps/<uid>/osm.json` (not shipped in the game zip), a preview in `maps/<uid>/map.png`, and the derived route in `maps/<uid>/route.json`. The same slim specs are bundled in `js/routes.js`.

Distances below are **real metres along the OSM path**. In-game the path is scaled to the level goal (about 2–3× the original run lengths). A HUD strip shows the current street and the next landmark.

## pl1 — Port Louis Streets

Caudan Waterfront to Place d'Armes, along Royal Street through Chinatown past the Central Market to the Jummah Mosque.

- **Length:** 1928 m along OSM
- **Sea / lagoon side** (looking forward along the route): both
- **Roads chained:**
  - Caudan Waterfront Road — starts at 0 m, for 347 m
  - Caudan Approach Road — starts at 348 m, for 137 m
  - Autoroute Port-Louis – Sud — starts at 485 m, for 148 m
  - Port Louis – The South Motorway — starts at 632 m, for 53 m
  - Rue John Kennedy — starts at 706 m, for 69 m
  - Farquar Street — starts at 840 m, for 37 m
  - Farquhar Street — starts at 877 m, for 57 m
  - Rue William Newton — starts at 934 m, for 46 m
  - Rue Bissoondoyal — starts at 999 m, for 106 m
  - Royal Street — starts at 1105 m, for 85 m
  - Rue William Newton — starts at 1212 m, for 101 m
  - Rue de la Corderie — starts at 1313 m, for 138 m
  - Rue Royale — starts at 1451 m, for 282 m
  - Rue La Paix — starts at 1732 m, for 196 m
- **Turns / junctions:** left 68° at 81 m (Caudan Waterfront Road), right 66° at 162 m (Caudan Waterfront Road), right 98° at 252 m (Caudan Waterfront Road), right 66° at 334 m (Caudan Waterfront Road), left 101° at 415 m (Caudan Approach Road), right 25° at 590 m (Autoroute Port-Louis – Sud), left 48° at 776 m (Rue John Kennedy), right 25° at 877 m (Farquar Street), right 150° at 980 m (Rue William Newton), left 86° at 1081 m (Rue Bissoondoyal), left 85° at 1167 m (Royal Street)
- **Landmark order:**
  - 115 m — Caudan Waterfront (quarter, right side)
  - 162 m — Blue Penny Museum (museum, right side)
  - 934 m — Postal Museum (museum, left side)
  - 1093 m — Place d'Armes (square, left side)
  - 1313 m — Central Market (marketplace, left side)
  - 1561 m — Jummah Mosque (place_of_worship, left side)
  - 1732 m — Chinatown Arch (attraction, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Signal Mountain (323 m) — right, 1.64 km, relative bearing +145°
  - Montagne des Signaux (323 m) — right, 1.85 km, relative bearing +147°
  - Le Pouce (812 m) — right, 5.02 km, relative bearing +75°
  - Pieter Both (820 m) — right, 7.08 km, relative bearing +86°
  - Montagne Ory (500 m) — right, 6.21 km, relative bearing +115°
  - Moka Range (400 m) — right, 5.44 km, relative bearing +99°

## pl2 — Metro Express Rush

Metro Express main line southbound: Place d’Armes and Port Louis Victoria to Curepipe Central, stopping at every station in official order.

- **Length:** 25560 m along OSM
- **Sea / lagoon side** (looking forward along the route): none (inland)
- **Roads chained:**
  - Metro Express (main line, southbound) — starts at 0 m, for 25560 m
- **Turns / junctions:** right 176° at 83 m (Metro Express (main line, southbound)), left 19° at 1004 m (Metro Express (main line, southbound)), right 18° at 1372 m (Metro Express (main line, southbound)), right 19° at 1478 m (Metro Express (main line, southbound)), left 27° at 9498 m (Metro Express (main line, southbound)), left 25° at 15173 m (Metro Express (main line, southbound)), left 78° at 15325 m (Metro Express (main line, southbound)), right 30° at 16425 m (Metro Express (main line, southbound)), right 30° at 16505 m (Metro Express (main line, southbound)), right 26° at 16588 m (Metro Express (main line, southbound)), right 28° at 25410 m (Metro Express (main line, southbound)), left 35° at 25543 m (Metro Express (main line, southbound))
- **Landmark order:**
  - 0 m — Place d'Armes (station, right side)
  - 462 m — Port Louis Victoria (station, right side)
  - 3643 m — St Louis (station, right side)
  - 4450 m — Coromandel (station, right side)
  - 9300 m — Barkly (station, right side)
  - 10471 m — Beau Bassin (station, right side)
  - 11622 m — Vandermeersch (station, right side)
  - 12436 m — Rose Hill Central (station, right side)
  - 14009 m — Belle Rose (station, right side)
  - 15110 m — Quatre Bornes Central (station, right side)
  - 15757 m — St. Jean (station, right side)
  - 16943 m — Trianon (station, right side)
  - 18653 m — Phoenix (station, right side)
  - 19207 m — Phoenix Mall (station, right side)
  - 19846 m — Palmerstone (station, right side)
  - 20995 m — Vacoas Central (station, right side)
  - 21886 m — Sadally (station, right side)
  - 23216 m — Floreal (station, right side)
  - 24800 m — Curepipe North (station, right side)
  - 25514 m — Curepipe Central (station, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Le Pouce (812 m) — left, 7.01 km, relative bearing -91°
  - Pieter Both (820 m) — left, 5.94 km, relative bearing -72°
  - Signal Mountain (323 m) — left, 7.13 km, relative bearing -130°
  - Corps de Garde (720 m) — right, 4.15 km, relative bearing +65°
  - Montagne Ory (500 m) — left, 3.08 km, relative bearing -96°
  - Trou aux Cerfs (605 m) — ahead, 9.8 km, relative bearing +12°

## mt1 — Caudan Waterfront

Caudan Approach and the waterfront promenade toward Place d’Armes and the harbour.

- **Length:** 1336 m along OSM
- **Sea / lagoon side** (looking forward along the route): both
- **Roads chained:**
  - Caudan Approach Road — starts at 0 m, for 43 m
  - Autoroute Port-Louis – Sud — starts at 43 m, for 131 m
  - Caudan Approach Road — starts at 175 m, for 740 m
  - Caudan Waterfront Road — starts at 920 m, for 416 m
- **Turns / junctions:** right 30° at 278 m (Caudan Approach Road), right 21° at 368 m (Caudan Approach Road), right 110° at 475 m (Caudan Approach Road), right 135° at 920 m (Caudan Waterfront Road), left 71° at 1007 m (Caudan Waterfront Road), right 169° at 1026 m (Caudan Waterfront Road)
- **Landmark order:**
  - 430 m — Centre d'Arts Caudan (poi, left side)
  - 934 m — Blue Penny Museum (museum, left side)
  - 1026 m — Caudan Taxi Stand (taxi, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Signal Mountain (323 m) — left, 1.43 km, relative bearing -112°
  - Montagne des Signaux (323 m) — left, 1.62 km, relative bearing -108°
  - Le Pouce (812 m) — behind, 5.28 km, relative bearing -172°
  - Pieter Both (820 m) — behind, 7.26 km, relative bearing -160°

## mt2 — Grand Baie Beach Road

Grand Baie Road and Route de la Salette along the public beach toward Pointe aux Canonniers.

- **Length:** 622 m along OSM
- **Sea / lagoon side** (looking forward along the route): both
- **Roads chained:**
  - Grand Baie Road — starts at 0 m, for 622 m
- **Turns / junctions:** left 56° at 200 m (Grand Baie Road)
- **Landmark order:**
  - 276 m — Grand Baie (poi, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Coin de Mire / Gunner's Quoin (156 m) — left, 9.65 km, relative bearing -108°

## mt3 — Pamplemousses Garden

Garden avenues (Pierre Poivre, Adrien D’Epinay, Stevenson, Darwin) through the SSR Botanical Garden.

- **Length:** 2389 m along OSM
- **Sea / lagoon side** (looking forward along the route): both
- **Roads chained:**
  - Avenue Pierre Poivre — starts at 0 m, for 318 m
  - Avenue Adrien D'Epinay (Escalier) — starts at 318 m, for 44 m
  - Avenue Adrien d'Épinay — starts at 362 m, for 346 m
  - Avenue Adrien D'Epinay (Escalier) — starts at 708 m, for 288 m
  - Avenue Stevenson — starts at 996 m, for 410 m
  - Avenue Charles Darwin — starts at 1406 m, for 228 m
  - Avenue Alexis Rochon — starts at 1634 m, for 310 m
  - Avenue Baker — starts at 1944 m, for 445 m
- **Turns / junctions:** right 57° at 170 m (Avenue Pierre Poivre), right 38° at 296 m (Avenue Pierre Poivre), right 135° at 384 m (Avenue Adrien d'Épinay), left 111° at 563 m (Avenue Adrien d'Épinay), right 158° at 649 m (Avenue Adrien d'Épinay), right 118° at 789 m (Avenue Adrien D'Epinay (Escalier)), left 55° at 952 m (Avenue Adrien D'Epinay (Escalier)), left 34° at 1040 m (Avenue Stevenson), left 36° at 1149 m (Avenue Stevenson), left 29° at 1315 m (Avenue Stevenson), left 165° at 1514 m (Avenue Charles Darwin), right 177° at 1634 m (Avenue Alexis Rochon)…
- **Landmark order:**
  - 1574 m — Victoria Amazonica (poi, left side)
  - 1944 m — Château de Mon Plaisir (poi, right side)
  - 2132 m — SSR Botanical Garden (attraction, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Le Pouce (812 m) — right, 11.22 km, relative bearing +78°
  - Pieter Both (820 m) — right, 13.29 km, relative bearing +73°

## mt4 — Curepipe & Trou aux Cerfs

Royal Road Curepipe past the town hall and market, then up toward the Trou aux Cerfs crater rim.

- **Length:** 1035 m along OSM
- **Sea / lagoon side** (looking forward along the route): none (inland)
- **Roads chained:**
  - Sir Charles Lees Street — starts at 0 m, for 16 m
  - Ducray Name — starts at 38 m, for 70 m
  - Footpath around the lakepoint — starts at 108 m, for 120 m
  - Jerningham Street — starts at 227 m, for 72 m
  - Place Ian Palach — starts at 299 m, for 72 m
  - Jerningham Street — starts at 371 m, for 204 m
  - Malartic Street — starts at 574 m, for 145 m
  - Royal Road Curepipe — starts at 720 m, for 70 m
  - Sir John Pope Hennessy Street — starts at 790 m, for 245 m
- **Turns / junctions:** right 22° at 108 m (Ducray Name), left 77° at 574 m (Malartic Street)
- **Landmark order:**
  - 790 m — Curepipe Market (supermarket, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Trou aux Cerfs (605 m) — left, 1.33 km, relative bearing -45°
  - Moka Range (400 m) — right, 12.03 km, relative bearing +37°
  - Montagne Ory (500 m) — right, 11.47 km, relative bearing +29°

## mt5 — Sugarcane Fields of Flacq

Flacq Bypass and Quatre Cocos / Argy roads through the east-coast cane fields.

- **Length:** 3393 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Road — starts at 0 m, for 468 m
  - Chemin de la Mare — starts at 468 m, for 830 m
  - Moka Camp de Masque Flacq Road — starts at 1298 m, for 110 m
  - Quatre Cocos Road — starts at 1408 m, for 114 m
  - Seerally Road — starts at 1523 m, for 64 m
  - Quatre Cocos Road — starts at 1586 m, for 59 m
  - Flacq Traffic Centre Road — starts at 1646 m, for 220 m
  - Ramchandur Road — starts at 1866 m, for 98 m
  - Flacq New Market Fair Road — starts at 1964 m, for 110 m
  - Chemin de la Source — starts at 2074 m, for 291 m
  - Avenue Veloutier — starts at 2365 m, for 93 m
  - Quatre Cocos Road — starts at 2458 m, for 198 m
  - Avenue de Laurier — starts at 2656 m, for 51 m
  - Avenue Bois Noir — starts at 2706 m, for 143 m
  - Quatre Cocos Road — starts at 2849 m, for 57 m
  - Avenue Flamboyant — starts at 2906 m, for 73 m
  - Avenue Latanier — starts at 2979 m, for 74 m
  - Chemin Du Poste Branch Road — starts at 3054 m, for 260 m
  - Quatre Cocos Road — starts at 3313 m, for 79 m
- **Turns / junctions:** right 100° at 89 m (Road), left 87° at 188 m (Road), right 127° at 277 m (Road), left 19° at 414 m (Road), right 21° at 550 m (Chemin de la Mare), right 100° at 1208 m (Chemin de la Mare), left 83° at 1523 m (Seerally Road), right 26° at 2566 m (Quatre Cocos Road), right 27° at 2656 m (Quatre Cocos Road), right 30° at 2979 m (Avenue Latanier)
- **Landmark order:**
  - 1361 m — Centre de Flacq (poi, right side)
  - 1942 m — Flacq Market (supermarket, left side)
  - 3391 m — Quatre Cocos (poi, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Lion Mountain (422 m) — right, 18.08 km, relative bearing +62°

## mt6 — Black River Gorges

Plaine Champagne Road through Black River Gorges National Park, past forest viewpoints.

- **Length:** 2911 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Plaine Champagne Road — starts at 0 m, for 2320 m
  - Piton de la petite riviere noire trail — starts at 2320 m, for 591 m
- **Turns / junctions:** right 46° at 116 m (Plaine Champagne Road), left 112° at 199 m (Plaine Champagne Road), right 27° at 289 m (Plaine Champagne Road), left 54° at 552 m (Plaine Champagne Road), right 125° at 636 m (Plaine Champagne Road), left 31° at 724 m (Plaine Champagne Road), right 123° at 897 m (Plaine Champagne Road), left 74° at 990 m (Plaine Champagne Road), right 20° at 1071 m (Plaine Champagne Road), left 45° at 1164 m (Plaine Champagne Road), right 79° at 1354 m (Plaine Champagne Road), left 145° at 1526 m (Plaine Champagne Road)…
- **Landmark order:**
  - 95 m — Plaine Champagne (poi, right side)
  - 2731 m — Alexandra Falls (parking, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Piton de la Petite Rivière Noire (828 m) — right, 2.14 km, relative bearing +41°

## mt7 — Chamarel Seven Coloured Earth

Baie du Cap–Chamarel–Case Noyale Road to the Seven Coloured Earth and the Chamarel waterfall.

- **Length:** 3767 m along OSM
- **Sea / lagoon side** (looking forward along the route): none (inland)
- **Roads chained:**
  - Baie du Cap Chamarel Case Noyale Road — starts at 0 m, for 3767 m
- **Turns / junctions:** left 47° at 984 m (Baie du Cap Chamarel Case Noyale Road), left 22° at 1089 m (Baie du Cap Chamarel Case Noyale Road), right 30° at 1261 m (Baie du Cap Chamarel Case Noyale Road), right 23° at 1424 m (Baie du Cap Chamarel Case Noyale Road), right 38° at 1518 m (Baie du Cap Chamarel Case Noyale Road), right 24° at 1621 m (Baie du Cap Chamarel Case Noyale Road), left 103° at 1706 m (Baie du Cap Chamarel Case Noyale Road), left 34° at 1804 m (Baie du Cap Chamarel Case Noyale Road), right 30° at 1889 m (Baie du Cap Chamarel Case Noyale Road), right 43° at 1974 m (Baie du Cap Chamarel Case Noyale Road), right 30° at 2055 m (Baie du Cap Chamarel Case Noyale Road), left 26° at 2137 m (Baie du Cap Chamarel Case Noyale Road)…
- **Landmark order:**
  - 3700 m — Chamarel village (viewpoint, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Piton de la Petite Rivière Noire (828 m) — right, 3.51 km, relative bearing +28°
  - Montagne du Rempart (545 m) — left, 14.59 km, relative bearing -94°
  - Trois Mamelles (504 m) — left, 14.05 km, relative bearing -82°
  - Le Morne Brabant (556 m) — right, 8.81 km, relative bearing +130°

## mt8 — Le Morne Brabant Lagoon

Coastal Road La Gaulette into Coastal Road Le Morne, along the lagoon toward the Brabant.

- **Length:** 2595 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Le Morne Road / Coastal Road La Gaulette / Coastal Road Le Morne — starts at 0 m, for 2595 m
- **Landmark order:**
  - 2595 m — La Gaulette (poi, left side)
  - 2595 m — Le Morne village (poi, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Le Morne Brabant (556 m) — right, 2.73 km, relative bearing +137°
  - Piton de la Petite Rivière Noire (828 m) — ahead, 7.64 km, relative bearing -18°

## mt9 — Mahébourg & Blue Bay

Route Royale into Mahébourg, then Pointe d’Esny Road toward Blue Bay and Île aux Aigrettes.

- **Length:** 1534 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Rue du Bazar — starts at 0 m, for 112 m
  - Renoir Street — starts at 112 m, for 91 m
  - Bambous Street — starts at 203 m, for 148 m
  - Rue du Bazar — starts at 351 m, for 70 m
  - Rue de la Boulangerie — starts at 421 m, for 67 m
  - Plaine Magnien-Mahebourg Road — starts at 498 m, for 244 m
  - Rue des Aigrettes — starts at 742 m, for 91 m
  - Rue la Chaux — starts at 832 m, for 68 m
  - Rue de la Colonie — starts at 900 m, for 92 m
  - Rue Labourdonnais — starts at 992 m, for 68 m
  - Rue des Aigrettes — starts at 1061 m, for 73 m
  - Rue de la Passe — starts at 1134 m, for 327 m
  - Rue des Hollandais — starts at 1464 m, for 71 m
- **Turns / junctions:** left 102° at 112 m (Rue du Bazar), left 91° at 421 m (Rue de la Boulangerie), right 115° at 545 m (Plaine Magnien-Mahebourg Road), right 69° at 742 m (Plaine Magnien-Mahebourg Road), left 93° at 832 m (Rue des Aigrettes), left 176° at 1200 m (Rue de la Passe), left 25° at 1325 m (Rue de la Passe), right 112° at 1464 m (Rue de la Passe)
- **Landmark order:**
  - 498 m — Mahébourg (poi, left side)
  - 1167 m — Waterfront (viewpoint, left side)
  - 1328 m — Mahébourg Market (marketplace, left side)
  - 1328 m — Île aux Aigrettes (food_court, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Lion Mountain (422 m) — left, 6.4 km, relative bearing -38°
  - Île aux Aigrettes (12 m) — right, 3.09 km, relative bearing +55°

## mt10 — Rose Hill & Quatre Bornes

Royal Road Rose Hill and Saint Jean Road (A8) through Rose Hill into Quatre Bornes.

- **Length:** 3491 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Vandermeersch Street — starts at 0 m, for 26 m
  - A11 — starts at 25 m, for 192 m
  - Royal Road Rose Hill — starts at 265 m, for 117 m
  - Dr Maurice Cure Street — starts at 382 m, for 26 m
  - Royal Road Rose Hill — starts at 408 m, for 91 m
  - Boundary Road — starts at 500 m, for 122 m
  - Coriolis Avenue — starts at 622 m, for 153 m
  - Remy Ollier Avenue — starts at 774 m, for 640 m
  - Avenue Paul Henri — starts at 1414 m, for 142 m
  - Remy Ollier Avenue — starts at 1556 m, for 82 m
  - Mallefille Avenue — starts at 1638 m, for 99 m
  - Avenue Paul Henri — starts at 1737 m, for 284 m
  - Sir Virgil Naz Avenue — starts at 2021 m, for 84 m
  - Adrien d'Epinay Avenue — starts at 2105 m, for 35 m
  - Victoria Avenue — starts at 2140 m, for 43 m
  - Sir Virgil Naz Avenue — starts at 2183 m, for 26 m
  - Victoria Avenue — starts at 2219 m, for 229 m
  - Hennessy Avenue — starts at 2448 m, for 51 m
  - Conte de Lisle Avenue — starts at 2500 m, for 165 m
  - Victoria Avenue — starts at 2664 m, for 151 m
  - Stanley Avenue — starts at 2815 m, for 58 m
  - Sir Guy Forget Avenue — starts at 2873 m, for 84 m
  - Farquhar Avenue — starts at 2957 m, for 96 m
  - Baisac Avenue — starts at 3053 m, for 45 m
  - Victoria Avenue — starts at 3098 m, for 60 m
  - Victoria Road — starts at 3157 m, for 127 m
  - Victoria Avenue — starts at 3285 m, for 69 m
  - Victoria Road — starts at 3354 m, for 113 m
  - Victoria Avenue — starts at 3467 m, for 24 m
- **Turns / junctions:** right 80° at 156 m (A11), left 67° at 376 m (Royal Road Rose Hill), right 91° at 958 m (Remy Ollier Avenue), left 19° at 1042 m (Remy Ollier Avenue), left 62° at 1638 m (Mallefille Avenue), right 49° at 2021 m (Sir Virgil Naz Avenue), left 21° at 2105 m (Adrien d'Epinay Avenue), left 21° at 2194 m (Sir Virgil Naz Avenue), right 20° at 2321 m (Victoria Avenue), left 102° at 3354 m (Victoria Avenue), left 90° at 3467 m (Victoria Road)
- **Landmark order:**
  - 187 m — Metro Express (poi, right side)
  - 270 m — Rose Hill Central (poi, left side)
  - 561 m — Rose Hill Market (religion, right side)
  - 3319 m — Quatre Bornes Market (marketplace, left side)
  - 3409 m — Quatre Bornes (bus_station, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Corps de Garde (720 m) — right, 2.95 km, relative bearing +69°
  - Montagne Ory (500 m) — left, 4.34 km, relative bearing -135°
  - Moka Range (400 m) — left, 5.86 km, relative bearing -126°

## mt11 — Flic en Flac

Flic en Flac Road and the west-coast Coastal Road through Wolmar.

- **Length:** 2171 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Road — starts at 0 m, for 52 m
  - Avenue du Radar — starts at 52 m, for 359 m
  - Avenue des Nénuphars — starts at 411 m, for 54 m
  - Avenue du Radar — starts at 464 m, for 41 m
  - Avenue des Hirondelles — starts at 505 m, for 26 m
  - Avenue du Radar — starts at 531 m, for 93 m
  - Avenue des Flamingos — starts at 625 m, for 76 m
  - Avenue des Cygognes — starts at 701 m, for 46 m
  - Avenue des Alouettes — starts at 747 m, for 54 m
  - Avenue des Rossignois — starts at 801 m, for 292 m
  - Avenue des Pigeons — starts at 1093 m, for 31 m
  - Avenue des Crecerelles — starts at 1123 m, for 60 m
  - Avenue des Perroquets — starts at 1184 m, for 61 m
  - Avenue Cato Vert 1 — starts at 1245 m, for 151 m
  - Avenue des Kestrels — starts at 1396 m, for 571 m
  - Avenue des Albatross — starts at 1967 m, for 204 m
- **Turns / junctions:** left 65° at 87 m (Avenue du Radar), right 105° at 197 m (Avenue du Radar), left 28° at 411 m (Avenue du Radar), left 173° at 625 m (Avenue des Flamingos), left 88° at 732 m (Avenue des Cygognes)
- **Landmark order:**
  - 0 m — Flic en Flac (attraction, right side)
  - 1093 m — Casuarinas (poi, right side)
  - 1396 m — Public Beach (guest_house, right side)
  - 1967 m — Wolmar (hotel, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Montagne du Rempart (545 m) — ahead, 5.88 km, relative bearing +18°
  - Trois Mamelles (504 m) — right, 8.6 km, relative bearing +25°
  - Le Morne Brabant (556 m) — right, 20.39 km, relative bearing +114°

## mt12 — Belle Mare

Belle Mare–Palmar–Trou d’Eau Douce coastal road along the east lagoon, with Île aux Cerfs offshore.

- **Length:** 1888 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Hibiscus Lane — starts at 0 m, for 84 m
  - Cremation Road — starts at 84 m, for 122 m
  - Kalenia avenue — starts at 206 m, for 46 m
  - Dahlia Avenue — starts at 252 m, for 60 m
  - Jasmin Avenue — starts at 323 m, for 57 m
  - Cyprus Avenue — starts at 379 m, for 36 m
  - Juggoo Road — starts at 416 m, for 72 m
  - Marigold Avenue — starts at 487 m, for 37 m
  - Tulsi Lane — starts at 524 m, for 128 m
  - Lake Road — starts at 652 m, for 95 m
  - Juggoo Road — starts at 747 m, for 95 m
  - Seda Avenue — starts at 842 m, for 116 m
  - Lake Road — starts at 959 m, for 78 m
  - Juggoo Road — starts at 1037 m, for 306 m
  - Belle Mare Palmar Link Road — starts at 1343 m, for 411 m
  - Nadair Road — starts at 1754 m, for 134 m
- **Turns / junctions:** right 56° at 206 m (Kalenia avenue), right 32° at 416 m (Cyprus Avenue), left 87° at 524 m (Tulsi Lane), right 70° at 610 m (Tulsi Lane), left 52° at 704 m (Lake Road), right 26° at 786 m (Juggoo Road), left 27° at 904 m (Seda Avenue), right 39° at 1012 m (Lake Road), right 56° at 1119 m (Juggoo Road), left 30° at 1319 m (Juggoo Road), left 25° at 1416 m (Belle Mare Palmar Link Road), right 45° at 1501 m (Belle Mare Palmar Link Road)…
- **Landmark order:**
  - 138 m — Belle Mare (yes, left side)
  - 1618 m — Palmar (poi, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Île aux Cerfs (8 m) — ahead, 8.14 km, relative bearing -13°

## mt13 — Souillac & Gris Gris

Royal Road Souillac and the coastal road out toward the Gris Gris headland.

- **Length:** 665 m along OSM
- **Sea / lagoon side** (looking forward along the route): right
- **Roads chained:**
  - Chamouny Road — starts at 0 m, for 53 m
  - Blackburn Road — starts at 53 m, for 92 m
  - Kowlessur Road — starts at 148 m, for 78 m
  - Prune Road — starts at 225 m, for 268 m
  - Chamouny Road — starts at 493 m, for 47 m
  - Ansline Road — starts at 540 m, for 125 m
- **Turns / junctions:** left 54° at 354 m (Prune Road)
- **Landmark order:**
  - 0 m — Robert Edward Hart (school, right side)
  - 424 m — Rochester Falls (poi, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Le Morne Brabant (556 m) — left, 21.58 km, relative bearing -96°

## mt14 — Cap Malheureux

Route Mon Choisy–Cap Malheureux to the red church of Notre Dame Auxiliatrice, looking out to Coin de Mire.

- **Length:** 1905 m along OSM
- **Sea / lagoon side** (looking forward along the route): left
- **Roads chained:**
  - Route Mon Choisy Cap Malheureux — starts at 0 m, for 329 m
  - Chemin du Flamant — starts at 329 m, for 414 m
  - Domarjana — starts at 744 m, for 204 m
  - Marie Louise Street — starts at 948 m, for 98 m
  - Chemin de la Fontaine — starts at 1046 m, for 99 m
  - Bala Lane — starts at 1145 m, for 140 m
  - Macumba Lane — starts at 1285 m, for 196 m
  - Allée Beau Manguier — starts at 1481 m, for 166 m
  - Route Mon Choisy Cap Malheureux — starts at 1648 m, for 258 m
- **Turns / junctions:** right 30° at 782 m (Domarjana), right 26° at 1032 m (Marie Louise Street)
- **Landmark order:**
  - 1681 m — Cap Malheureux (poi, right side)
  - 1724 m — Coin de Mire (hotel, right side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Coin de Mire / Gunner's Quoin (156 m) — left, 5.52 km, relative bearing -79°

## mt15 — Goodlands

Mapou–Goodlands Road and the Goodlands Bypass through the market town.

- **Length:** 2648 m along OSM
- **Sea / lagoon side** (looking forward along the route): none (inland)
- **Roads chained:**
  - Soobhany Street — starts at 0 m, for 584 m
  - A5 — starts at 584 m, for 335 m
  - Verger Road — starts at 919 m, for 205 m
  - Lotus Road — starts at 1124 m, for 182 m
  - Verger Road — starts at 1306 m, for 32 m
  - Keijou Road — starts at 1339 m, for 1014 m
  - Swami Dayanand Road — starts at 2352 m, for 200 m
  - Natooa Road — starts at 2553 m, for 95 m
- **Turns / junctions:** left 78° at 536 m (Soobhany Street), right 92° at 711 m (A5), right 91° at 1492 m (Keijou Road), right 40° at 1617 m (Keijou Road), left 30° at 1732 m (Keijou Road), left 30° at 2047 m (Keijou Road), left 52° at 2214 m (Keijou Road), right 100° at 2309 m (Keijou Road), left 24° at 2413 m (Swami Dayanand Road), right 85° at 2553 m (Swami Dayanand Road), left 24° at 2607 m (Natooa Road)
- **Landmark order:**
  - 648 m — Mapou (quarter, left side)
  - 2439 m — Goodlands (poi, left side)
- **Mountains / islets visible from the route (bearing relative to heading):**
  - Coin de Mire / Gunner's Quoin (156 m) — behind, 10.5 km, relative bearing +166°

## Honest limits

- OSM is incomplete in a few parks and forest roads (Black River Gorges, Chamarel trails). Where a named public road exists (Plaine Champagne Road, Baie du Cap–Chamarel–Case Noyale Road) we follow that rather than a hiking trail.
- Some landmark names are matched from OSM POIs; a handful of well-known places (for example a public beach) may only appear as a generic “beach” node and are then labelled from the curated list if they snap close to the path.
- The runner itself still plays in a straight three-lane corridor for jump / rooftop physics. Heading changes from the real path drive camera bank, backdrop rotation (so the sea and peaks swing to the correct side), junction geometry and the HUD; they are not full 90° Temple-Run corners.
- Mountain meshes are built from AWS Terrarium / Mapzen SRTM heightfields (zoom 12) for each named massif, scaled so relative elevations stay true. Pieter Both still gets a procedural summit boulder (too small for SRTM). Trou aux Cerfs keeps its crater (not recentered on a local max). Sharp peaks are a little lower in SRTM than published heights and are scaled up to the published figure.

- A few routes are weaker than the ideal 3–6-road chain: mt2 is short (~622 m) and stays on Grand Baie Road (Salette / Cannoniers did not connect in the extract); mt4 wandered onto a Curepipe footpath and only weakly reaches Trou aux Cerfs; mt8’s village landmarks snap near the end of the coastal road; mt13 is short (~665 m) and does not fully follow the Gris Gris seafront. pl1 reaches the right landmarks in order but weaves via a short motorway stub and repeats Rue William Newton; the Chinatown Arch is at the end of that stitch, after Jummah Mosque, which is not the most typical walking order up Royal Street.
- Offshore islets (Île aux Aigrettes, Coin de Mire, Île aux Cerfs) are horizon silhouettes, not roadside signs.
- Signature peaks are eased onto the visible skyline (correct side of the road, coastal ones over the lagoon) and distances are moderately compressed so they read in the 62° gameplay camera; this is not a 1:1 SRTM panorama. Far ranges are a lower-detail haze-tinted heightfield.
- In-game distance is scaled to each level’s goal (about 2.5× earlier lengths). Metro Express uses the official southbound station order; the in-game track is a compressed version of the real ~25.6 km line.
