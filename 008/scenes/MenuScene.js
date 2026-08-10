export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    create() {
        // หาขนาดและจุดกึ่งกลางของหน้าจอ
        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // --- 1. พื้นหลังไล่สี (Dark Fantasy Gradient) ---
        // ไล่สีจากน้ำตาลแดงมืดๆ ด้านบน ไปเป็นสีดำสนิทที่ด้านล่าง
        let bg = this.add.graphics();
        bg.fillGradientStyle(0x2a1515, 0x2a1515, 0x050000, 0x050000, 1);
        bg.fillRect(0, 0, width, height);

        // --- 2. สร้างเทกซ์เจอร์เม็ดฝุ่น (สร้างสดๆ ไม่ต้องโหลดรูป) ---
        let dot = this.make.graphics({x: 0, y: 0, add: false});
        dot.fillStyle(0xffffff, 1);
        dot.fillCircle(4, 4, 4);
        dot.generateTexture('magicDust', 8, 8);

        // --- 3. ระบบอนุภาค (Particles) เถ้าถ่านเวทมนตร์ลอยขึ้นช้าๆ ---
        this.add.particles(0, 0, 'magicDust', {
            x: { min: 0, max: width },
            y: { min: height, max: height + 50 }, // เริ่มจากขอบล่างจอ
            lifespan: { min: 5000, max: 10000 }, // ระยะเวลาลอย (5-10 วิ)
            speedY: { min: -10, max: -30 }, // ลอยขึ้นช้าๆ
            speedX: { min: -15, max: 15 }, // ส่ายซ้ายขวาเบาๆ
            scale: { start: 0.6, end: 0 }, // ค่อยๆ หายไป
            alpha: { start: 0.4, end: 0 },
            quantity: 1, 
            frequency: 150, // ความถี่ในการปล่อย (ยิ่งน้อยยิ่งเยอะ)
            blendMode: 'ADD',
            tint: [0xff4444, 0xff8822, 0x550000] // สีส้ม แดง และแดงมืด
        });

        // --- 4. ขอบจอมืด (Vignette Effect) เพิ่มความลึกลับ ---
        let vignette = this.add.graphics();
        vignette.fillStyle(0x000000, 0.4);
        vignette.fillRect(0, 0, width, 60); // ขอบบน
        vignette.fillRect(0, height - 60, width, 60); // ขอบล่าง
        vignette.fillRect(0, 0, 60, height); // ขอบซ้าย
        vignette.fillRect(width - 60, 0, 60, height); // ขอบขวา

        // ==========================================
        // ส่วนของชื่อเกมและปุ่ม (ตามที่คุณตั้งค่าไว้)
        // ==========================================

        // ชื่อเกม
        let titleText = this.add.text(
            centerX,
            centerY - 150,
            "FORGOTTEN DUNGEON",
            {
                fontSize: "64px",
                fontFamily: "Arial Black, Impact, sans-serif",
                color: "#ffcc00",
                stroke: "#4a0000",
                strokeThickness: 8,
                shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true }
            }
        ).setOrigin(0.5);

        // ทำให้ชื่อเกมขยับลอยขึ้นลงเบาๆ
        this.tweens.add({
            targets: titleText,
            y: titleText.y - 15,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // ปุ่ม START
        let startButton = this.add.text(
            centerX,
            centerY + 50,
            "START GAME",
            {
                fontSize: "36px",
                fontFamily: "Courier New, monospace",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#5e0b0b",
                padding: { x: 30, y: 15 },
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
            }
        ).setOrigin(0.5)
         .setInteractive({ useHandCursor: true });

        // เมาส์ชี้
        startButton.on("pointerover", () => {
            startButton.setStyle({ color: "#ffcc00", backgroundColor: "#8a1010" });
            this.tweens.add({ targets: startButton, scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });

        // เมาส์ออก
        startButton.on("pointerout", () => {
            startButton.setStyle({ color: "#ffffff", backgroundColor: "#5e0b0b" });
            this.tweens.add({ targets: startButton, scaleX: 1, scaleY: 1, duration: 100 });
        });

        // คลิก START
        startButton.on("pointerdown", () => {
            startButton.disableInteractive();
            this.tweens.add({
                targets: startButton,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.cameras.main.fadeOut(800, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start("GameplayScene");
                    });
                }
            });
        });
    }
}