import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, FONTS, ANTAR, STORAGE_KEYS } from "../config";

// Game #3 — Antar MBG: bawa truk distribusi di 3 lajur, hindari halangan,
// sambar kotak gizi. Tiap baris spawn dijamin nyisain minimal 1 lajur lolos.

type ItemKind = "obstacle" | "box";

export default class AntarMbgScene extends Phaser.Scene {
  private laneX: number[] = [];
  private truck!: Phaser.Physics.Arcade.Image;
  private lane = 1;
  private items!: Phaser.Physics.Arcade.Group;
  private marks: Phaser.GameObjects.TileSprite[] = [];

  private speed = ANTAR.baseSpeed;
  private distance = 0;
  private boxBonus = 0;
  private score = 0;
  private lives = ANTAR.startLives;
  private nextRowAt = 0;
  private invuln = false;
  private playing = false;
  private paused = false;

  private scoreText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Image[] = [];
  private pauseOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super("AntarMBG");
  }

  create() {
    const lw = GAME_WIDTH / ANTAR.lanes;
    this.laneX = Array.from({ length: ANTAR.lanes }, (_, i) => lw * (i + 0.5));
    this.lane = 1;
    this.speed = ANTAR.baseSpeed;
    this.distance = 0;
    this.boxBonus = 0;
    this.score = 0;
    this.lives = ANTAR.startLives;
    this.nextRowAt = 260;
    this.invuln = false;
    this.playing = false;
    this.paused = false;
    this.hearts = [];
    this.marks = [];
    this.pauseOverlay = undefined;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");
    // aspal jalan
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.kraftDark, 0.4);
    // marka pembatas lajur (scroll)
    for (let i = 1; i < ANTAR.lanes; i++) {
      const m = this.add
        .tileSprite(lw * i, GAME_HEIGHT / 2, 16, GAME_HEIGHT, "marka")
        .setDepth(1);
      this.marks.push(m);
    }

    this.truck = this.physics.add
      .image(this.laneX[this.lane], ANTAR.truckY, "truk")
      .setDepth(6);
    (this.truck.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.truck.body!.setSize(80, 110);

    this.items = this.physics.add.group();
    this.physics.add.overlap(
      this.truck,
      this.items,
      this.onHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.buildHud();
    this.bindInput();
    this.showCountdown();
  }

  // ---------- HUD ----------

  private buildHud() {
    this.add
      .rectangle(14, 14, 150, 56, COLORS.white, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(3, COLORS.ink)
      .setDepth(10);
    this.add
      .text(26, 22, "SKOR", {
        fontFamily: FONTS.mono,
        fontSize: "12px",
        color: CSS.inkSoft,
        fontStyle: "700",
      })
      .setDepth(11);
    this.scoreText = this.add
      .text(26, 36, "0", {
        fontFamily: FONTS.mono,
        fontSize: "26px",
        color: CSS.merahDark,
        fontStyle: "700",
      })
      .setDepth(11);

    this.drawHearts();

    const bx = GAME_WIDTH - 70;
    const back = this.add
      .rectangle(bx, 30, 96, 32, COLORS.kraft)
      .setStrokeStyle(3, COLORS.ink)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(bx, 29, "‹ MENU", {
        fontFamily: FONTS.body,
        fontSize: "14px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(11);
    back.on("pointerdown", () => this.scene.start("Hub"));

    const px = bx - 66;
    const pauseBtn = this.add
      .rectangle(px, 30, 40, 32, COLORS.kuning)
      .setStrokeStyle(3, COLORS.ink)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(px, 28, "II", {
        fontFamily: FONTS.body,
        fontSize: "16px",
        fontStyle: "800",
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(11);
    pauseBtn.on("pointerdown", () => this.togglePause());
  }

  private drawHearts() {
    this.hearts.forEach((h) => h.destroy());
    this.hearts = [];
    for (let i = 0; i < this.lives; i++) {
      this.hearts.push(
        this.add
          .image(GAME_WIDTH - 26 - i * 32, 62, "nyawa")
          .setDepth(11)
          .setScale(0.85),
      );
    }
  }

  // ---------- input ----------

  private bindInput() {
    const kb = this.input.keyboard!;
    kb.on("keydown-LEFT", () => this.move(-1));
    kb.on("keydown-A", () => this.move(-1));
    kb.on("keydown-RIGHT", () => this.move(1));
    kb.on("keydown-D", () => this.move(1));
    kb.on("keydown-ESC", () => this.togglePause());
    kb.on("keydown-P", () => this.togglePause());
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.playing || this.paused) return;
      if (p.y < 80 && p.x > GAME_WIDTH - 130) return; // area tombol HUD
      this.move(p.x < GAME_WIDTH / 2 ? -1 : 1);
    });
  }

  private move(dir: number) {
    if (!this.playing || this.paused) return;
    const target = Phaser.Math.Clamp(this.lane + dir, 0, ANTAR.lanes - 1);
    if (target === this.lane) return;
    this.lane = target;
    this.tweens.add({
      targets: this.truck,
      x: this.laneX[this.lane],
      duration: 110,
      ease: "Quad.out",
    });
    this.truck.setAngle(dir * 8);
    this.tweens.add({ targets: this.truck, angle: 0, duration: 160, delay: 60 });
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
    const seq = ["3", "2", "1", "GAS!"];
    let i = 0;
    this.time.addEvent({
      delay: 520,
      repeat: seq.length - 1,
      callback: () => {
        t.setText(seq[i]);
        t.setScale(1.4);
        this.tweens.add({ targets: t, scale: 1, duration: 300, ease: "Back.out" });
        i++;
        if (i === seq.length)
          this.time.delayedCall(420, () => {
            t.destroy();
            this.playing = true;
          });
      },
    });
  }

  // ---------- loop ----------

  update(_time: number, delta: number) {
    if (!this.playing || this.paused) return;
    const dt = delta / 1000;
    this.speed = Math.min(this.speed + ANTAR.speedRampPerSec * dt, ANTAR.maxSpeed);

    this.marks.forEach((m) => (m.tilePositionY -= this.speed * dt));

    this.distance += this.speed * dt;
    this.score = Math.floor(this.distance / ANTAR.distancePerPoint) + this.boxBonus;
    this.scoreText.setText(`${this.score}`);

    this.items.getChildren().forEach((o) => {
      const it = o as Phaser.Physics.Arcade.Image;
      it.setVelocityY(this.speed);
      if (it.y > GAME_HEIGHT + 60) it.destroy();
    });

    if (this.distance >= this.nextRowAt) {
      this.spawnRow();
      const f = (this.speed - ANTAR.baseSpeed) / (ANTAR.maxSpeed - ANTAR.baseSpeed);
      const gap = Phaser.Math.Linear(ANTAR.rowGapMax, ANTAR.rowGapMin, f);
      this.nextRowAt = this.distance + gap;
    }
  }

  // ---------- spawn (selalu sisakan lajur lolos) ----------

  private spawnRow() {
    const f = (this.speed - ANTAR.baseSpeed) / (ANTAR.maxSpeed - ANTAR.baseSpeed);
    const maxObs = Math.random() < 0.4 + f * 0.3 ? 2 : 1; // makin cepat makin sering 2
    const lanes = [0, 1, 2];
    Phaser.Utils.Array.Shuffle(lanes);
    const obsLanes = lanes.slice(0, maxObs); // <= 2 -> minimal 1 lajur bebas
    const freeLanes = lanes.slice(maxObs);

    obsLanes.forEach((ln) => {
      const tex = Math.random() < 0.55 ? "rintangan" : "mbg_basi";
      this.spawnItem(ln, tex, "obstacle");
    });
    // kadang taruh kotak gizi di lajur bebas
    if (freeLanes.length && Math.random() < 0.6) {
      this.spawnItem(freeLanes[0], "mbg", "box");
    }
  }

  private spawnItem(lane: number, tex: string, kind: ItemKind) {
    const it = this.items.create(this.laneX[lane], -50, tex) as Phaser.Physics.Arcade.Image;
    const body = it.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    it.setDepth(5);
    it.setData("kind", kind);
    it.setData("hit", false);
    if (tex === "rintangan") it.setScale(1.1);
    body.setSize(it.width * 0.7, it.height * 0.7);
    it.setVelocityY(this.speed);
  }

  // ---------- tabrakan ----------

  private onHit(
    _truck: Phaser.GameObjects.GameObject,
    itemObj: Phaser.GameObjects.GameObject,
  ) {
    const it = itemObj as Phaser.Physics.Arcade.Image;
    if (it.getData("hit")) return;
    const kind = it.getData("kind") as ItemKind;

    if (kind === "box") {
      it.setData("hit", true);
      this.boxBonus += ANTAR.scoreBox;
      this.popText(it.x, it.y, `+${ANTAR.scoreBox}`, CSS.hijau);
      this.burst(it.x, it.y);
      it.destroy();
      return;
    }
    // obstacle
    if (this.invuln) return;
    it.setData("hit", true);
    this.lives--;
    this.drawHearts();
    this.popText(this.truck.x, this.truck.y - 40, "DUAR!", CSS.merah);
    this.cameras.main.shake(220, 0.014);
    it.destroy();
    if (this.lives <= 0) {
      this.gameOver();
      return;
    }
    // kebal sebentar + kedip
    this.invuln = true;
    this.tweens.add({
      targets: this.truck,
      alpha: 0.3,
      duration: 120,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.truck.setAlpha(1);
        this.invuln = false;
      },
    });
  }

  // ---------- fx ----------

  private popText(x: number, y: number, msg: string, color: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: FONTS.body,
        fontSize: "20px",
        color,
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setStroke("#1c1510", 4);
    this.tweens.add({
      targets: t,
      y: y - 46,
      alpha: 0,
      duration: 620,
      ease: "Cubic.out",
      onComplete: () => t.destroy(),
    });
  }

  private burst(x: number, y: number) {
    const e = this.add.particles(x, y, "spark", {
      speed: { min: 60, max: 170 },
      scale: { start: 0.7, end: 0 },
      lifespan: 360,
      quantity: 7,
      blendMode: "ADD",
    });
    this.time.delayedCall(380, () => e.destroy());
  }

  // ---------- jeda ----------

  private togglePause() {
    if (this.paused) this.resumeGame();
    else if (this.playing) this.pauseGame();
  }

  private pauseGame() {
    this.paused = true;
    this.playing = false;
    this.physics.pause();
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
    this.physics.resume();
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

  // ---------- tamat ----------

  private gameOver() {
    this.playing = false;
    this.physics.pause();
    this.cameras.main.shake(300, 0.02);
    const level = Math.floor(this.score / 250) + 1;
    this.time.delayedCall(450, () => {
      this.scene.start("GameOver", {
        score: this.score,
        level,
        gameTitle: "Antar MBG",
        sceneKey: "AntarMBG",
        highKey: STORAGE_KEYS.highScoreAntar,
      });
    });
  }
}
