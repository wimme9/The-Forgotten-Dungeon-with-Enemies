export default class Menuwin extends Phaser.Scene {

    constructor() {
        super("Menuwin");
    }

    create() {
        // หาขนาดและจุดกึ่งกลางของหน้าจอ
        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // --- 1. พื้นหลังไล่สี (Dark Fantasy Victory Gradient) ---
        // ไล่สีจากเขียวเข้มมืดๆ ด้านบน ลงมาเป็นดำสนิทด้านล่าง
        let bg = this.add.graphics();
        bg.fillGradientStyle(0x152a15, 0x152a15, 0x020502, 0x020502, 1);
        bg.fillRect(0, 0, width, height);

        // --- 2. สร้างเทกซ์เจอร์ละอองเวทมนตร์ (สร้างสดไม่ต้องโหลดรูป) ---
        let dot = this.make.graphics({x: 0, y: 0, add: false});
        dot.fillStyle(0xffffff, 1);
        dot.fillCircle(4, 4, 4);
        dot.generateTexture('victoryDust', 8, 8);

        // --- 3. ระบบอนุภาค (Particles) ละอองเวทมนตร์สีทองและเขียวสว่าง ---
        this.add.particles(0, 0, 'victoryDust', {
            x: { min: 0, max: width },
            y: { min: height, max: height + 50 }, // เริ่มจากขอบล่างจอ
            lifespan: { min: 4000, max: 8000 },
            speedY: { min: -15, max: -40 }, // ลอยเร็วกว่าหน้าเมนูนิดหน่อย ให้ดูมีความหวัง
            speedX: { min: -10, max: 10 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            quantity: 1, 
            frequency: 100, // ปล่อยออกมาเยอะขึ้นนิดหน่อยเพื่อฉลองชัยชนะ
            blendMode: 'ADD',
            tint: [0xffdd44, 0x55ff55, 0xffaa00] // สีทอง, เขียวสว่าง, ส้มทอง
        });

        // --- 4. ขอบจอมืด (Vignette Effect) เพิ่มความลึกลับ ---
        let vignette = this.add.graphics();
        vignette.fillStyle(0x000000, 0.5); // ทำให้ขอบมืดขึ้นเล็กน้อย
        vignette.fillRect(0, 0, width, 60); // ขอบบน
        vignette.fillRect(0, height - 60, width, 60); // ขอบล่าง
        vignette.fillRect(0, 0, 60, height); // ขอบซ้าย
        vignette.fillRect(width - 60, 0, 60, height); // ขอบขวา

        // ==========================================
        // UI และปุ่มต่างๆ (คงเดิม)
        // ==========================================

        // ข้อความ DUNGEON CLEARED!
        let victoryText = this.add.text(
            centerX,
            centerY - 100,
            "DUNGEON CLEARED!",
            {
                fontSize: "64px",
                fontFamily: "Arial Black, Impact, sans-serif",
                color: "#ffcc00",
                stroke: "#1a4d1a",
                strokeThickness: 8,
                shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 10, fill: true }
            }
        ).setOrigin(0.5);

        // เอฟเฟกต์เด้งดึ๋ง
        victoryText.setScale(0);
        this.tweens.add({
            targets: victoryText,
            scale: 1,
            duration: 1500,
            ease: 'Elastic.easeOut'
        });

        // ปุ่ม PLAY AGAIN
        let replayButton = this.add.text(
            centerX,
            centerY + 50,
            "PLAY AGAIN",
            {
                fontSize: "32px",
                fontFamily: "Courier New, monospace",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#1a4d1a",
                padding: { x: 30, y: 10 },
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

        // ปุ่ม MAIN MENU
        let menuButton = this.add.text(
            centerX,
            centerY + 130,
            "MAIN MENU",
            {
                fontSize: "24px",
                fontFamily: "Courier New, monospace",
                fontStyle: "bold",
                color: "#aaaaaa",
                backgroundColor: "#222222",
                padding: { x: 20, y: 10 },
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

        // ดีเลย์ปุ่ม
        this.tweens.add({
            targets: [replayButton, menuButton],
            alpha: 1,
            delay: 1000,
            duration: 1000
        });

        // Event ปุ่ม PLAY AGAIN
        replayButton.on("pointerover", () => {
            replayButton.setStyle({ color: "#ffcc00", backgroundColor: "#2e8b2e" });
            this.tweens.add({ targets: replayButton, scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        replayButton.on("pointerout", () => {
            replayButton.setStyle({ color: "#ffffff", backgroundColor: "#1a4d1a" });
            this.tweens.add({ targets: replayButton, scaleX: 1, scaleY: 1, duration: 100 });
        });

        replayButton.on("pointerdown", () => {
            replayButton.disableInteractive();
            menuButton.disableInteractive();
            this.tweens.add({
                targets: replayButton,
                scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    this.cameras.main.fadeOut(800, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start("GameplayScene");
                    });
                }
            });
        });

        // Event ปุ่ม MAIN MENU
        menuButton.on("pointerover", () => {
            menuButton.setStyle({ color: "#ffffff", backgroundColor: "#444444" });
            this.tweens.add({ targets: menuButton, scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        menuButton.on("pointerout", () => {
            menuButton.setStyle({ color: "#aaaaaa", backgroundColor: "#222222" });
            this.tweens.add({ targets: menuButton, scaleX: 1, scaleY: 1, duration: 100 });
        });

        menuButton.on("pointerdown", () => {
            replayButton.disableInteractive();
            menuButton.disableInteractive();
            this.tweens.add({
                targets: menuButton,
                scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    this.cameras.main.fadeOut(800, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start("MenuScene");
                    });
                }
            });
        });
    }
}