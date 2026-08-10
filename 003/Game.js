import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';
import GameplayScene from "./scenes/GameplayScene.js";
import MenuScene from './scenes/MenuScene.js';
import PauseScene from './scenes/PauseScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import GameOverScene from './scenes/GameOverScene.js';
const config = {
    type: Phaser.AUTO,
    width: 1536,
    height: 1024,
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
    GameOverScene
    ]
};

const game = new Phaser.Game(config);