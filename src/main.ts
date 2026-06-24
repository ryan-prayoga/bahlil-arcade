import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";
import BootScene from "./scenes/BootScene";
import HubScene from "./scenes/HubScene";
import TangkapMBGScene from "./scenes/TangkapMBGScene";
import BahlilLariScene from "./scenes/BahlilLariScene";
import GameOverScene from "./scenes/GameOverScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: COLORS.ink,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  scene: [BootScene, HubScene, TangkapMBGScene, BahlilLariScene, GameOverScene],
};

const game = new Phaser.Game(config);

// expose buat debugging (devtools console). Aman dibiarkan.
(window as unknown as { game: Phaser.Game }).game = game;
