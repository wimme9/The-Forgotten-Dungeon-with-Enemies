export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    preload() {
        // คุณสามารถโหลดรูปภาพพื้นหลังหรือโลโก้มาใส่ตรงนี้เพิ่มเติมได้
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;

        // -------------------------------------------------------------
        // 1. สร้างพื้นหลังแบบไล่เฉดสีมืดดุดัน (Dark Gradient Background)
        // -------------------------------------------------------------
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x1a0826, 0x05020a, 1);
        bgGraphics.fillRect(0, 0, width, height);

        // เอฟเฟกต์ตารางพื้นหลังแบบดันเจี้ยนเวทมนตร์ (Glowing Grid)
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x6128a1, 0.15);
        for (let x = 0; x < width; x += 40) {
            gridGraphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 40) {
            gridGraphics.lineBetween(0, y, width, y);
        }

        // -------------------------------------------------------------
        // 2. เอฟเฟกต์ละอองเวทมนตร์/ละอองไฟ (Floating Particles)
        // -------------------------------------------------------------
        const particleGraphics = this.add.graphics();
        particleGraphics.fillStyle(0xffd700, 1);
        particleGraphics.fillCircle(4, 4, 4);
        particleGraphics.generateTexture('magicParticle', 8, 8);
        particleGraphics.destroy();

        const emitter = this.add.particles(0, 0, 'magicParticle', {
            x: { min: 0, max: width },
            y: { min: height - 50, max: height },
            speedY: { min: -40, max: -120 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 3500,
            blendMode: 'ADD',
            frequency: 150
        });

        // -------------------------------------------------------------
        // 3. ชื่อเกมสไตล์นีออนเรืองแสง (Glowing Title Text)
        // -------------------------------------------------------------
        // เงาเรืองแสงด้านหลัง (Glow Shadow)
        const titleGlow = this.add.text(centerX, 180, "FORGOTTEN DUNGEON", {
            fontFamily: "Impact, Arial Black, sans-serif",
            fontSize: "58px",
            color: "#ff2255"
        }).setOrigin(0.5).setAlpha(0.6);

        // ตัวหนังสือหลัก
        const titleText = this.add.text(centerX, 180, "FORGOTTEN DUNGEON", {
            fontFamily: "Impact, Arial Black, sans-serif",
            fontSize: "56px",
            color: "#ffffff",
            stroke: "#990033",
            strokeThickness: 8
        }).setOrigin(0.5);

        // อานิเมชันชื่อเกมลอยขึ้น-ลงอย่างนุ่มนวล
        this.tweens.add({
            targets: [titleText, titleGlow],
            y: "+=12",
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // -------------------------------------------------------------
        // 4. ปุ่มกด START สุดเท่ พร้อมกรอบและเอฟเฟกต์ Hover
        // -------------------------------------------------------------
        const btnY = 380;
        
        // กรอบปุ่ม (Button Container Background)
        const btnBg = this.add.graphics();
        const drawButton = (borderColor, fillColor) => {
            btnBg.clear();
            btnBg.fillStyle(fillColor, 0.85);
            btnBg.fillRoundedRect(centerX - 120, btnY - 30, 240, 60, 12);
            btnBg.lineStyle(3, borderColor, 1);
            btnBg.strokeRoundedRect(centerX - 120, btnY - 30, 240, 60, 12);
        };

        // วาดสีปุ่มเริ่มต้น
        drawButton(0x00ffcc, 0x112233);

        // ตัวหนังสือบนปุ่ม
        const startText = this.add.text(centerX, btnY, "START GAME", {
            fontFamily: "Arial, sans-serif",
            fontSize: "26px",
            fontWeight: "bold",
            color: "#00ffcc"
        }).setOrigin(0.5);

        // สร้างพื้นที่ Hitbox ให้คลิกปุ่มได้ง่ายขึ้น
        const btnZone = this.add.zone(centerX, btnY, 240, 60).setInteractive({ useHandCursor: true });

        // --- Event เมื่อเมาส์ชี้ (Hover) ---
        btnZone.on("pointerover", () => {
            drawButton(0xffff00, 0x332200); // เปลี่ยนขอบปุ่มเป็นสีทอง
            startText.setColor("#ffff00");
            startText.setScale(1.1); // ขยายตัวหนังสือเล็กน้อย
            
            // เอฟเฟกต์ปุ่มขยายขึ้น
            this.tweens.add({
                targets: startText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Linear'
            });
        });

        // --- Event เมื่อเมาส์ออก (Out) ---
        btnZone.on("pointerout", () => {
            drawButton(0x00ffcc, 0x112233);
            startText.setColor("#00ffcc");
            
            this.tweens.add({
                targets: startText,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 100,
                ease: 'Linear'
            });
        });

        // --- Event เมื่อกดปุ่ม START ---
        btnZone.on("pointerdown", () => {
            // เอฟเฟกต์แฟลชหน้าจอสีขาวเนียนๆ ก่อนเปลี่ยนฉาก
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                console.log("เริ่มเกม!");
                this.scene.start("GameplayScene");
            });
        });

        // ข้อความเวอร์ชันหรือลิขสิทธิ์มุมขวาใต้ภาพ
        this.add.text(width - 20, height - 20, "v1.0.0 | Phaser 3", {
            font: "12px Arial",
            fill: "#666688"
        }).setOrigin(1, 1);
    }
}