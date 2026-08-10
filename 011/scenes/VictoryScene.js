export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super("VictoryScene");
    }

    preload() {
        this.load.json('victoryData', 'data/victoryScene.json');
    }

    // เล่นเสียงคลิกปุ่ม (โหลดไว้แล้วจาก GameplayScene ที่ยังทำงานอยู่เบื้องหลัง)
    playClick() {
        try { this.sound.play('sfx_click_npc'); } catch (e) {}
    }

    create() {
        const data = this.cache.json.get('victoryData');

        // 1. ซ่อน UI ของ GameplayScene เพื่อไม่ให้โชว์ซ้อนด้านล่าง
        const gameplayScene = this.scene.get('GameplayScene');
        if (gameplayScene) {
            gameplayScene.children.list.forEach(child => {
                if (child.scrollFactorX === 0) { // ซ่อนพวก Text UI ที่ล็อกจอไว้
                    child.setVisible(false);
                }
            });
        }

        // 2. พื้นหลังสีดำโปร่งแสง ล็อกติดหน้าจอ (ScrollFactor 0)
        const ov = data.overlay;
        this.add.rectangle(0, 0, ov.width, ov.height, parseInt(ov.color, 16), ov.alpha)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);

        // 3. สร้าง Texture พลุกระดาษ
        if (!this.textures.exists('confetti_particle')) {
            const confettiGfx = this.make.graphics({ x: 0, y: 0, add: false });
            confettiGfx.fillStyle(0xffffff, 1);
            confettiGfx.fillRect(0, 0, 8, 8);
            confettiGfx.generateTexture('confetti_particle', 8, 8);
            confettiGfx.destroy();
        }

        // 4. เอฟเฟกต์พลุกระดาษ (ล็อกติดจอ)
        const cf = data.confetti;
        const confettiColors = cf.colors.map(c => parseInt(c, 16));
        this.add.particles(0, 0, 'confetti_particle', {
            x: { min: 0, max: ov.width }, y: -20, lifespan: cf.lifespan,
            speedY: { min: cf.speedYMin, max: cf.speedYMax }, speedX: { min: cf.speedXMin, max: cf.speedXMax },
            scale: { start: 1, end: 0.4 }, rotate: { start: 0, end: 360 },
            gravityY: cf.gravityY, quantity: cf.quantity, frequency: cf.frequency, tint: confettiColors
        }).setScrollFactor(0).setDepth(1001);

        // 5. ข้อความชนะ (ล็อกติดจอ)
        const t = data.texts;
        let title = this.add.text(t.title.x, t.title.y, t.title.value, {
            fontSize: t.title.fontSize, fontFamily: 'Arial', fontStyle: 'bold',
            color: t.title.color, align: 'center', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setScale(0.1).setScrollFactor(0).setDepth(1002);

        // อนิเมชันเด้งข้อความ
        this.tweens.add({
            targets: title, scale: 1, duration: 800, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({ targets: title, scale: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
        });

        // 6. ปุ่ม Play Again (ล็อกติดจอ)
        let restartBtn = this.add.text(t.restartButton.x, t.restartButton.y, t.restartButton.value, {
            fontSize: t.restartButton.fontSize, fontFamily: 'Arial', color: t.restartButton.color,
            backgroundColor: t.restartButton.backgroundColor, padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1002);

        restartBtn.on('pointerover', () => restartBtn.setBackgroundColor(t.restartButton.hoverColor));
        restartBtn.on('pointerout', () => restartBtn.setBackgroundColor(t.restartButton.backgroundColor));
        restartBtn.on('pointerdown', () => {
            this.playClick();
            this.scene.stop("GameplayScene");
            this.scene.start("GameplayScene");
        });

        // 7. ปุ่ม Main Menu (ล็อกติดจอ)
        let menuBtn = this.add.text(t.menuButton.x, t.menuButton.y, t.menuButton.value, {
            fontSize: t.menuButton.fontSize, fontFamily: 'Arial', color: t.menuButton.color,
            backgroundColor: t.menuButton.backgroundColor, padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1002);

        menuBtn.on('pointerover', () => menuBtn.setBackgroundColor(t.menuButton.hoverColor));
        menuBtn.on('pointerout', () => menuBtn.setBackgroundColor(t.menuButton.backgroundColor));
        menuBtn.on('pointerdown', () => {
            this.playClick();
            this.scene.stop("GameplayScene");
            this.scene.start("MenuScene");
        });
    }
}
