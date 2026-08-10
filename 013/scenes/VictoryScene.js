export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super("VictoryScene");
    }

    create() {
        const { width, height } = this.scale;

        // 🎬 อนิเมชันเปิดหน้าจอ Fade In
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.add.rectangle(width / 2, height / 2, width, height, 0x0b090a, 0.85);

        // ละอองเฉลิมฉลอง
        this.add.particles(width / 2, height / 2 - 50, 'bookAsset', {
            speed: { min: 80, max: 220 }, angle: { min: 0, max: 360 }, scale: { start: 0.04, end: 0 },
            blendMode: 'ADD', lifespan: 1500, frequency: 80, tint: [0xffd700, 0x00ffff, 0xff007f]
        });

        const box = this.add.rectangle(width / 2, height / 2, 480, 340, 0x0d0221, 0.95).setStrokeStyle(3, 0xffd700);
        const title = this.add.text(width / 2, height / 2 - 115, "🏆 VICTORY! 🏆", { font: "bold 34px Arial", fill: "#ffd700", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5);

        this.tweens.add({ targets: title, scaleX: 1.06, scaleY: 1.06, duration: 900, yoyo: true, repeat: -1 });

        this.add.text(width / 2, height / 2 - 40, "ยินดีด้วย! คุณสามารถไขปริศนาดันเจี้ยน\nและครอบครองขุมทรัพย์โบราณสำเร็จ!", { font: "bold 16px Arial", fill: "#ffffff", align: "center", lineSpacing: 6 }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 15, "💰 +5000 GOLD  |  ✨ DUNGEON CLEARED", { font: "bold 14px monospace", fill: "#00ff66" }).setOrigin(0.5);

        this.createButton(width / 2, height / 2 + 65, "🔄 เล่นอีกครั้ง (PLAY AGAIN)", 0x3a0ca3, () => {
            this.playSFX('click'); this.transitionTo("GameplayScene");
        });

        this.createButton(width / 2, height / 2 + 120, "🏠 หน้าหลัก (MAIN MENU)", 0x240046, () => {
            this.playSFX('click'); this.transitionTo("MenuScene");
        });
    }

    transitionTo(targetScene) {
        this.cameras.main.fade(400, 0, 0, 0, false, (cam, progress) => {
            if (progress === 1) { this.scene.stop("GameplayScene"); this.scene.stop(); this.scene.start(targetScene); }
        });
    }

    createButton(x, y, label, colorHex, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const draw = (fill, stroke) => {
            bg.clear(); bg.fillStyle(stroke, 1); bg.fillRoundedRect(-142, -20, 284, 40, 10);
            bg.fillStyle(fill, 1); bg.fillRoundedRect(-140, -18, 280, 36, 8);
        };
        draw(colorHex, 0xffd700);

        const txt = this.add.text(0, 0, label, { font: "bold 14px Arial", fill: "#ffffff" }).setOrigin(0.5);
        container.add([bg, txt]);

        container.setInteractive(new Phaser.Geom.Rectangle(-140, -18, 280, 36), Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => { draw(0xffd700, 0x3a0ca3); txt.setStyle({ fill: "#000000" }); this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
        container.on('pointerout', () => { draw(colorHex, 0xffd700); txt.setStyle({ fill: "#ffffff" }); this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 100 }); });
        container.on('pointerdown', onClick);
    }

    playSFX(type) {
        try {
            const ctx = this.sound.context; if (!ctx) return;
            const now = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(700, now);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } catch (e) {}
    }
}