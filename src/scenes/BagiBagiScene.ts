import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, FONTS, STORAGE_KEYS } from "../config";
import { randomQuote } from "../data/quotes";
import { shareScore } from "../ui/ShareCard";

// Game #3 — Bagi-bagi MBG: clicker/idle. Ketuk Bahlil buat "bagi porsi",
// angka naik absurd, beli upgrade meme, income idle jalan terus + offline.

interface Upgrade {
  id: string;
  name: string;
  kind: "click" | "sec";
  value: number; // tambahan per unit
  baseCost: number;
  mult: number; // pengali harga per pembelian
}

const UPGRADES: Upgrade[] = [
  { id: "relawan", name: "Relawan SPPG", kind: "sec", value: 2, baseCost: 30, mult: 1.15 },
  { id: "sendok", name: "Sendok Sakti", kind: "click", value: 4, baseCost: 120, mult: 1.18 },
  { id: "dapur", name: "Dapur Umum", kind: "sec", value: 14, baseCost: 360, mult: 1.16 },
  { id: "truk", name: "Truk Distribusi", kind: "sec", value: 80, baseCost: 2600, mult: 1.17 },
  { id: "anggaran", name: "Anggaran Tambahan", kind: "click", value: 60, baseCost: 12000, mult: 1.2 },
  { id: "proyek", name: "Proyek Strategis", kind: "sec", value: 600, baseCost: 45000, mult: 1.18 },
];

interface SaveData {
  total: number;
  owned: Record<string, number>;
  lastSeen: number;
}

interface Row {
  upg: Upgrade;
  bg: Phaser.GameObjects.Rectangle;
  cost: Phaser.GameObjects.Text;
  ownedText: Phaser.GameObjects.Text;
}

export default class BagiBagiScene extends Phaser.Scene {
  private total = 0;
  private owned: Record<string, number> = {};
  private bahlil!: Phaser.Physics.Arcade.Image | Phaser.GameObjects.Image;
  private totalText!: Phaser.GameObjects.Text;
  private rateText!: Phaser.GameObjects.Text;
  private rows: Row[] = [];

  constructor() {
    super("BagiBagi");
  }

