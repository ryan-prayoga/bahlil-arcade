import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, FONTS, STORAGE_KEYS } from "../config";
import { randomQuote } from "../data/quotes";
import { shareScore } from "../ui/ShareCard";

interface GOData {
  score: number;
  level: number;
}

export default class GameOverScene extends Phaser.Scene {
  private goData!: GOData;

  constructor() {
    super("GameOver");
  }

  init(data: GOData) {
    this.goData = data ?? { score: 0, level: 1 };
  }

  create() {
    const score = this.goData.score;
    const prevHigh = Number(localStorage.getItem(STORAGE_KEYS.highScore) ?? "0");
    const isNewHigh = score > prevHigh;
    const high = Math.max(score, prevHigh);
    if (isNewHigh) localStorage.setItem(STORAGE_KEYS.highScore, String(high));
    const quote = randomQuote();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.4).setOrigin(0);

    this.cameras.main.fadeIn(220, 28, 21, 16);
    const cx = GAME_WIDTH / 2;

    // judul GAME OVER (banner miring)
    const banner = this.add.container(cx, 110).setAngle(-3);
    banner.add(
      this.add.rectangle(0, 0, 320, 64, COLORS.ink).setStrokeStyle(4, COLORS.kuning),
    );
    banner.add(
      this.add
        .text(0, 0, "GAME OVER", {
          fontFamily: FONTS.display,
          fontSize: "46px",
          color: CSS.kuning,
        })
        .setOrigin(0.5),
    );

    if (isNewHigh) {
      const nh = this.add
        .text(cx, 162, "★ REKOR BARU ★", {
          fontFamily: FONTS.body,
          fontSize: "20px",
          fontStyle: "800",
          color: CSS.merah,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: nh,
        scale: 1.12,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    // panel struk skor
    const panelY = 320;
    this.add
      .rectangle(cx, panelY, GAME_WIDTH - 70, 170, COLORS.white)
      .setStrokeStyle(4, COLORS.ink);
    this.add
      .text(cx, panelY - 58, "SKOR AKHIR", {
        fontFamily: FONTS.mono,
        fontSize: "14px",
        fontStyle: "700",
        color: CSS.inkSoft,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, panelY - 16, String(score), {
        fontFamily: FONTS.mono,
        fontSize: "72px",
        fontStyle: "700",
        color: CSS.merahDark,
      })
      .setOrigin(0.5);
    // garis putus
    const dash = this.add.graphics();
    dash.lineStyle(2, COLORS.muted, 1);
    for (let x = cx - 150; x < cx + 150; x += 14) {
      dash.lineBetween(x, panelY + 26, x + 8, panelY + 26);
    }
    this.add
      .text(cx, panelY + 48, `REKOR ${high}   ·   LEVEL ${this.goData.level}`, {
        fontFamily: FONTS.mono,
        fontSize: "15px",
        fontStyle: "700",
        color: CSS.ink,
      })
      .setOrigin(0.5);

    // quote satir
    this.add
      .text(cx, panelY + 130, `“${quote}”`, {
        fontFamily: FONTS.body,
        fontSize: "18px",
        fontStyle: "700",
        color: CSS.white,
        align: "center",
        wordWrap: { width: GAME_WIDTH - 80 },
      })
      .setOrigin(0.5)
      .setShadow(0, 2, "#1c1510", 2, false, true);

    // tombol
    const btnY = GAME_HEIGHT - 224;
    this.makeButton(cx, btnY, "MAIN LAGI", COLORS.kuning, CSS.ink, () => {
      this.cameras.main.fadeOut(160, 28, 21, 16);
      this.time.delayedCall(170, () => this.scene.start("TangkapMBG"));
    });
    const share = this.makeButton(
      cx,
      btnY + 74,
      "BAGIKAN SKOR",
      COLORS.hijau,
      CSS.white,
      async () => {
        share.label.setText("MENYIAPKAN…");
        const res = await shareScore({
          gameTitle: "Tangkap MBG",
          score,
          highScore: high,
          quote,
        });
        share.label.setText(res === "shared" ? "TERBAGIKAN ✓" : "TERSIMPAN ✓");
      },
    );
    this.makeButton(cx, btnY + 148, "‹ MENU", COLORS.kraft, CSS.ink, () =>
      this.scene.start("Hub"),
    );
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    bg: number,
    textColor: string,
    onClick: () => void,
  ) {
    const w = 286;
    const h = 56;
    const cont = this.add.container(x, y);
    const shadow = this.add.rectangle(3, 4, w, h, COLORS.ink, 0.35);
    const rect = this.add.rectangle(0, 0, w, h, bg).setStrokeStyle(3, COLORS.ink);
    const txt = this.add
      .text(0, 0, label, {
        fontFamily: FONTS.body,
        fontSize: "21px",
        fontStyle: "800",
        color: textColor,
      })
      .setOrigin(0.5);
    cont.add([shadow, rect, txt]);
    rect.setInteractive({ useHandCursor: true });
    rect.on("pointerdown", () => {
      this.tweens.add({ targets: cont, scale: 0.96, duration: 80, yoyo: true });
      onClick();
    });
    rect.on("pointerover", () => rect.setFillStyle(lighten(bg)));
    rect.on("pointerout", () => rect.setFillStyle(bg));
    return { container: cont, label: txt };
  }
}

function lighten(color: number): number {
  const c = Phaser.Display.Color.IntegerToColor(color);
  c.brighten(12);
  return c.color;
}
