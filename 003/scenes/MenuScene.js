import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {
        // โหลดรูปพื้นหลังตรงนี้เพื่อให้หน้าเมนูเรียกใช้ได้ทันที
        this.load.image('backg', '409445d2-e423-4598-9a4a-44874ba603bc.png');
    }

    create() {
        // แสดงรูปพื้นหลังเต็มจอ
        this.add.image(768, 512, 'backg')
            .setDisplaySize(1536, 1024)
            .setAlpha(0.7);

        // เลเยอร์สีดำโปร่งแสงทับให้ตัวหนังสืออ่านง่ายขึ้น
        this.add.graphics().fillStyle(0x000000, 0.4).fillRect(0, 0, 1536, 1024);

        // --- Game Title with Pulse Animation ---
        this.add.text(768, 322, "FORGOTTEN DUNGEON", {
            fontSize: "60px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        let titleText = this.add.text(768, 320, "FORGOTTEN DUNGEON", {
            fontSize: "60px",
            color: "#ff3333",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleText,
            scale: { from: 1, to: 1.03 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(768, 400, "— Escape the Ancient Dungeon Puzzle —", {
            fontSize: "24px",
            color: "#cccccc",
            fontStyle: "italic"
        }).setOrigin(0.5);

        // --- Start Button ---
        let startButton = this.add.text(768, 520, "START GAME", {
            fontSize: "36px",
            color: "#00ffcc",
            backgroundColor: "#1a1a24",
            fontStyle: "bold",
            padding: { x: 40, y: 18 }
        })
        .setOrigin(0.5)
        .setInteractive();

        startButton.on("pointerover", () => {
            startButton.setColor("#ffffff");
            startButton.setBackgroundColor("#00aa88");
            this.tweens.add({ targets: startButton, scale: 1.1, duration: 100 });
        });

        startButton.on("pointerout", () => {
            startButton.setColor("#00ffcc");
            startButton.setBackgroundColor("#1a1a24");
            this.tweens.add({ targets: startButton, scale: 1, duration: 100 });
        });

        startButton.on("pointerdown", () => {
            this.scene.start("GameplayScene");
        });

        // --- Controls Guide Box ---
        this.add.graphics()
            .fillStyle(0x000000, 0.7)
            .fillRoundedRect(568, 680, 400, 140, 12)
            .lineStyle(2, 0x444455, 1)
            .strokeRoundedRect(568, 680, 400, 140, 12);

        this.add.text(768, 705, "CONTROLS", {
            fontSize: "18px",
            color: "#ffcc00",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.add.text(768, 755, "Move: W A S D   |   Interact: Left Click", {
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0.5);
    }
}