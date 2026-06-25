// Konstanta global game. Resolusi logis portrait; Phaser Scale.FIT auto-fit ke layar.

export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

// Identitas visual "Pop Propaganda / Warung": baliho kampanye + bungkus nasi.
// Palet hex number (Phaser) + string (CSS/teks).
export const COLORS = {
  ink: 0x1c1510, // tinta cetak hangat (near-black)
  inkSoft: 0x3a2e22,
  paper: 0xf2ead6, // newsprint cream
  white: 0xfbf7ec,
  kraft: 0xd8b06a, // bungkus nasi coklat
  kraftDark: 0xb98a44,
  kuning: 0xf7b50a, // kuning baliho
  kuningDark: 0xd49403,
  merah: 0xe23b2e, // merah spanduk
  merahDark: 0xb52a20,
  hijau: 0x16916b, // hijau gizi
  hijauDark: 0x0f6e50,
  muted: 0x8a795f,
};

export const CSS = {
  ink: "#1c1510",
  inkSoft: "#3a2e22",
  paper: "#f2ead6",
  white: "#fbf7ec",
  kraft: "#d8b06a",
  kraftDark: "#b98a44",
  kuning: "#f7b50a",
  kuningDark: "#d49403",
  merah: "#e23b2e",
  merahDark: "#b52a20",
  hijau: "#16916b",
  hijauDark: "#0f6e50",
  muted: "#8a795f",
};

// Tiga peran tipografi (lihat index.html buat link Google Fonts).
export const FONTS = {
  display: "Anton", // headline baliho, kapital padat
  body: "'Plus Jakarta Sans', system-ui, sans-serif", // UI (font bikinan Indonesia)
  mono: "'Space Mono', monospace", // angka skor (vibe struk warung)
};

// Parameter gameplay Tangkap MBG.
export const TANGKAP = {
  startLives: 3,
  baseFallSpeed: 170,
  maxFallSpeed: 560,
  fallSpeedPerLevel: 32,
  baseSpawnDelay: 900,
  minSpawnDelay: 330,
  spawnDelayPerLevel: 60,
  levelUpEvery: 12,
  baseBasiChance: 0.18,
  maxBasiChance: 0.4,
  basiChancePerLevel: 0.025,
  koinChance: 0.06,
  scorePerMbg: 10,
  scorePerKoin: 50,
  playerSpeed: 900,
  itemSize: 56,
  playerY: GAME_HEIGHT - 96,
};

// Game #2 — Bahlil Lari (endless runner)
export const LARI = {
  gravityY: 2100,
  jumpForce: 760,
  baseSpeed: 320, // px/detik scroll dunia
  maxSpeed: 760,
  speedRampPerSec: 12,
  groundY: GAME_HEIGHT - 96, // garis tanah (kaki pemain)
  playerX: 96,
  gapMin: 320, // jarak antar rintangan (px) min
  gapMax: 620,
  coinScore: 25,
  distancePerPoint: 14, // px ditempuh per 1 poin skor
};

export const STORAGE_KEYS = {
  highScore: "bahlil_arcade_tangkap_high",
  highScoreLari: "bahlil_arcade_lari_high",
  bagibagi: "bahlil_arcade_bagibagi_save",
  muted: "bahlil_arcade_muted",
};

export const SHARE_URL = "https://bahlil-arcade.ryanprayoga.dev";
