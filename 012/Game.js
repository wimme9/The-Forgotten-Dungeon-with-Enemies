import GameplayScene from "./Scenes/GameplayScene.js";
import MenuScene from "./Scenes/MenuScene.js";
import PauseScene from "./Scenes/PauseScene.js";
import VictoryScene from "./Scenes/VitoryScene.js";
import GameOverScene from "./Scenes/GameOverScene.js";

const config = {
    type: Phaser.CANVAS, // สำคัญ: ต้องเป็น CANVAS ไม่ใช่ AUTO/WEBGL เพราะเกมวาดด้วย ctx 2D เอง
    canvas: document.getElementById("gameCanvas"),
    width: 1000,
    height: 600,
    scene: [
        MenuScene,
        GameplayScene,
        PauseScene,
        VictoryScene,
        GameOverScene
    ]
};

const game = new Phaser.Game(config);