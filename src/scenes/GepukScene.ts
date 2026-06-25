import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, FONTS, GEPUK, STORAGE_KEYS } from "../config";

// Game #4 — Gepuk Bahlil: whack-a-mole. Bahlil nongol dari lubang, gepuk sebelum
// kabur. Bahlil emas = bonus. Warga = JANGAN digepuk (penalti). Ronde 30 detik.

type EntKind = "bahlil" | "gold" | "warga";

interface Hole {
  x: number;
  y: number;
  busy: boolean;
  ent?: Phaser.GameObjects.Image;
}

export default class GepukScene extends Phaser.Scene {
  private holes: Hole[] = [];
  private score = 0;
  private combo = 0;
  private timeLeft = GEPUK.round;
  private spawnAcc = 0;
  private playing = false;
  private paused = false;

  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private timeBar!: Phaser.GameObjects.Rectangle;
  private pauseOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super("Gepuk");
  }

  create() {
    this.holes = [];
    this.score = 0;
    this.combo = 0;
    this.timeLeft = GEPUK.round;
    this.spawnAcc = 0;
    this.playing = false;
    this.paused = false;
    this.pauseOverlay = undefined;
    this.time.paused = false;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");

    this.buildHoles();
    this.buildHud();
    this.bindInput();
    this.showCountdown();
  }

  private buildHoles() {
    const colW = GAME_WIDTH / GEPUK.cols;
    const startY = 250;
    const rowGap = 178;
    for (let r = 0; r < GEPUK.rows; r++) {
      for (let c = 0; c < GEPUK.cols; c++) {
        const x = colW * (c + 0.5);
        const y = startY + r * rowGap;
        this.add.image(x, y, "lubang_back").setDepth(4);
        this.add.image(x, y + 10, "lubang_front").setDepth(7);
        this.holes.push({ x, y, busy: false });
      }
    }
  }

  // ---------- HUD ----------

  private buildHud() {
    this.add
      .rectangle(14, 14, 132, 52, COLORS.white, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(3, COLORS.ink)
      .setDepth(10);
    this.add
      .text(26, 20, "SKOR", {
        fontFamily: FONTS.mono,
        fontSize: "11px",
        color: CSS.inkSoft,
        fontStyle: "700",
      })
      .setDepth(11);
    this.scoreText = this.add
      .text(26, 33, "0", {
        fontFamily: FONTS.mono,
        fontSize: "24px",
        color: CSS.merahDark,
        fontStyle: "700",
      })
      .setDepth(11);

    // timer
    this.timeText = this.add
      .text(GAME_WIDTH / 2, 24, "30", {
        fontFamily: FONTS.display,
        fontSize: "34px",
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(11);
    this.add
      .rectangle(GAME_WIDTH / 2, 50, 120, 8, COLORS.ink, 0.25)
      .setDepth(10);
    this.timeBar = this.add
      .rectangle(GAME_WIDTH / 2 - 60, 50, 120, 8, COLORS.hijau)
      .setOrigin(0, 0.5)
      .setDepth(11);

    this.comboText = this.add
      .text(GAME_WIDTH / 2, 78, "", {
        fontFamily: FONTS.display,
        fontSize: "20px",
        color: CSS.merah,
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAngle(-6);

    const bx = GAME_WIDTH - 60;
    const back = this.add
      .rectangle(bx, 26, 84, 30, COLORS.kraft)
      .setStrokeStyle(3, COLORS.ink)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(bx, 25, "‹ MENU", {
        fontFamily: FONTS.body,
        fontSize: "13px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(11);
    back.on("pointerdown", () => this.scene.start("Hub"));

    const px = bx - 56;
    const pauseBtn = this.add
      .rectangle(px, 26, 38, 30, COLORS.kuning)
      .setStrokeStyle(3, COLORS.ink)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(px, 24, "II", {
        fontFamily: FONTS.body,
        fontSize: "15px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(11);
    pauseBtn.on("pointerdown", () => this.togglePause());
  }

  private bindInput() {
    const kb = this.input.keyboard!;
    kb.on("keydown-ESC", () => this.togglePause());
    kb.on("keydown-P", () => this.togglePause());
    // efek palu tiap ketuk di area main
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.playing || this.paused) return;
      if (p.y < 70) return;
      this.whackFx(p.x, p.y);
    });
  }

  private showCountdown() {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "SIAP?", {
        fontFamily: FONTS.display,
        fontSize: "70px",
        color: CSS.merah,
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setShadow(0, 4, "#1c1510", 0, false, true);
    const seq = ["3", "2", "1", "GEPUK!"];
    let i = 0;
    this.time.addEvent({
      delay: 520,
      repeat: seq.length - 1,
      callback: () => {
        t.setText(seq[i]);
        t.setScale(1.4);
        this.tweens.add({ targets: t, scale: 1, duration: 300, ease: "Back.out" });
        i++;
        if (i === seq.length) {
          this.time.delayedCall(420, () => {
            t.destroy();
            this.playing = true;
          });
        }
      },
    });
  }

  // ---------- Loop ----------

  update(_time: number, delta: number) {
    if (!this.playing || this.paused) return;

    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endRound();
      return;
    }
    const secs = Math.ceil(this.timeLeft / 1000);
    this.timeText.setText(`${secs}`);
    const f = this.timeLeft / GEPUK.round;
    this.timeBar.width = 120 * f;
    this.timeBar.setFillStyle(f < 0.25 ? COLORS.merah : f < 0.5 ? COLORS.kuning : COLORS.hijau);

    this.spawnAcc += delta;
    if (this.spawnAcc >= this.interval()) {
      this.spawnAcc = 0;
      this.spawn();
    }
  }

  private elapsedFrac(): number {
    return 1 - this.timeLeft / GEPUK.round;
  }
  private interval(): number {
    return Phaser.Math.Linear(GEPUK.baseInterval, GEPUK.minInterval, this.elapsedFrac());
  }
  private upDuration(): number {
    return Phaser.Math.Linear(GEPUK.baseUp, GEPUK.minUp, this.elapsedFrac());
  }

  // ---------- Spawn ----------

  private spawn() {
    const free = this.holes.filter((h) => !h.busy);
    if (!free.length) return;
    const hole = Phaser.Utils.Array.GetRandom(free);
    hole.busy = true;

    const r = Math.random();
    let kind: EntKind = "bahlil";
    if (r < GEPUK.goldChance) kind = "gold";
    else if (r < GEPUK.goldChance + GEPUK.wargaChance) kind = "warga";

    const tex = kind === "warga" ? "warga" : "player";
    const ent = this.add
      .image(hole.x, hole.y + 6, tex)
      .setDepth(6)
      .setScale(0.001);
    if (kind === "gold") ent.setTint(0xffd23f);
    ent.setData("kind", kind);
    ent.setData("hit", false);
    ent.setInteractive({ useHandCursor: true });
    ent.on("pointerdown", () => this.hit(hole));
    hole.ent = ent;

    // nongol
    this.tweens.add({
      targets: ent,
      scale: 0.62,
      y: hole.y - 40,
      duration: 170,
      ease: "Back.out",
    });

    // sembunyi otomatis (gold lebih cepat)
    const up = this.upDuration() * (kind === "gold" ? 0.7 : 1);
    this.time.delayedCall(up + 170, () => {
      if (!ent.active || ent.getData("hit")) return;
      if (kind === "bahlil" || kind === "gold") {
        this.combo = 0;
        this.updateCombo();
      }
      this.hide(hole);
    });
  }

  private hide(hole: Hole) {
    const ent = hole.ent;
    if (!ent) {
      hole.busy = false;
      return;
    }
    this.tweens.add({
      targets: ent,
      scale: 0.001,
      y: hole.y + 6,
      duration: 140,
      ease: "Back.in",
      onComplete: () => {
        ent.destroy();
        hole.busy = false;
        hole.ent = undefined;
      },
    });
  }

  private hit(hole: Hole) {
    const ent = hole.ent;
    if (!ent || ent.getData("hit") || !this.playing || this.paused) return;
    ent.setData("hit", true);
    ent.disableInteractive();
    const kind = ent.getData("kind") as EntKind;

    if (kind === "warga") {
      this.score = Math.max(0, this.score - GEPUK.wargaPenalty);
      this.combo = 0;
      this.popText(ent.x, ent.y - 30, "JANGAN!", CSS.merah);
      this.cameras.main.shake(180, 0.01);
    } else {
      const mult = 1 + Math.floor(this.combo / 5);
      const gained = (kind === "gold" ? GEPUK.gold : GEPUK.score) * mult;
      this.score += gained;
      this.combo++;
      ent.setTexture("player_panik");
      if (kind === "gold") ent.setTint(0xffd23f);
      this.popText(ent.x, ent.y - 30, `+${gained}`, kind === "gold" ? CSS.kuning : CSS.hijau);
    }
    this.scoreText.setText(`${this.score}`);
    this.updateCombo();

    // bonk
    this.tweens.add({
      targets: ent,
      scaleX: 0.72,
      scaleY: 0.5,
      duration: 90,
      yoyo: true,
      onComplete: () => this.hide(hole),
    });
  }

  private updateCombo() {
    const mult = 1 + Math.floor(this.combo / 5);
    this.comboText.setText(this.combo >= 5 ? `COMBO x${mult}` : "");
  }

  // ---------- FX ----------

  private whackFx(x: number, y: number) {
    const p = this.add.image(x + 18, y - 8, "palu").setDepth(20).setScale(0.7).setOrigin(0.2, 0.1);
    p.setAngle(40);
    this.tweens.add({
      targets: p,
      angle: -8,
      duration: 90,
      yoyo: true,
      onComplete: () => p.destroy(),
    });
  }

  private popText(x: number, y: number, msg: string, color: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: FONTS.body,
        fontSize: "20px",
        color,
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(22)
      .setStroke("#1c1510", 4);
    this.tweens.add({
      targets: t,
      y: y - 44,
      alpha: 0,
      duration: 600,
      ease: "Cubic.out",
      onComplete: () => t.destroy(),
    });
  }

  // ---------- Jeda ----------

  private togglePause() {
    if (this.paused) this.resumeGame();
    else if (this.playing) this.pauseGame();
  }

  private pauseGame() {
    this.paused = true;
    this.playing = false;
    this.time.paused = true;
    const c = this.add.container(0, 0).setDepth(40);
    c.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.72).setOrigin(0));
    c.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, "JEDA", {
          fontFamily: FONTS.display,
          fontSize: "72px",
          color: CSS.kuning,
        })
        .setOrigin(0.5),
    );
    this.overlayButton(c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "LANJUT", COLORS.kuning, () =>
      this.resumeGame(),
    );
    this.overlayButton(c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, "‹ MENU", COLORS.kraft, () =>
      this.scene.start("Hub"),
    );
    this.pauseOverlay = c;
  }

  private resumeGame() {
    this.paused = false;
    this.pauseOverlay?.destroy();
    this.pauseOverlay = undefined;
    this.time.paused = false;
    this.playing = true;
  }

  private overlayButton(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    bg: number,
    onClick: () => void,
  ) {
    const rect = this.add
      .rectangle(x, y, 220, 52, bg)
      .setStrokeStyle(3, COLORS.ink)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(x, y - 1, label, {
        fontFamily: FONTS.body,
        fontSize: "20px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5);
    rect.on("pointerdown", onClick);
    parent.add([rect, txt]);
  }

  // ---------- Tamat ----------

  private endRound() {
    this.playing = false;
    this.time.paused = true;
    const level = Math.floor(this.score / 200) + 1;
    this.time.delayedCall(300, () => {
      this.scene.start("GameOver", {
        score: this.score,
        level,
        gameTitle: "Gepuk Bahlil",
        sceneKey: "Gepuk",
        highKey: STORAGE_KEYS.highScoreGepuk,
      });
    });
  }
}
