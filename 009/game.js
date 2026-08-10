import GameplayScene from "./scene/GameplayScene.js";
import MenuScene from "./scene/MenuScene.js";
import PauseScene from "./scene/PauseScene.js";
import VictoryScene from "./scene/VictoryScene.js";
import LoseScene from "./scene/LoseScene.js";
import InfoScene from "./scene/InfoScene.js";
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [
        MenuScene,
        GameplayScene,
        PauseScene,
        VictoryScene,
        LoseScene,
        InfoScene
    ]
};

const game = new Phaser.Game(config);
