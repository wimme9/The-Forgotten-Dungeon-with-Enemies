import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super("VictoryScene");
    }

    preload() {
        // โหลดรูปภาพพื้นหลังหน้าชนะเกม (เปลี่ยนชื่อไฟล์ตามที่คุณใช้งานจริงได้เลยครับ)
        this.load.image('victory_bg', 'win.png');
    }

    create() {
        // เล่นเสียงชนะเกม (ถ้ามีโหลดไว้)
        if (this.sound.get('win')) {
            this.sound.play('win');
        }

        // --- แสดงรูปพื้นหลังเต็มจอ (1536x1024) ---
        if (this.textures.exists('victory_bg')) {
            this.add.image(768, 512, 'victory_bg')
                .setDisplaySize(1536, 1024)
                .setAlpha(0.7);
        } else {
            // สีสำรองกรณีหารูปไม่พบ
            this.add.graphics().fillStyle(0x050508, 1).fillRect(0, 0, 1536, 1024);
        }

        // เพิ่มเลเยอร์สีทอง/มืดโปร่งแสงทับเล็กน้อยให้บรรยากาศดูขลังและเด่นขึ้น
        this.add.graphics().fillStyle(0x000000, 0.4).fillRect(0, 0, 1536, 1024);

        // --- ข้อความ VICTORY! แบบมีเอฟเฟกต์เด้งดึ๋ง ---
        this.add.text(768, 434, "VICTORY!", {
            fontSize: "76px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        let victoryText = this.add.text(768, 430, "VICTORY!", {
            fontSize: "76px",
            color: "#ffcc00",
            fontStyle: "bold"
        }).setOrigin(0.5).setScale(0);

        this.tweens.add({
            targets: victoryText,
            scale: 1,
            duration: 800,
            ease: 'Back.Out'
        });

        // --- ปุ่ม BACK TO MENU ---
        let restartButton = this.add.text(768, 580, "BACK TO MENU", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#1a1a24",
            fontStyle: "bold",
            padding: { x: 35, y: 16 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .setAlpha(0);

        this.tweens.add({
            targets: restartButton,
            alpha: 1,
            y: 580,
            delay: 400,
            duration: 500
        });

        restartButton.on("pointerover", () => {
            restartButton.setColor("#00ff99");
            restartButton.setBackgroundColor("#2a2a3d");
            this.tweens.add({ targets: restartButton, scale: 1.08, duration: 100 });
        });

        restartButton.on("pointerout", () => {
            restartButton.setColor("#ffffff");
            restartButton.setBackgroundColor("#1a1a24");
            this.tweens.add({ targets: restartButton, scale: 1, duration: 100 });
        });

        restartButton.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });
    }
}