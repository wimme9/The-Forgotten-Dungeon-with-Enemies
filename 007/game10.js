import GameplayScene from "./scenes/GameplayScene.js";
import MenuScene from "./scenes/MenuScene.js";
import PauseScene from "./scenes/PauseScene.js";
import VictoryScene from "./scenes/VictoryScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },   // แบบอาเขต (top-down) ไม่มีแรงโน้มถ่วง
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
