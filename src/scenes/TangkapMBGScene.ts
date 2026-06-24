import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, FONTS, TANGKAP } from "../config";

type ItemType = "mbg" | "basi" | "koin";

export default class TangkapMBGScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private items!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private score = 0;
  private lives = TANGKAP.startLives;
  private combo = 0;
  private goodCaught = 0;
  private level = 0;
  private spawnAcc = 0;
  private playing = false;
  private pointerX: number | null = null;

  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("TangkapMBG");
  }

  create() {
    // reset state (scene bisa di-restart)
    this.score = 0;
    this.lives = TANGKAP.startLives;
    this.combo = 0;
    this.goodCaught = 0;
    this.level = 0;
    this.spawnAcc = 0;
    this.playing = false;
    this.pointerX = null;
    this.hearts = [];

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg");

    // Player
    this.player = this.physics.add.image(GAME_WIDTH / 2, TANGKAP.playerY, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setImmovable(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    // catch zone fokus di area nampan (atas sprite)
    this.player.body!.setSize(96, 46);
    (this.player.body as Phaser.Physics.Arcade.Body).setOffset(7, 62);

    this.items = this.physics.add.group();
    this.physics.add.overlap(
      this.player,
      this.items,
      this.onCatch as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.buildHud();
    this.bindInput();
    this.showCountdown();
  }

  // ---------- HUD ----------

  private buildHud() {
    // panel skor (struk) kiri-atas
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
        fontSize: "28px",
        color: CSS.merahDark,
        fontStyle: "700",
      })
      .setDepth(11);

    this.comboText = this.add
      .text(GAME_WIDTH / 2, 92, "", {
        fontFamily: FONTS.display,
        fontSize: "22px",
        color: CSS.merah,
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAngle(-6);

    this.drawHearts();

    // tombol back (pill kraft)
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
  }

  private drawHearts() {
    this.hearts.forEach((h) => h.destroy());
    this.hearts = [];
    for (let i = 0; i < this.lives; i++) {
      const h = this.add
        .image(GAME_WIDTH - 26 - i * 32, 62, "nyawa")
        .setDepth(11)
        .setScale(0.85);
      this.hearts.push(h);
    }
  }

  // ---------- Input ----------

  private bindInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.pointerX = p.worldX;
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointerX = p.worldX;
    });
  }

  private showCountdown() {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "SIAP?", {
        fontFamily: FONTS.display,
        fontSize: "72px",
        color: CSS.merah,
      })
      .setOrigin(0.5)
      .setDepth(20)
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
    if (!this.playing) return;

    // gerak player
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.pointerX !== null) {
      const target = Phaser.Math.Clamp(this.pointerX, 55, GAME_WIDTH - 55);
      this.player.x = Phaser.Math.Linear(this.player.x, target, 0.45);
      body.velocity.x = 0;
    } else if (this.cursors.left.isDown) {
      this.player.x -= (TANGKAP.playerSpeed * delta) / 1000;
    } else if (this.cursors.right.isDown) {
      this.player.x += (TANGKAP.playerSpeed * delta) / 1000;
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 55, GAME_WIDTH - 55);

    // spawn
    this.spawnAcc += delta;
    if (this.spawnAcc >= this.spawnDelay()) {
      this.spawnAcc = 0;
      this.spawnItem();
    }

    // bersihin item yang lewat bawah
    (this.items.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((it) => {
      if (it.active && it.y > GAME_HEIGHT + 40) {
        if (it.getData("type") === "mbg" && !it.getData("hit")) {
          // miss kotak bagus -> reset combo (gak ngurangi nyawa)
          this.combo = 0;
          this.updateCombo();
        }
        it.destroy();
      }
    });
  }

  // ---------- Difficulty ----------

  private fallSpeed(): number {
    return Math.min(
      TANGKAP.baseFallSpeed + this.level * TANGKAP.fallSpeedPerLevel,
      TANGKAP.maxFallSpeed,
    );
  }
  private spawnDelay(): number {
    return Math.max(
      TANGKAP.baseSpawnDelay - this.level * TANGKAP.spawnDelayPerLevel,
      TANGKAP.minSpawnDelay,
    );
  }
  private basiChance(): number {
    return Math.min(
      TANGKAP.baseBasiChance + this.level * TANGKAP.basiChancePerLevel,
      TANGKAP.maxBasiChance,
    );
  }

  // ---------- Spawn & catch ----------

  private spawnItem() {
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    let type: ItemType = "mbg";
    const r = Math.random();
    if (r < TANGKAP.koinChance) type = "koin";
    else if (r < TANGKAP.koinChance + this.basiChance()) type = "basi";

    const key = type === "mbg" ? "mbg" : type === "basi" ? "mbg_basi" : "koin";
    const it = this.items.create(x, -40, key) as Phaser.Physics.Arcade.Image;
    it.setData("type", type);
    it.setData("hit", false);
    (it.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    it.setVelocityY(this.fallSpeed());
    it.setAngularVelocity(type === "basi" ? Phaser.Math.Between(-60, 60) : 0);
  }

  private onCatch(
    _player: Phaser.GameObjects.GameObject,
    itemObj: Phaser.GameObjects.GameObject,
  ) {
    const it = itemObj as Phaser.Physics.Arcade.Image;
    if (it.getData("hit")) return;
    it.setData("hit", true);
    const type = it.getData("type") as ItemType;

    if (type === "mbg" || type === "koin") {
      const gained =
        type === "koin"
          ? TANGKAP.scorePerKoin
          : TANGKAP.scorePerMbg * this.comboMultiplier();
      this.score += gained;
      this.scoreText.setText(`${this.score}`);
      this.popText(it.x, it.y, `+${gained}`, type === "koin" ? CSS.kuning : CSS.hijau);
      this.burst(it.x, it.y);

      if (type === "mbg") {
        this.combo++;
        this.goodCaught++;
        const newLevel = Math.floor(this.goodCaught / TANGKAP.levelUpEvery);
        if (newLevel > this.level) {
          this.level = newLevel;
          this.flashLevel();
        }
      }
      this.updateCombo();
    } else {
      // basi -> keracunan
      this.combo = 0;
      this.updateCombo();
      this.lives--;
      this.drawHearts();
      this.popText(it.x, it.y, "KERACUNAN!", CSS.merah);
      this.hurtFx();
      if (this.lives <= 0) {
        it.destroy();
        this.gameOver();
        return;
      }
    }
    it.destroy();
  }

  private comboMultiplier(): number {
    return 1 + Math.floor(this.combo / 5);
  }

  private updateCombo() {
    const mult = this.comboMultiplier();
    if (this.combo >= 5) {
      this.comboText.setText(`COMBO x${mult}`);
    } else {
      this.comboText.setText("");
    }
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
      y: y - 50,
      alpha: 0,
      duration: 650,
      ease: "Cubic.out",
      onComplete: () => t.destroy(),
    });
  }

  private burst(x: number, y: number) {
    const e = this.add.particles(x, y, "spark", {
      speed: { min: 60, max: 180 },
      scale: { start: 0.7, end: 0 },
      lifespan: 380,
      quantity: 8,
      blendMode: "ADD",
    });
    this.time.delayedCall(400, () => e.destroy());
  }

  private flashLevel() {
    this.popText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "MAKIN NGEBUT!", CSS.kuning);
  }

  private hurtFx() {
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(160, 239, 71, 111);
    this.player.setTexture("player_panik");
    this.time.delayedCall(620, () => {
      if (this.lives > 0) this.player.setTexture("player");
    });
  }

  // ---------- End ----------

  private gameOver() {
    this.playing = false;
    this.player.setTexture("player_panik");
    this.cameras.main.shake(300, 0.02);
    this.time.delayedCall(450, () => {
      this.scene.start("GameOver", { score: this.score, level: this.level + 1 });
    });
  }
}
