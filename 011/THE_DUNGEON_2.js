import MenuScene from "./scenes/MenuScene.js";
import GameplayScene from "./scenes/GameplayScene.js";
import PauseScene from "./scenes/PauseScene.js";
import VictoryScene from "./scenes/VictoryScene.js"; // อย่าลืมเปลี่ยนชื่อไฟล์ให้มีตัว c ด้วยนะครับ
import LoseScene from "./scenes/LoseScene.js";

const config = {
    type: Phaser.AUTO,
    width: 1480,
    height: 900,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        MenuScene,
        GameplayScene,
        PauseScene,
        VictoryScene,
        LoseScene
    ] 
};

const game = new Phaser.Game(config);