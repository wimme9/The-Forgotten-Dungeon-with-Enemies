import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super("PauseScene");
    }

    create() {
        // --- กล่องพื้นหลังเมนูป๊อปอัป (พร้อมเส้นขอบ) ---
        this.add.rectangle(768, 512, 600, 450, 0x0a0a0f, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0x444455);

        // --- ข้อความ PAUSED (พร้อมเงาและแอนิเมชันเบาๆ) ---
        this.add.text(768, 362, "PAUSED", {
            fontSize: "64px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        let pauseText = this.add.text(768, 360, "PAUSED", {
            fontSize: "64px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: pauseText,
            scale: { from: 1, to: 1.03 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- ปุ่ม RESUME ---
        let resumeButton = this.add.text(768, 490, "RESUME", {
            fontSize: "28px",
            color: "#00ffcc",
            backgroundColor: "#1a1a24",
            fontStyle: "bold",
            padding: { x: 30, y: 12 }
        })
        .setOrigin(0.5)
        .setInteractive();

        resumeButton.on("pointerover", () => {
            resumeButton.setColor("#ffffff");
            resumeButton.setBackgroundColor("#00aa88");
            this.tweens.add({ targets: resumeButton, scale: 1.08, duration: 100 });
        });

        resumeButton.on("pointerout", () => {
            resumeButton.setColor("#00ffcc");
            resumeButton.setBackgroundColor("#1a1a24");
            this.tweens.add({ targets: resumeButton, scale: 1, duration: 100 });
        });

        resumeButton.on("pointerdown", () => {
            this.scene.stop();
            this.scene.resume("GameplayScene");
        });

        // --- ปุ่ม BACK TO MENU (เพิ่มใหม่) ---
        let menuButton = this.add.text(768, 580, "BACK TO MENU", {
            fontSize: "28px",
            color: "#ff6666",
            backgroundColor: "#1a1a24",
            fontStyle: "bold",
            padding: { x: 20, y: 12 }
        })
        .setOrigin(0.5)
        .setInteractive();

        menuButton.on("pointerover", () => {
            menuButton.setColor("#ffffff");
            menuButton.setBackgroundColor("#aa2222");
            this.tweens.add({ targets: menuButton, scale: 1.08, duration: 100 });
        });

        menuButton.on("pointerout", () => {
            menuButton.setColor("#ff6666");
            menuButton.setBackgroundColor("#1a1a24");
            this.tweens.add({ targets: menuButton, scale: 1, duration: 100 });
        });

        menuButton.on("pointerdown", () => {
            this.scene.stop("GameplayScene"); // หยุดฉากเกมหลัก
            this.scene.stop("PauseScene");    // ปิดหน้า Pause
            this.scene.start("MenuScene");    // กลับไปหน้าเมนู
        });
    }
}