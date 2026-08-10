export default class DefeatScene extends Phaser.Scene {
    constructor() {
        super("DefeatScene");
    }

    create() {
        const { width, height } = this.scale;

        // 🎬 อนิเมชันเปิดหน้าจอ Fade In
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.add.rectangle(width / 2, height / 2, width, height, 0x1a0000, 0.85);

        const box = this.add.rectangle(width / 2, height / 2, 460, 320, 0x0d0221, 0.95).setStrokeStyle(3, 0xd00000);
        const title = this.add.text(width / 2, height / 2 - 110, "☠️ GAME OVER ☠️", { font: "bold 32px Arial", fill: "#ff0055", stroke: "#000", strokeThickness: 5 }).setOrigin(0.5);

        this.tweens.add({ targets: title, scaleX: 1.08, scaleY: 1.08, duration: 800, yoyo: true, repeat: -1 });

        this.add.text(width / 2, height / 2 - 40, "หมดเวลาแล้ว! คุณไม่สามารถไขปริศนา\nแห่งดันเจี้ยนได้ทันเวลา...", { font: "16px Arial", fill: "#cccccc", align: "center", lineSpacing: 6 }).setOrigin(0.5);

        this.createButton(width / 2, height / 2 + 35, "🔄 ลองใหม่อีกครั้ง (TRY AGAIN)", 0xd00000, () => {
            this.playSFX('click'); this.transitionTo("GameplayScene");
        });

        this.createButton(width / 2, height / 2 + 100, "🏠 หน้าหลัก (MAIN MENU)", 0x370617, () => {
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
            bg.clear(); bg.fillStyle(stroke, 1); bg.fillRoundedRect(-142, -22, 284, 44, 10);
            bg.fillStyle(fill, 1); bg.fillRoundedRect(-140, -20, 280, 40, 8);
        };
        draw(colorHex, 0xff0055);

        const txt = this.add.text(0, 0, label, { font: "bold 15px Arial", fill: "#ffffff" }).setOrigin(0.5);
        container.add([bg, txt]);

        container.setInteractive(new Phaser.Geom.Rectangle(-140, -20, 280, 40), Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => { draw(0xffd700, 0xd00000); txt.setStyle({ fill: "#000000" }); this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
        container.on('pointerout', () => { draw(colorHex, 0xff0055); txt.setStyle({ fill: "#ffffff" }); this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 100 }); });
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