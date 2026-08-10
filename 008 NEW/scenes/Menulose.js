export default class Menulose extends Phaser.Scene {

    constructor() {
        super("Menulose");
    }

    create() {
        // หาจุดกึ่งกลางของหน้าจอ
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // 1. ตั้งค่าพื้นหลังเป็นสีดำอมแดงมืดๆ ให้ความรู้สึกพ่ายแพ้
        this.cameras.main.setBackgroundColor('#0a0000');

        // 2. ข้อความ YOU DIED หรือ GAME OVER
        let gameOverText = this.add.text(
            centerX,
            centerY - 100,
            "YOU DIED",
            {
                fontSize: "72px",
                fontFamily: "Arial Black, Impact, sans-serif",
                color: "#ff0000", // สีแดงสด
                stroke: "#4a0000",
                strokeThickness: 8,
                shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 10, fill: true }
            }
        ).setOrigin(0.5);

        // เอฟเฟกต์เฟดข้อความ YOU DIED เข้ามาอย่างช้าๆ ให้ดูน่าเกรงขาม
        gameOverText.setAlpha(0);
        gameOverText.setScale(0.8);
        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scale: 1,
            duration: 2500,
            ease: 'Sine.easeOut'
        });

        // 3. ปุ่ม TRY AGAIN (เล่นใหม่อีกครั้ง)
        let restartButton = this.add.text(
            centerX,
            centerY + 50,
            "TRY AGAIN",
            {
                fontSize: "32px",
                fontFamily: "Courier New, monospace",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#5e0b0b",
                padding: { x: 30, y: 10 },
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

        // 4. ปุ่ม MAIN MENU (กลับหน้าหลัก)
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

        // เอฟเฟกต์หน่วงเวลา (Delay) ให้ปุ่มค่อยๆ ปรากฏขึ้นมาหลังจากข้อความ YOU DIED
        this.tweens.add({
            targets: [restartButton, menuButton],
            alpha: 1,
            delay: 1500, // รอ 1.5 วินาที
            duration: 1000
        });

        // --- จัดการ Event ปุ่ม TRY AGAIN ---
        restartButton.on("pointerover", () => {
            restartButton.setStyle({ color: "#ffcc00", backgroundColor: "#8a1010" });
            this.tweens.add({ targets: restartButton, scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        restartButton.on("pointerout", () => {
            restartButton.setStyle({ color: "#ffffff", backgroundColor: "#5e0b0b" });
            this.tweens.add({ targets: restartButton, scaleX: 1, scaleY: 1, duration: 100 });
        });

        restartButton.on("pointerdown", () => {
            // ปิดการกดปุ่มซ้ำ
            restartButton.disableInteractive();
            menuButton.disableInteractive();

            this.tweens.add({
                targets: restartButton,
                scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    // เฟดหน้าจอมืดลง แล้วกลับไปเริ่มเกมใหม่
                    this.cameras.main.fadeOut(800, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start("GameplayScene");
                    });
                }
            });
        });

        // --- จัดการ Event ปุ่ม MAIN MENU ---
        menuButton.on("pointerover", () => {
            menuButton.setStyle({ color: "#ffffff", backgroundColor: "#444444" });
            this.tweens.add({ targets: menuButton, scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        menuButton.on("pointerout", () => {
            menuButton.setStyle({ color: "#aaaaaa", backgroundColor: "#222222" });
            this.tweens.add({ targets: menuButton, scaleX: 1, scaleY: 1, duration: 100 });
        });

        menuButton.on("pointerdown", () => {
            // ปิดการกดปุ่มซ้ำ
            restartButton.disableInteractive();
            menuButton.disableInteractive();

            this.tweens.add({
                targets: menuButton,
                scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    // เฟดหน้าจอมืดลง แล้วกลับไปหน้าเมนูหลัก
                    this.cameras.main.fadeOut(800, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start("MenuScene");
                    });
                }
            });
        });
    }
}