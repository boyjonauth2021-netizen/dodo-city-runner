// Soundtrack: instrumental sega/seggae supplied by Kevin, plus the two original bundled tracks.
// These are instrumental versions of commercial songs — confirm rights before any public release.
export const TRACKS = {
  toussesali:         { file: 'assets/music/toussesali.mp3',         title: 'Tousse Sali',          artist: 'Unknown (bundled Mauritian track)', duration: 76 },
  ratintin:           { file: 'assets/music/ratintin.mp3',           title: 'Ratintin',            artist: 'Unknown (bundled Mauritian track)', duration: 104 },
  roul_matak:         { file: 'assets/music/roul-matak.mp3',         title: 'Roul Matak',          artist: "Bigg Frankii ft. Jor'Dan", duration: 161 },
  sega_tioula:        { file: 'assets/music/sega-tioula.mp3',        title: 'Sega Tioula',         artist: 'Bigg Frankii ft. Baron & DJ DarkSoul', duration: 197 },
  reve_nou_ancetres:  { file: 'assets/music/reve-nou-ancetres.mp3',  title: 'Rêve Nou Ancêtres',   artist: 'Cassiya', duration: 315 },
  li_tourner:         { file: 'assets/music/li-tourner.mp3',         title: 'Li Tourner',          artist: 'Dj Assad ft. Alain Ramanisum & Willy William', duration: 228 },
  angui_la_korde:     { file: 'assets/music/angui-la-korde.mp3',     title: 'Angui La Kordé',      artist: 'Médérice & Clarel Armel', duration: 306 },
  la_metisse:         { file: 'assets/music/la-metisse.mp3',         title: 'La Métisse',          artist: 'Zulu ft. Mario Ramsamy', duration: 239 },
  posson_sale:        { file: 'assets/music/posson-sale.mp3',        title: 'Posson Salé',         artist: 'Sylvio Louise', duration: 257 },
  tik_tike:           { file: 'assets/music/tik-tike.mp3',           title: 'Tik Tiké',            artist: 'Laura Beg', duration: 245 },
  natcho_beti:        { file: 'assets/music/natcho-beti.mp3',        title: 'Natcho Beti (instrumental)', artist: 'Unknown', duration: 311 },
};
// 11 songs across menu + 17 levels (18 slots). No two consecutive slots share a song; 7 tracks repeat once, evenly spaced.
// Mood: Sega Tioula → Grand Baie; Rêve Nou Ancêtres → Le Morne; Natcho Beti → Flic en Flac; Tousse Sali → Curepipe; Roul Matak also Cap Malheureux.
export const SONG_OF = {
  menu: 'toussesali',
  complete: 'ratintin',
  pl1: 'la_metisse',
  pl2: 'li_tourner',
  mt1: 'roul_matak',
  mt2: 'sega_tioula',
  mt3: 'angui_la_korde',
  mt4: 'toussesali',
  mt5: 'posson_sale',
  mt6: 'ratintin',
  mt7: 'tik_tike',
  mt8: 'reve_nou_ancetres',
  mt9: 'la_metisse',
  mt10: 'li_tourner',
  mt11: 'natcho_beti',
  mt12: 'sega_tioula',
  mt13: 'angui_la_korde',
  mt14: 'roul_matak',
  mt15: 'posson_sale',
};
export const songOf = (uid) => SONG_OF[uid] || 'toussesali';
