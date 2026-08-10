import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super("GameOverScene");
    }

    preload() {
        // โหลดรูปพื้นหลังหน้า Game Over (สามารถเปลี่ยนชื่อไฟล์ด้านหลังให้ตรงกับไฟล์ของคุณได้ครับ)
        this.load.image('gameover_bg', '83185159-464b-491a-a085-5452e0aad7c4.png');
    }

    create() {
        // เล่นเสียง Game Over (ถ้ามีโหลดไว้)
        if (this.sound.get('gameover')) {
            this.sound.play('gameover');
        }

        // แสดงรูปพื้นหลังเต็มจอ (1536x1024)
        if (this.textures.exists('gameover_bg')) {
            this.add.image(768, 512, 'gameover_bg')
                .setDisplaySize(1536, 1024)
                .setAlpha(0.6);
        } else {
            // สีสำรองเผื่อหารูปไม่พบ
            this.add.graphics().fillStyle(0x1a0000, 1).fillRect(0, 0, 1536, 1024);
        }

        // เพิ่มเลเยอร์สีแดงเข้มโปร่งแสงทับเล็กน้อยให้อารมณ์เกมโอเวอร์
        let overlay = this.add.graphics().fillStyle(0xff0000, 0.3).fillRect(0, 0, 1536, 1024);
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 500
        });

        // --- ข้อความ GAME OVER ---
        this.add.text(768, 434, "GAME OVER", {
            fontSize: "76px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        let gameOverText = this.add.text(768, 430, "GAME OVER", {
            fontSize: "76px",
            color: "#ff3333",
            fontStyle: "bold"
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scale: { from: 1.2, to: 1 },
            duration: 600,
            ease: 'Power2'
        });

        // --- ปุ่มกลับหน้าเมนูหลัก (BACK TO MENU) ---
        let menuButton = this.add.text(768, 580, "BACK TO MENU", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#2a1a1a",
            fontStyle: "bold",
            padding: { x: 35, y: 16 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .setAlpha(0);

        this.tweens.add({
            targets: menuButton,
            alpha: 1,
            delay: 300,
            duration: 500
        });

        menuButton.on("pointerover", () => {
            menuButton.setColor("#ff6666");
            menuButton.setBackgroundColor("#4a2222");
            this.tweens.add({ targets: menuButton, scale: 1.08, duration: 100 });
        });

        menuButton.on("pointerout", () => {
            menuButton.setColor("#ffffff");
            menuButton.setBackgroundColor("#2a1a1a");
            this.tweens.add({ targets: menuButton, scale: 1, duration: 100 });
        });

        menuButton.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });
    }
}