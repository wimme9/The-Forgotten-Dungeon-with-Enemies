import GameplayScene from "./scenes/GameplayScene.js";
import MenuScene from "./scenes/MenuScene.js";
import PauseScene from "./scenes/PauseScene.js";
import Menulose from "./scenes/Menulose.js";
import Menuwin from "./scenes/Menuwin.js";

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
    scene: [ MenuScene, GameplayScene, PauseScene , Menulose , Menuwin ] // Registers the MenuScene, GameplayScene, and PauseScene classes
};

const game = new Phaser.Game(config);