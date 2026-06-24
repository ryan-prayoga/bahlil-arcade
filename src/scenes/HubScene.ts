import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, FONTS, STORAGE_KEYS } from "../config";
import { GAMES, GameEntry } from "../data/games";

export default class HubScene extends Phaser.Scene {
  private toast?: Phaser.GameObjects.Container;

  constructor() {
    super("Hub");
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");

    this.buildHeader();

    // Grid kartu 2 kolom
    const cardW = 196;
    const cardH = 184;
    const gapX = 16;
    const gapY = 18;
    const startX = (GAME_WIDTH - (cardW * 2 + gapX)) / 2 + cardW / 2;
    const startY = 322;
    GAMES.forEach((g, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      this.makeCard(
        g,
        startX + col * (cardW + gapX),
        startY + row * (cardH + gapY),
        cardW,
        cardH,
      );
    });

    this.buildFooter();
  }

  private buildHeader() {
    const cx = GAME_WIDTH / 2;
    // spanduk ribbon
    const ribbon = this.add.graphics();
    const bw = 320;
    const bh = 70;
    const x = cx - bw / 2;
    const y = 58;
    // lipatan bawah (bayangan ujung)
    ribbon.fillStyle(COLORS.merahDark, 1);
    ribbon.fillRect(x - 14, y + bh - 10, 22, 20);
    ribbon.fillRect(x + bw - 8, y + bh - 10, 22, 20);
    // body banner
    ribbon.fillStyle(COLORS.merah, 1);
    ribbon.lineStyle(4, COLORS.ink, 1);
    ribbon.beginPath();
    ribbon.moveTo(x, y);
    ribbon.lineTo(x + bw, y);
    ribbon.lineTo(x + bw, y + bh);
    ribbon.lineTo(x, y + bh);
    ribbon.closePath();
    ribbon.fillPath();
    ribbon.strokePath();
    // ujung garpu kiri-kanan
    [x - 16, x + bw + 16].forEach((ex, i) => {
      const dir = i === 0 ? 1 : -1;
      ribbon.fillStyle(COLORS.merah, 1);
      ribbon.beginPath();
      ribbon.moveTo(ex, y + 4);
      ribbon.lineTo(ex + dir * 26, y + 4);
      ribbon.lineTo(ex + dir * 26, y + bh - 4);
      ribbon.lineTo(ex, y + bh - 4);
      ribbon.lineTo(ex + dir * 14, y + bh / 2);
      ribbon.closePath();
      ribbon.fillPath();
      ribbon.lineStyle(4, COLORS.ink, 1);
      ribbon.strokePath();
    });

    this.add
      .text(cx, y + bh / 2 - 2, "BAHLIL", {
        fontFamily: FONTS.display,
        fontSize: "52px",
        color: CSS.white,
      })
      .setOrigin(0.5)
      .setShadow(0, 3, "#7a1a13", 0, false, true);

    // tag ARCADE (pill kuning)
    const tagW = 150;
    const ty = y + bh + 6;
    this.add
      .rectangle(cx, ty + 13, tagW, 26, COLORS.kuning)
      .setStrokeStyle(3, COLORS.ink);
    this.add
      .text(cx, ty + 12, "A R C A D E", {
        fontFamily: FONTS.body,
        fontSize: "16px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, ty + 44, "Mini game satir — pilih satu menu", {
        fontFamily: FONTS.body,
        fontSize: "13px",
        color: CSS.inkSoft,
        fontStyle: "700",
      })
      .setOrigin(0.5);
  }

