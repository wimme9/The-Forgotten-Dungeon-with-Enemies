import GameplayScene from "./scenes/GameplayScene.js";
import MenuScene from "./scenes/MenuScene.js";
import PauseScene from "./scenes/PauseScene.js";
import VictoryScene from "./scenes/VictoryScene.js";

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 567,
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    // ใส่ Scene ทั้งหมดลงใน Array ตรงนี้ครับ
    scene: [ MenuScene, GameplayScene, PauseScene, VictoryScene ] 
};

const game = new Phaser.Game(config);