  create() {
    this.total = 0;
    this.owned = {};
    this.rows = [];
    this.loadSave();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");
    this.buildHud();
    this.buildCounter();
    this.buildTapZone();
    this.buildUpgrades();

    this.offlineEarnings();

    // tick income idle (10x/detik)
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const ps = this.perSec();
        if (ps > 0) {
          this.total += ps * 0.1;
          this.refresh();
        }
      },
    });
    // autosave
    this.time.addEvent({ delay: 4000, loop: true, callback: () => this.save() });
    this.events.once("shutdown", () => this.save());

    this.refresh();
  }

  // ---------- ekonomi ----------

  private perClick(): number {
    let v = 1;
    for (const u of UPGRADES)
      if (u.kind === "click") v += (this.owned[u.id] ?? 0) * u.value;
    return v;
  }
  private perSec(): number {
    let v = 0;
    for (const u of UPGRADES)
      if (u.kind === "sec") v += (this.owned[u.id] ?? 0) * u.value;
    return v;
  }
  private costOf(u: Upgrade): number {
    return Math.floor(u.baseCost * Math.pow(u.mult, this.owned[u.id] ?? 0));
  }

  // ---------- HUD ----------

  private buildHud() {
    this.add
      .text(20, 26, "BAGI-BAGI MBG", {
        fontFamily: FONTS.display,
        fontSize: "26px",
        color: CSS.ink,
      })
      .setOrigin(0, 0.5);

    const bx = GAME_WIDTH - 70;
    const back = this.add
      .rectangle(bx, 26, 96, 32, COLORS.kraft)
      .setStrokeStyle(3, COLORS.ink)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(bx, 25, "‹ MENU", {
        fontFamily: FONTS.body,
        fontSize: "14px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5);
    back.on("pointerdown", () => {
      this.save();
      this.scene.start("Hub");
    });

    const sx = bx - 66;
    const share = this.add
      .rectangle(sx, 26, 40, 32, COLORS.hijau)
      .setStrokeStyle(3, COLORS.ink)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(sx, 25, "↗", {
        fontFamily: FONTS.body,
        fontSize: "18px",
        fontStyle: "800",
        color: CSS.white,
      })
      .setOrigin(0.5);
    share.on("pointerdown", () =>
      shareScore({
        gameTitle: "Bagi-bagi MBG",
        score: Math.floor(this.total),
        highScore: Math.floor(this.total),
        quote: randomQuote(),
      }),
    );
  }

  private buildCounter() {
    this.add
      .rectangle(GAME_WIDTH / 2, 110, GAME_WIDTH - 36, 84, COLORS.white, 0.92)
      .setStrokeStyle(4, COLORS.ink);
    this.totalText = this.add
      .text(GAME_WIDTH / 2, 98, "0", {
        fontFamily: FONTS.mono,
        fontSize: "40px",
        fontStyle: "700",
        color: CSS.merahDark,
      })
      .setOrigin(0.5);
    this.rateText = this.add
      .text(GAME_WIDTH / 2, 134, "porsi dibagi · +0/dtk", {
        fontFamily: FONTS.body,
        fontSize: "14px",
        fontStyle: "700",
        color: CSS.inkSoft,
      })
      .setOrigin(0.5);
  }

  private buildTapZone() {
    const zoneTop = 168;
    const zoneH = 250;
    const zone = this.add
      .rectangle(GAME_WIDTH / 2, zoneTop + zoneH / 2, GAME_WIDTH, zoneH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.bahlil = this.add
      .image(GAME_WIDTH / 2, zoneTop + zoneH / 2, "player")
      .setScale(1.7);

    this.add
      .text(GAME_WIDTH / 2, zoneTop + zoneH - 6, "KETUK BAHLIL", {
        fontFamily: FONTS.body,
        fontSize: "13px",
        fontStyle: "800",
        color: CSS.inkSoft,
      })
      .setOrigin(0.5);

    zone.on("pointerdown", (p: Phaser.Input.Pointer) => this.tap(p));
  }

  private tap(p: Phaser.Input.Pointer) {
    const gain = this.perClick();
    this.total += gain;
    this.refresh();

    this.bahlil.setScale(1.55);
    this.tweens.add({
      targets: this.bahlil,
      scale: 1.7,
      duration: 140,
      ease: "Back.out",
    });
    this.popText(p.x, p.y - 10, `+${fmt(gain)}`);
  }

  private popText(x: number, y: number, msg: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: FONTS.body,
        fontSize: "22px",
        fontStyle: "800",
        color: CSS.kuning,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setStroke("#1c1510", 4);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 700,
      ease: "Cubic.out",
      onComplete: () => t.destroy(),
    });
  }

  // ---------- upgrade ----------

  private buildUpgrades() {
    const top = 436;
    const rowH = 58;
    this.add
      .text(24, top - 18, "UPGRADE", {
        fontFamily: FONTS.body,
        fontSize: "13px",
        fontStyle: "800",
        color: CSS.inkSoft,
      })
      .setOrigin(0, 0.5);

    UPGRADES.forEach((u, i) => {
      const y = top + i * rowH;
      const bg = this.add
        .rectangle(GAME_WIDTH / 2, y + rowH / 2 - 4, GAME_WIDTH - 28, rowH - 8, COLORS.kraft)
        .setStrokeStyle(3, COLORS.ink)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(28, y + 14, u.name, {
          fontFamily: FONTS.body,
          fontSize: "16px",
          fontStyle: "800",
          color: CSS.ink,
        })
        .setOrigin(0, 0.5);
      const eff =
        u.kind === "click" ? `+${fmt(u.value)}/ketuk` : `+${fmt(u.value)}/dtk`;
      this.add
        .text(28, y + 34, eff, {
          fontFamily: FONTS.body,
          fontSize: "12px",
          fontStyle: "700",
          color: CSS.inkSoft,
        })
        .setOrigin(0, 0.5);
      const ownedText = this.add
        .text(GAME_WIDTH - 28, y + 14, "x0", {
          fontFamily: FONTS.mono,
          fontSize: "14px",
          fontStyle: "700",
          color: CSS.ink,
        })
        .setOrigin(1, 0.5);
      const cost = this.add
        .text(GAME_WIDTH - 28, y + 34, "", {
          fontFamily: FONTS.mono,
          fontSize: "14px",
          fontStyle: "700",
          color: CSS.merahDark,
        })
        .setOrigin(1, 0.5);

      bg.on("pointerdown", () => this.buy(u));
      this.rows.push({ upg: u, bg, cost, ownedText });
    });
  }

  private buy(u: Upgrade) {
    const cost = this.costOf(u);
    if (this.total < cost) {
      this.cameras.main.shake(120, 0.004);
      return;
    }
    this.total -= cost;
    this.owned[u.id] = (this.owned[u.id] ?? 0) + 1;
    this.save();
    this.refresh();
  }

  // ---------- render ----------

  private refresh() {
    this.totalText.setText(fmt(this.total));
    this.rateText.setText(
      `porsi dibagi · +${fmt(this.perSec())}/dtk · +${fmt(this.perClick())}/ketuk`,
    );
    for (const r of this.rows) {
      const cost = this.costOf(r.upg);
      r.cost.setText(fmt(cost));
      r.ownedText.setText(`x${this.owned[r.upg.id] ?? 0}`);
      const afford = this.total >= cost;
      r.bg.setFillStyle(afford ? COLORS.kuning : COLORS.kraft);
      r.cost.setColor(afford ? CSS.hijauDark : CSS.merahDark);
    }
  }

  // ---------- persist ----------

  private save() {
    const data: SaveData = {
      total: this.total,
      owned: this.owned,
      lastSeen: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEYS.bagibagi, JSON.stringify(data));
    } catch {
      /* storage penuh/diblok */
    }
  }

  private loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.bagibagi);
      if (!raw) return;
      const d = JSON.parse(raw) as SaveData;
      this.total = d.total ?? 0;
      this.owned = d.owned ?? {};
    } catch {
      /* korup -> mulai baru */
    }
  }

  private offlineEarnings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.bagibagi);
      if (!raw) return;
      const d = JSON.parse(raw) as SaveData;
      if (!d.lastSeen) return;
      const elapsed = Math.min((Date.now() - d.lastSeen) / 1000, 8 * 3600);
      const gained = this.perSec() * elapsed;
      if (gained >= 1) {
        this.total += gained;
        this.add
          .text(GAME_WIDTH / 2, 168, `Selagi pergi: +${fmt(gained)} porsi`, {
            fontFamily: FONTS.body,
            fontSize: "13px",
            fontStyle: "800",
            color: CSS.hijauDark,
          })
          .setOrigin(0.5)
          .setDepth(25);
      }
    } catch {
      /* abaikan */
    }
  }
}

// Format angka gaya Indonesia: rb / jt / M / T / Kr
function fmt(n: number): string {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const units: [number, string][] = [
    [1e15, "Kr"],
    [1e12, "T"],
    [1e9, "M"],
    [1e6, "jt"],
    [1e3, "rb"],
  ];
  for (const [v, s] of units) {
    if (n >= v) {
      const x = n / v;
      return `${x >= 100 ? x.toFixed(0) : x.toFixed(1)} ${s}`;
    }
  }
  return String(n);
}
