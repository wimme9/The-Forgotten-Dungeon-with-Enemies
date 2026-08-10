import GameplayScene from "./scenes/GameplayScene.js";
import MenuScene from "./scenes/MenuScene.js";
import PauseScene from "./scenes/PauseScene.js";
import DefeatScene from './scenes/DefeatScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
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
    scene: [ MenuScene,
                GameplayScene,
                PauseScene,
                DefeatScene,
                VictoryScene ] // Registers the GameplayScene class
};

const game = new Phaser.Game(config);