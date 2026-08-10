import MenuScene from "./scenes/MenuScene.js";
import GameplayScene from "./scenes/GameplayScene.js";
import PauseScene from "./scenes/PauseScene.js";
import VictoryScene from "./scenes/VictoryScene.js";
import DefeatScene from "./scenes/DefeatScene.js";

const config = {    
    type: Phaser.AUTO,
    width: 1280,
    height: 704,
    backgroundColor: '#1a1a1a',
    
    // 📍 1. ปิด Smoothing เพื่อให้ Pixel Art คมกริบ ไม่เบลอ
    pixelArt: true, 
    
    render: {
        pixelArt: true,
        antialias: false,             // ปิดการเกลาขอบภาพ
        roundPixels: true             // บังคับให้ตำแหน่ง Pixel เป็นจำนวนเต็ม (ป้องกันภาพเหลื่อมหรือสั่นเบลอตอนเดิน)
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        
        // 📍 2. ดึงความละเอียดระดับ Hardware ของจอ (ช่วยได้เยอะมากสำหรับจอ Retina / 2K / 4K)
        resolution: window.devicePixelRatio || 1 
    },

    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },

    scene: [ 
        MenuScene,
        GameplayScene,
        PauseScene,
        VictoryScene,
        DefeatScene
    ] 
};

const game = new Phaser.Game(config);