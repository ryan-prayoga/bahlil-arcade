import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  CSS,
  FONTS,
  LARI,
  STORAGE_KEYS,
} from "../config";

// Game #2 — Bahlil Lari: endless runner 1-tombol. Lompati rintangan, sambar
// koin investasi. Makin lama makin ngebut. Sekali kena = tamat.

export default class BahlilLariScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private ground!: Phaser.GameObjects.TileSprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private clouds: Phaser.GameObjects.Image[] = [];

  private speed = LARI.baseSpeed;
  private distance = 0;
  private coinBonus = 0;
  private score = 0;
  private nextObstacleAt = 0;
  private pendingCoinAt = -1; // distance jadwal koin (di dalam gap), -1 = kosong
  private pendingGap = 0; // ukuran gap aktif, buat pilih formasi
  private playing = false;
  private paused = false;

  private scoreText!: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super("BahlilLari");
  }

  create() {
    this.speed = LARI.baseSpeed;
    this.distance = 0;
    this.coinBonus = 0;
    this.score = 0;
    this.nextObstacleAt = 480;
    this.pendingCoinAt = 260; // koin pembuka (sebelum rintangan pertama)
    this.playing = false;
    this.paused = false;
    this.clouds = [];
    this.pauseOverlay = undefined;

    this.physics.world.gravity.y = LARI.gravityY;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");

    // awan parallax
    [
      [90, 150],
      [300, 110],
      [430, 200],
    ].forEach(([x, y]) => {
      const c = this.add.image(x, y, "awan").setAlpha(0.9).setDepth(1);
      this.clouds.push(c);
    });

    // tanah
    const gh = GAME_HEIGHT - LARI.groundY;
    this.ground = this.add
      .tileSprite(0, LARI.groundY, GAME_WIDTH, gh, "ground")
      .setOrigin(0, 0)
      .setDepth(5);

    const floor = this.add.rectangle(
      GAME_WIDTH / 2,
      LARI.groundY + 40,
      GAME_WIDTH * 2,
      80,
      0x000000,
      0,
    );
    this.physics.add.existing(floor, true);

    // pemain
    this.player = this.physics.add
      .image(LARI.playerX, LARI.groundY - 60, "player")
      .setDepth(6)
      .setScale(0.66);
    this.player.body!.setSize(78, 120);
    (this.player.body as Phaser.Physics.Arcade.Body).setOffset(27, 24);
    this.player.setCollideWorldBounds(false);
    this.physics.add.collider(this.player, floor);

    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      this.hitObstacle as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      .rectangle(14, 14, 160, 56, COLORS.white, 0.92)
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

  // ---------- Input ----------

  private bindInput() {
    const kb = this.input.keyboard!;
    kb.on("keydown-SPACE", () => this.jump());
    kb.on("keydown-UP", () => this.jump());
    kb.on("keydown-ESC", () => this.togglePause());
    kb.on("keydown-P", () => this.togglePause());
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      // klik area tombol HUD (kanan-atas) jangan jadi lompat
      if (p.y < 60 && p.x > GAME_WIDTH - 130) return;
      this.jump();
    });
  }

  private jump() {
    if (!this.playing || this.paused) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.player.setVelocityY(-LARI.jumpForce);
    }
  }

  private showCountdown() {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "SIAP?", {
        fontFamily: FONTS.display,
        fontSize: "72px",
        color: CSS.merah,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setShadow(0, 4, "#1c1510", 0, false, true);
    const seq = ["3", "2", "1", "LARI!"];
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
    const dt = delta / 1000;

    this.speed = Math.min(this.speed + LARI.speedRampPerSec * dt, LARI.maxSpeed);

    // scroll tanah + awan
    this.ground.tilePositionX += this.speed * dt;
    this.clouds.forEach((c) => {
      c.x -= this.speed * 0.18 * dt;
      if (c.x < -70) {
        c.x = GAME_WIDTH + 70;
        c.y = Phaser.Math.Between(90, 220);
      }
    });

    // jarak -> skor
    this.distance += this.speed * dt;
    this.score = Math.floor(this.distance / LARI.distancePerPoint) + this.coinBonus;
    this.scoreText.setText(`${this.score}`);

    // gerak rintangan + koin (ikut kecepatan terkini)
    this.obstacles.getChildren().forEach((o) => {
      const it = o as Phaser.Physics.Arcade.Image;
      it.setVelocityX(-this.speed);
      if (it.x < -70) it.destroy();
    });
    this.coins.getChildren().forEach((o) => {
      const it = o as Phaser.Physics.Arcade.Image;
      it.setVelocityX(-this.speed);
      if (it.x < -70) it.destroy();
    });

    // spawn berdasarkan jarak (gap melebar pas makin cepat biar adil)
    const speedPad = (this.speed - LARI.baseSpeed) * 0.55;
    if (this.distance >= this.nextObstacleAt) {
      this.spawnObstacle();
      const gap = Phaser.Math.Between(LARI.gapMin, LARI.gapMax) + speedPad;
      this.nextObstacleAt = this.distance + gap;
      // jadwalkan formasi koin di dalam gap (posisi acak, gak nimpa rintangan)
      if (this.pendingCoinAt < 0 && Math.random() < 0.5) {
        this.pendingGap = gap;
        const frac = gap >= 480
          ? Phaser.Math.FloatBetween(0.28, 0.44)
          : Phaser.Math.FloatBetween(0.4, 0.66);
        this.pendingCoinAt = this.distance + gap * frac;
      }
    }
    if (this.pendingCoinAt >= 0 && this.distance >= this.pendingCoinAt) {
      this.spawnFormation(this.pendingGap);
      this.pendingCoinAt = -1;
    }

    // miring badan sesuai gerak vertikal
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    const targetAngle = grounded ? 0 : Phaser.Math.Clamp(body.velocity.y * 0.02, -16, 22);
    this.player.angle = Phaser.Math.Linear(this.player.angle, targetAngle, 0.25);
  }

  // ---------- Spawn ----------

  private spawnObstacle() {
    const key = Math.random() < 0.6 ? "rintangan" : "mbg_basi";
    const it = this.obstacles.create(
      GAME_WIDTH + 50,
      0,
      key,
    ) as Phaser.Physics.Arcade.Image;
    const body = it.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    it.setDepth(6);
    if (key === "mbg_basi") it.setScale(0.85);
    it.y = LARI.groundY - it.displayHeight / 2 + 2;
    body.setSize(it.width * 0.7, it.height * 0.8);
    it.setVelocityX(-this.speed);

    // sebagian kecil rintangan dikasih busur koin DI ATAS-nya (reward lompatan)
    if (Math.random() < 0.2) {
      this.spawnArch(GAME_WIDTH + 50, it.y - it.displayHeight / 2);
    }
  }

  // Formasi koin di dalam gap — pola & ketinggian acak biar gak monoton.
  // Koin tinggi cuma muncul di gap lebar (mendarat tetap aman); selebihnya
  // rendah/gelombang yang bisa disambar sambil lari.
  private spawnFormation(gap: number) {
    const gy = LARI.groundY;
    const sp = Phaser.Math.Between(96, 132); // jarak antar koin > lebar koin
    const baseX = GAME_WIDTH + 44;
    const r = Math.random();

    if (gap >= 520 && r < 0.3) {
      // bonus lompat: kluster koin tinggi melengkung (opsional, gap lebar)
      const n = Phaser.Math.Between(2, 3);
      const peak = gy - Phaser.Math.Between(120, 150);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const y = peak + Math.abs(t - 0.5) * 40;
        this.makeCoin(baseX + i * sp, y);
      }
      return;
    }

    // formasi rendah (run-through): kadang lurus, kadang gelombang, kadang tangga
    const n = Phaser.Math.Between(1, 4);
    const style = Math.floor(r * 3); // 0 lurus, 1 gelombang, 2 tangga
    for (let i = 0; i < n; i++) {
      let y = gy - 44;
      if (style === 1) y = gy - 52 - Math.round(Math.sin(i * 0.95) * 16);
      else if (style === 2) y = gy - 36 - i * 10;
      this.makeCoin(baseX + i * sp, Phaser.Math.Clamp(y, gy - 74, gy - 32));
    }
  }

  // Busur koin melengkung di atas rintangan (puncak setinggi apex lompat)
  private spawnArch(cx: number, topY: number) {
    const n = 4;
    const spread = Phaser.Math.Between(190, 230);
    const peakUp = Phaser.Math.Between(66, 88);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1); // 0..1
      const x = cx - spread / 2 + t * spread;
      const curve = Math.sin(t * Math.PI); // 0..1..0
      const y = Phaser.Math.Linear(topY - 12, topY - peakUp, curve);
      this.makeCoin(x, y);
    }
  }

  private makeCoin(x: number, y: number) {
    const it = this.coins.create(x, y, "koin") as Phaser.Physics.Arcade.Image;
    it.setScale(0.82); // ~54px, biar ada celah antar koin
    (it.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    it.setDepth(6);
    it.setVelocityX(-this.speed);
    this.tweens.add({ targets: it, angle: 360, duration: 900, repeat: -1 });
  }

  // ---------- Tabrakan ----------

  private collectCoin(
    _p: Phaser.GameObjects.GameObject,
    coinObj: Phaser.GameObjects.GameObject,
  ) {
    const it = coinObj as Phaser.Physics.Arcade.Image;
    if (!it.active) return;
    this.coinBonus += LARI.coinScore;
    this.popText(it.x, it.y, `+${LARI.coinScore}`, CSS.kuning);
    this.burst(it.x, it.y);
    it.destroy();
  }

  private hitObstacle() {
    if (!this.playing) return;
    this.gameOver();
  }

  // ---------- FX ----------

  private popText(x: number, y: number, msg: string, color: string) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: FONTS.body,
        fontSize: "20px",
        color,
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(15)
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

  // ---------- Jeda ----------

  private togglePause() {
    if (this.paused) this.resumeGame();
    else if (this.playing) this.pauseGame();
  }

  private pauseGame() {
    this.paused = true;
    this.playing = false;
    this.physics.pause();
    const c = this.add.container(0, 0).setDepth(40);
    c.add(
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.72).setOrigin(0),
    );
    c.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, "JEDA", {
          fontFamily: FONTS.display,
          fontSize: "72px",
          color: CSS.kuning,
        })
        .setOrigin(0.5),
    );
    c.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, "Esc / P buat lanjut", {
          fontFamily: FONTS.body,
          fontSize: "14px",
          fontStyle: "700",
          color: CSS.muted,
        })
        .setOrigin(0.5),
    );
    this.overlayButton(c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, "LANJUT", COLORS.kuning, () =>
      this.resumeGame(),
    );
    this.overlayButton(c, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, "‹ MENU", COLORS.kraft, () =>
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

  // ---------- Tamat ----------

  private gameOver() {
    this.playing = false;
    this.player.setTexture("player_panik");
    this.cameras.main.shake(300, 0.02);
    this.physics.pause();
    const level = Math.floor((this.speed - LARI.baseSpeed) / 60) + 1;
    this.time.delayedCall(500, () => {
      this.scene.start("GameOver", {
        score: this.score,
        level,
        gameTitle: "Bahlil Lari",
        sceneKey: "BahlilLari",
        highKey: STORAGE_KEYS.highScoreLari,
      });
    });
  }
}
