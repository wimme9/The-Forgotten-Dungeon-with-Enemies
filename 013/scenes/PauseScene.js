export default class PauseScene extends Phaser.Scene {
    constructor() {
        super("PauseScene");
    }

    create() {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
        this.tweens.add({ targets: overlay, fillAlpha: 0.75, duration: 200 });

        // 🎬 กล่อง Popup เด้งขึ้นมา (Pop-in Animation)
        const popupContainer = this.add.container(width / 2, height / 2).setScale(0);

        const box = this.add.rectangle(0, 0, 420, 320, 0x0d0221, 0.95).setStrokeStyle(3, 0x7b2cbf);
        const title = this.add.text(0, -110, "⏸️ เกมหยุดชั่วคราว", { font: "bold 26px Arial", fill: "#ffd700", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);

        popupContainer.add([box, title]);

        this.tweens.add({ targets: popupContainer, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

        this.createButton(popupContainer, 0, -20, "▶️ เล่นต่อ (RESUME)", 0x7b2cbf, () => {
            this.playSFX('click');
            this.tweens.add({
                targets: popupContainer, scaleX: 0, scaleY: 0, duration: 200, ease: 'Back.easeIn',
                onComplete: () => { this.scene.stop(); this.scene.resume("GameplayScene"); }
            });
        });

        this.createButton(popupContainer, 0, 45, "🔄 เริ่มเล่นใหม่ (RESTART)", 0x3a0ca3, () => {
            this.playSFX('click'); this.transitionTo("GameplayScene");
        });

        this.createButton(popupContainer, 0, 110, "🏠 หน้าหลัก (MAIN MENU)", 0x240046, () => {
            this.playSFX('click'); this.transitionTo("MenuScene");
        });
    }

    transitionTo(targetScene) {
        this.cameras.main.fade(400, 0, 0, 0, false, (cam, progress) => {
            if (progress === 1) {
                this.scene.stop("GameplayScene"); this.scene.stop(); this.scene.start(targetScene);
            }
        });
    }

    createButton(parentContainer, x, y, label, colorHex, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const draw = (fill, stroke) => {
            bg.clear(); bg.fillStyle(stroke, 1); bg.fillRoundedRect(-142, -22, 284, 44, 10);
            bg.fillStyle(fill, 1); bg.fillRoundedRect(-140, -20, 280, 40, 8);
        };
        draw(colorHex, 0x9d4edd);

        const txt = this.add.text(0, 0, label, { font: "bold 15px Arial", fill: "#ffffff" }).setOrigin(0.5);
        container.add([bg, txt]);

        container.setInteractive(new Phaser.Geom.Rectangle(-140, -20, 280, 40), Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => { draw(0xffd700, 0x7b2cbf); txt.setStyle({ fill: "#000000" }); this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
        container.on('pointerout', () => { draw(colorHex, 0x9d4edd); txt.setStyle({ fill: "#ffffff" }); this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 100 }); });
        container.on('pointerdown', onClick);
        parentContainer.add(container);
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