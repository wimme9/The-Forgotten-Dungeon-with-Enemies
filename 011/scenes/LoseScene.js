export default class LoseScene extends Phaser.Scene {
    constructor() {
        super("LoseScene");
    }

    // รับสาเหตุที่แพ้มาจาก GameplayScene: 'time' หรือ 'hearts'
    init(data) {
        this.reason = (data && data.reason) || 'time';
    }

    preload() {
        this.load.json('loseData', 'data/loseScene.json');
    }

    // เล่นเสียงคลิกปุ่ม (โหลดไว้แล้วจาก GameplayScene ที่ยังทำงานอยู่เบื้องหลัง)
    playClick() {
        try { this.sound.play('sfx_click_npc'); } catch (e) {}
    }

    create() {
        const data = this.cache.json.get('loseData');

        // 1. ซ่อน UI ของ GameplayScene ที่ล็อกจอไว้ ไม่ให้โชว์ซ้อนด้านล่าง
        const gameplayScene = this.scene.get('GameplayScene');
        if (gameplayScene) {
            gameplayScene.children.list.forEach(child => {
                if (child.scrollFactorX === 0) {
                    child.setVisible(false);
                }
            });
        }

        // 2. พื้นหลังแดงเข้มโปร่งแสง ล็อกติดหน้าจอ
        const ov = data.overlay;
        this.add.rectangle(0, 0, ov.width, ov.height, parseInt(ov.color, 16), ov.alpha)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);

        // 3. เส้นสนามจางๆ ตกแต่งธีมฟุตบอลโลก (แดงหม่น)
        const ring = this.add.graphics().setScrollFactor(0).setDepth(1000);
        const ringCfg = data.decor.ring;
        ring.lineStyle(ringCfg.lineWidth, parseInt(ringCfg.color, 16), ringCfg.alpha);
        ring.strokeCircle(ringCfg.x, ringCfg.y, ringCfg.radius);

        const borderCfg = data.decor.border;
        ring.lineStyle(borderCfg.lineWidth, parseInt(borderCfg.color, 16), borderCfg.alpha);
        ring.strokeRect(borderCfg.x, borderCfg.y, borderCfg.width, borderCfg.height);

        // 4. หัวข้อแพ้
        const t = data.texts;
        this.add.text(t.title.x, t.title.y, t.title.value, {
            fontSize: t.title.fontSize, fontFamily: 'Arial', fontStyle: 'bold',
            color: t.title.color, stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

        // 5. ข้อความสาเหตุ ขึ้นอยู่กับว่าแพ้เพราะอะไร
        const reasonText = data.reasonTexts[this.reason] || data.reasonTexts.time;

        this.add.text(t.reason.x, t.reason.y, reasonText, {
            fontSize: t.reason.fontSize, fontFamily: 'Arial', color: t.reason.color, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

        this.add.text(t.encouragement.x, t.encouragement.y, t.encouragement.value, {
            fontSize: t.encouragement.fontSize, fontFamily: 'Arial', color: t.encouragement.color
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

        // 6. ปุ่ม ลองใหม่
        let retryBtn = this.add.text(t.retryButton.x, t.retryButton.y, t.retryButton.value, {
            fontSize: t.retryButton.fontSize, fontFamily: 'Arial', color: t.retryButton.color,
            backgroundColor: t.retryButton.backgroundColor, padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1002);

        retryBtn.on('pointerover', () => retryBtn.setBackgroundColor(t.retryButton.hoverColor));
        retryBtn.on('pointerout', () => retryBtn.setBackgroundColor(t.retryButton.backgroundColor));
        retryBtn.on('pointerdown', () => {
            this.playClick();
            this.scene.stop("GameplayScene");
            this.scene.start("GameplayScene");
        });

        // 7. ปุ่ม กลับหน้าหลัก
        let menuBtn = this.add.text(t.menuButton.x, t.menuButton.y, t.menuButton.value, {
            fontSize: t.menuButton.fontSize, fontFamily: 'Arial', color: t.menuButton.color,
            backgroundColor: t.menuButton.backgroundColor, padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1002);

        menuBtn.on('pointerover', () => menuBtn.setBackgroundColor(t.menuButton.hoverColor));
        menuBtn.on('pointerout', () => menuBtn.setBackgroundColor(t.menuButton.backgroundColor));
        menuBtn.on('pointerdown', () => {
            this.playClick();
            this.time.delayedCall(150, () => {
                this.sound.stopAll();
                this.scene.stop("GameplayScene");
                this.scene.start("MenuScene");
            });
        });
    }
}
