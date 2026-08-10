export default class PauseScene extends Phaser.Scene {

    constructor() {
        super("PauseScene");
    }

    create() {
        // หาจุดกึ่งกลางของหน้าจอ และขนาดหน้าจอทั้งหมด
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. ทำให้หน้าจอเกมเพลย์มืดลงเล็กน้อย (Full-screen Dim)
        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.6);

        // 2. สร้างกรอบเมนู Pause
        let panel = this.add.rectangle(
            centerX,
            centerY,
            450,
            350,
            0x111118, // สีพื้นหลังกรอบ (ดำอมน้ำเงิน)
            0.95
        ).setStrokeStyle(4, 0x4a0000); // เส้นขอบสีแดงเลือดหมู

        // 3. ข้อความ PAUSED
        let pauseText = this.add.text(
            centerX,
            centerY - 90,
            "PAUSED",
            {
                fontSize: "56px",
                fontFamily: "Arial Black, Impact, sans-serif",
                color: "#ffcc00",
                stroke: "#4a0000",
                strokeThickness: 6,
                shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true }
            }
        ).setOrigin(0.5);

        // 4. ปุ่ม RESUME (เล่นต่อ)
        let resumeButton = this.add.text(
            centerX,
            centerY + 30,
            "RESUME",
            {
                fontSize: "32px",
                fontFamily: "Courier New, monospace",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#5e0b0b",
                padding: { x: 30, y: 10 },
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // 5. ปุ่ม MAIN MENU (กลับหน้าหลัก)
        let menuButton = this.add.text(
            centerX,
            centerY + 110,
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
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // --- เอฟเฟกต์ตอนเปิดเมนู Pause (Pop-up Animation) ---
        let menuElements = [panel, pauseText, resumeButton, menuButton];
        menuElements.forEach(el => {
            el.setScale(0); // เริ่มต้นที่ขนาด 0
            this.tweens.add({
                targets: el,
                scale: 1, // เด้งมาเป็นขนาดปกติ
                duration: 400,
                ease: 'Back.easeOut' // ทำให้มีจังหวะเด้งดึ๋งเล็กน้อย
            });
        });

        // --- จัดการ Event ปุ่ม RESUME ---
        resumeButton.on("pointerover", () => {
            resumeButton.setStyle({ color: "#ffcc00", backgroundColor: "#8a1010" });
            this.tweens.add({ targets: resumeButton, scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        resumeButton.on("pointerout", () => {
            resumeButton.setStyle({ color: "#ffffff", backgroundColor: "#5e0b0b" });
            this.tweens.add({ targets: resumeButton, scaleX: 1, scaleY: 1, duration: 100 });
        });

        resumeButton.on("pointerdown", () => {
            resumeButton.disableInteractive();
            this.tweens.add({
                targets: resumeButton,
                scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    console.log("Resume");
                    this.scene.resume("GameplayScene");
                    this.scene.stop();
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
            menuButton.disableInteractive();
            this.tweens.add({
                targets: menuButton,
                scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    console.log("Quit to Main Menu");
                    this.scene.stop("GameplayScene"); // ปิดฉากเกมเพลย์
                    this.scene.start("MenuScene"); // เริ่มหน้าเมนูใหม่
                    this.scene.stop(); // ปิดหน้า Pause
                }
            });
        });
    }
}