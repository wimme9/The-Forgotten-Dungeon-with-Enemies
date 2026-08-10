export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {
        this.load.image('bookAsset', 'sprite/book.png');
        this.load.image('dragonAsset', 'sprite/dragon.png');
    }

    create() {
        const { width, height } = this.scale;

        // 🎬 อนิเมชันเปิดหน้าจอ (Fade In)
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // 1. ฉากหลังสไตล์ดันเจี้ยนลึกลับ
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0d0221, 0x0d0221, 0x02010a, 0x02010a, 1);
        bg.fillRect(0, 0, width, height);

        // 2. วงแหวนเวทมนตร์หมุน
        const magicCircleGroup = this.add.container(width / 2, height / 2 - 30);
        const outerCircle = this.add.circle(0, 0, 180).setStrokeStyle(3, 0x7b2cbf, 0.5);
        const innerCircle = this.add.circle(0, 0, 140).setStrokeStyle(2, 0x3a0ca3, 0.6);
        const starShape = this.add.polygon(0, 0, [0, -140, 100, 100, -120, -40, 120, -40, -100, 100]).setStrokeStyle(1.5, 0x4cc9f0, 0.3);
        magicCircleGroup.add([outerCircle, innerCircle, starShape]);

        this.tweens.add({ targets: magicCircleGroup, angle: 360, duration: 25000, repeat: -1, ease: 'Linear' });

        // 3. ละอองแสงเวทมนตร์
        this.add.particles(0, 0, 'bookAsset', {
            x: { min: 0, max: width }, y: { min: 0, max: height },
            speedY: { min: -20, max: -50 }, speedX: { min: -10, max: 10 },
            scale: { start: 0.02, end: 0 }, alpha: { start: 0.6, end: 0 },
            blendMode: 'ADD', lifespan: 3000, frequency: 150,
            tint: [0x4cc9f0, 0x7b2cbf, 0xffd700]
        });

        // 4. ตกแต่งมังกรข้าง
        const leftDragon = this.add.sprite(width / 2 - 280, height / 2, 'dragonAsset').setScale(0.08).setTint(0x7b2cbf).setAlpha(0.7);
        const rightDragon = this.add.sprite(width / 2 + 280, height / 2, 'dragonAsset').setScale(0.08).setTint(0x7b2cbf).setAlpha(0.7).setFlipX(true);
        this.tweens.add({ targets: [leftDragon, rightDragon], y: height / 2 - 15, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // 5. ชื่อเกม
        const titleText = this.add.text(width / 2, height / 2 - 140, "DUNGEON PUZZLE", {
            font: "bold 48px 'Trebuchet MS', Arial, sans-serif", fill: "#ffffff", stroke: "#3a0ca3", strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: "#4cc9f0", blur: 20, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 80, "📜 ปริศนาคัมภีร์เวทมนตร์และหอคอยมังกร 🗝️", {
            font: "bold 18px 'Tahoma', Arial", fill: "#ffd700", stroke: "#000000", strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({ targets: titleText, scaleX: 1.05, scaleY: 1.05, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // 6. ปุ่มกดเริ่มเกม (พร้อม Fade Out Transition)
        this.createCustomButton(width / 2, height / 2 + 60, "⚔️ เริ่มผจญภัย (START)", 0x7b2cbf, 0x3a0ca3, () => {
            this.playSFX('click');
            this.cameras.main.fade(500, 0, 0, 0, false, (cam, progress) => {
                if (progress === 1) this.scene.start("GameplayScene");
            });
        });

        // 7. ปุ่มกติกา
        this.createCustomButton(width / 2, height / 2 + 130, "📖 วิธีการเล่น (HOW TO PLAY)", 0x240046, 0x10002b, () => {
            this.playSFX('click');
            this.showHowToPlayModal();
        });

        this.add.text(width / 2, height - 30, "PRESS START TO EXPLORE THE DUNGEON", { font: "12px monospace", fill: "#4cc9f0", alpha: 0.6 }).setOrigin(0.5);
    }

    createCustomButton(x, y, label, fillHex, borderHex, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const drawBtn = (fColor, bColor) => {
            bg.clear();
            bg.fillStyle(bColor, 1); bg.fillRoundedRect(-142, -27, 284, 54, 12);
            bg.fillStyle(fColor, 1); bg.fillRoundedRect(-140, -25, 280, 50, 10);
        };
        drawBtn(fillHex, borderHex);

        const text = this.add.text(0, 0, label, { font: "bold 16px Arial", fill: "#ffffff" }).setOrigin(0.5);
        container.add([bg, text]);

        container.setInteractive(new Phaser.Geom.Rectangle(-140, -25, 280, 50), Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => {
            this.playSFX('click');
            drawBtn(0xffd700, 0x7b2cbf);
            text.setStyle({ fill: "#000000" });
            this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });
        container.on('pointerout', () => {
            drawBtn(fillHex, borderHex);
            text.setStyle({ fill: "#ffffff" });
            this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 100 });
        });
        container.on('pointerdown', onClick);
        return container;
    }

    showHowToPlayModal() {
        const { width, height } = this.scale;
        const modalContainer = this.add.container(width / 2, height / 2).setDepth(100);
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setInteractive();
        const box = this.add.rectangle(0, 0, 520, 340, 0x0d0221, 0.95).setStrokeStyle(3, 0xffd700);
        const title = this.add.text(0, -130, "📜 วิธีการเล่น & กติกา", { font: "bold 22px Arial", fill: "#ffd700" }).setOrigin(0.5);
        
        const rulesText = 
            "1. [SPACEBAR] ค้นหาชั้นหนังสือเพื่ออ่านคำใบ้และคาถา\n\n" +
            "2. [SPACEBAR] หมุนรูปปั้นมังกรตามองศาคำใบ้เพื่อปลดล็อก [ไฟแช็ก]\n\n" +
            "3. [SPACEBAR] จุดคบเพลิงเรียงตามลำดับคำใบ้ของยาม NPC\n\n" +
            "4. เปิดหีบสมบัติแล้วก้าวเข้าสู่ [ประตูมิติโบราณ] เพื่อจบด่าน!";

        const content = this.add.text(0, -10, rulesText, { font: "15px Arial", fill: "#ffffff", lineSpacing: 4, wordWrap: { width: 460 } }).setOrigin(0.5);
        const closeBtnText = this.add.text(0, 125, "[ คลิกที่ใดก็ได้เพื่อปิดหน้าต่าง ]", { font: "13px monospace", fill: "#4cc9f0" }).setOrigin(0.5);

        modalContainer.add([overlay, box, title, content, closeBtnText]);
        overlay.on('pointerdown', () => { this.playSFX('click'); modalContainer.destroy(); });
    }

    playSFX(type) {
        try {
            const ctx = this.sound.context; if (!ctx) return;
            const now = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(700, now); osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } catch (e) {}
    }
}