# Bahlil Arcade 🍱

Hub mini-game web satir bertema Bahlil + MBG. Buka web → menu pilih game.
Game #1 **Tangkap MBG** sudah playable; sisanya kartu **Coming Soon**.

> Konten parodi/satir. Bukan representasi tokoh asli.

## Stack

Vite + TypeScript + Phaser 3. Mobile-first (portrait 450×800, `Scale.FIT`).

## Jalanin

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # output ke ./dist
npm run preview  # serve hasil build
```

## Struktur

```
src/
  main.ts                 # konfigurasi Phaser.Game + daftar scene
  config.ts               # konstanta (resolusi, warna, tuning gameplay)
  scenes/
    BootScene.ts          # generate tekstur placeholder (emoji) -> Hub
    HubScene.ts           # menu grid kartu game
    TangkapMBGScene.ts    # game #1
    GameOverScene.ts      # skor + quote satir + share
  data/
    games.ts              # registry kartu game (tambah game baru di sini)
    quotes.ts             # quote satir random
  ui/
    ShareCard.ts          # render kartu skor -> share (Web Share API + fallback)
public/assets/sprites/    # taruh PNG asli di sini (lihat bawah)
```

## Nambah game baru

1. Bikin scene baru di `src/scenes/`.
2. Daftar di `main.ts` (`scene: [...]`).
3. Tambah 1 entry di `src/data/games.ts` (`status: "active"`, `sceneKey`).
   Kartu otomatis muncul di hub.

## Ganti placeholder -> aset asli

Sekarang sprite di-generate dari emoji (lihat `BootScene.makeTextures`).
Buat ganti pakai PNG asli:

1. Taruh file di `public/assets/sprites/`:
   `bahlil.png`, `bahlil_panik.png`, `mbg.png`, `mbg_basi.png`, `koin.png`.
2. Di `BootScene.preload()` tambah:
   ```ts
   this.load.image("player", "assets/sprites/bahlil.png");
   this.load.image("player_panik", "assets/sprites/bahlil_panik.png");
   this.load.image("mbg", "assets/sprites/mbg.png");
   this.load.image("mbg_basi", "assets/sprites/mbg_basi.png");
   this.load.image("koin", "assets/sprites/koin.png");
   ```
3. Hapus baris generator yang sesuai di `makeTextures()`.

### Pipeline aset (foto cutout → cartoonify AI)

Foto publik Bahlil → `remove.bg` (PNG transparan) → img2img cartoonify.
Prompt AI (tempel foto, JANGAN sebut nama tokoh biar gak ditolak):

- **Karakter**: `turn this person into a cute 2D chibi cartoon game character, big head, flat vector style, clean outline, smiling, full body, batik shirt, front view, transparent background, mobile game sprite`
- **Panik**: `...same character, shocked/panic expression, sweat drops, transparent background`
- **MBG bagus**: `cute 2D game item sprite, styrofoam lunch box with rice and vegetables, steam, flat vector, clean outline, transparent background`
- **MBG basi**: `cute 2D game item sprite, spoiled rotten lunch box, green flies, sick green tint, stink lines, transparent background`
- **Background**: `2D mobile game background, Indonesian street / government office, flat cartoon style, soft colors, portrait orientation`

Tool: Gemini image / Flux / Midjourney / nano-banana.
Aset gratis tambahan: kenney.nl, game-icons.net, flaticon (atribusi).

## Deploy

Live: **https://bahlil-arcade.ryanprayoga.dev** (statis, di-serve Caddy dari
`/var/www/bahlil-arcade.ryanprayoga.dev`).

CI/CD: push ke `main` → GitHub Actions (`.github/workflows/deploy.yml`) SSH ke
VPS, `npm ci && npm run build`, lalu `rsync dist/` ke deploy dir.

Secrets repo yang dibutuhin Actions: `SERVER_HOST`, `SERVER_DEPLOY_KEY`.

Caddy block (VPS):

```caddy
bahlil-arcade.ryanprayoga.dev {
    root * /var/www/bahlil-arcade.ryanprayoga.dev
    encode gzip zstd
    file_server
    try_files {path} /index.html
}
```

> Ganti `SHARE_URL` di `src/config.ts` kalau domain berubah.