  private makeCard(g: GameEntry, x: number, y: number, w: number, h: number) {
    const active = g.status === "active";
    const cont = this.add.container(x, y);

    // bayangan poster
    this.add
      .rectangle(x + 5, y + 6, w, h, COLORS.ink, 0.25)
      .setOrigin(0.5);

    const bg = this.add
      .rectangle(0, 0, w, h, active ? COLORS.paper : COLORS.kraft)
      .setStrokeStyle(4, COLORS.ink);
    // garis dalam (double-line poster)
    const inner = this.add
      .rectangle(0, 0, w - 14, h - 14, 0x000000, 0)
      .setStrokeStyle(1.5, COLORS.ink, active ? 0.5 : 0.3);

    const icon = this.add
      .image(0, active ? -46 : -40, g.iconKey)
      .setScale(g.iconKey.startsWith("player") ? 0.74 : 0.95);

    const title = this.add
      .text(0, active ? 18 : 26, g.title, {
        fontFamily: FONTS.display,
        fontSize: "26px",
        color: CSS.ink,
      })
      .setOrigin(0.5);

    cont.add([bg, inner, icon, title]);

    if (active) {
      const pill = this.add
        .rectangle(0, h / 2 - 30, 134, 36, COLORS.kuning)
        .setStrokeStyle(3, COLORS.ink);
      const pillTxt = this.add
        .text(0, h / 2 - 31, "MAIN  ▸", {
          fontFamily: FONTS.body,
          fontSize: "18px",
          fontStyle: "800",
          color: CSS.ink,
        })
        .setOrigin(0.5);
      cont.add([pill, pillTxt]);
      this.tweens.add({
        targets: [pill, pillTxt],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 760,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    } else {
      const tagline = this.add
        .text(0, 52, g.tagline, {
          fontFamily: FONTS.body,
          fontSize: "12px",
          color: CSS.inkSoft,
          fontStyle: "700",
          align: "center",
          wordWrap: { width: w - 30 },
        })
        .setOrigin(0.5);
      icon.setAlpha(0.5);
      title.setColor(CSS.inkSoft);
      cont.add(tagline);
      cont.add(this.makeStamp(w / 2 - 30, -h / 2 + 26));
    }

    cont.setSize(w, h);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      this.tweens.add({ targets: cont, scale: 0.96, duration: 90, yoyo: true });
      if (active && g.sceneKey) {
        this.cameras.main.fadeOut(180, 28, 21, 16);
        this.time.delayedCall(190, () => this.scene.start(g.sceneKey!));
      } else {
        this.showToast(`“${g.title}” segera tayang`);
      }
    });
    if (active) {
      bg.on("pointerover", () => bg.setFillStyle(COLORS.white));
      bg.on("pointerout", () => bg.setFillStyle(COLORS.paper));
    }
  }

  // stempel karet "SEGERA" (miring, agak pudar)
  private makeStamp(sx: number, sy: number) {
    const stamp = this.add.container(sx, sy);
    const box = this.add
      .rectangle(0, 0, 96, 34, 0x000000, 0)
      .setStrokeStyle(3, COLORS.merah);
    const box2 = this.add
      .rectangle(0, 0, 86, 26, 0x000000, 0)
      .setStrokeStyle(1.5, COLORS.merah);
    const txt = this.add
      .text(0, 0, "SEGERA", {
        fontFamily: FONTS.display,
        fontSize: "20px",
        color: CSS.merah,
      })
      .setOrigin(0.5);
    stamp.add([box, box2, txt]);
    stamp.setAngle(-11);
    stamp.setAlpha(0.85);
    return stamp;
  }

  private buildFooter() {
    const cx = GAME_WIDTH / 2;
    const high = Number(localStorage.getItem(STORAGE_KEYS.highScore) ?? "0");
    const fy = GAME_HEIGHT - 64;

    // strip struk
    const strip = this.add
      .rectangle(cx, fy, GAME_WIDTH - 40, 36, COLORS.white)
      .setStrokeStyle(2, COLORS.ink);
    void strip;
    this.add
      .text(46, fy, "REKOR · TANGKAP MBG", {
        fontFamily: FONTS.mono,
        fontSize: "12px",
        color: CSS.inkSoft,
        fontStyle: "700",
      })
      .setOrigin(0, 0.5);
    this.add
      .text(GAME_WIDTH - 46, fy, String(high).padStart(5, "0"), {
        fontFamily: FONTS.mono,
        fontSize: "18px",
        color: CSS.merahDark,
        fontStyle: "700",
      })
      .setOrigin(1, 0.5);

    this.add
      .text(cx, GAME_HEIGHT - 26, "Konten parodi · bukan tokoh asli", {
        fontFamily: FONTS.body,
        fontSize: "11px",
        color: CSS.inkSoft,
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
  }

  private showToast(msg: string) {
    this.toast?.destroy();
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 150).setDepth(40);
    const bg = this.add
      .rectangle(0, 0, Math.min(GAME_WIDTH - 60, msg.length * 11 + 40), 40, COLORS.ink)
      .setStrokeStyle(3, COLORS.kuning);
    const t = this.add
      .text(0, 0, msg, {
        fontFamily: FONTS.body,
        fontSize: "15px",
        fontStyle: "700",
        color: CSS.white,
      })
      .setOrigin(0.5);
    c.add([bg, t]);
    this.toast = c;
    c.setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 160, ease: "Back.out" });
    this.tweens.add({
      targets: c,
      alpha: 0,
      delay: 1400,
      duration: 280,
      onComplete: () => c.destroy(),
    });
  }
}
