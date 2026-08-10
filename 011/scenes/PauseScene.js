export default class PauseScene extends Phaser.Scene {
    constructor() {
        super("PauseScene");
    }

    preload() {
        this.load.json('pauseData', 'data/pauseScene.json');
    }

    // เล่นเสียงคลิกปุ่ม (โหลดไว้แล้วจาก GameplayScene ที่ยังทำงานอยู่เบื้องหลัง)
    playClick() {
        try { this.sound.play('sfx_click_npc'); } catch (e) {}
    }

    create() {
        const data = this.cache.json.get('pauseData');

        // พื้นหลังโปร่งแสงสีดำ
        const ov = data.overlay;
        this.add.rectangle(0, 0, ov.width, ov.height, parseInt(ov.color, 16), ov.alpha).setOrigin(0, 0);

        // กล่องเมนู
        const b = data.box;
        const box = this.add.rectangle(b.x, b.y, b.width, b.height, parseInt(b.color, 16), b.alpha);
        box.setStrokeStyle(b.strokeWidth, parseInt(b.strokeColor, 16));

        // ลายเส้นสนามจางๆ ตกแต่งด้านหลังกล่อง
        const dc = data.decorCircle;
        this.add.circle(dc.x, dc.y, dc.radius, parseInt(dc.color, 16), dc.alpha);

        const t = data.texts;
        this.add.text(t.title.x, t.title.y, t.title.value, {
            fontSize: t.title.fontSize, fontFamily: "Arial", fontStyle: "bold", color: t.title.color,
            stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        // ปุ่ม RESUME
        let resumeButton = this.add.text(t.resumeButton.x, t.resumeButton.y, t.resumeButton.value, {
            fontSize: t.resumeButton.fontSize, fontFamily: "Arial", color: t.resumeButton.color,
            backgroundColor: t.resumeButton.backgroundColor, padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeButton.on("pointerover", () => resumeButton.setBackgroundColor(t.resumeButton.hoverColor));
        resumeButton.on("pointerout", () => resumeButton.setBackgroundColor(t.resumeButton.backgroundColor));
        resumeButton.on("pointerdown", () => {
            this.playClick();
            this.scene.stop();
            const gameplay = this.scene.get("GameplayScene");
            if (gameplay && gameplay.resumeAudio) gameplay.resumeAudio();
            this.scene.resume("GameplayScene");
        });

        // ปุ่มออกไปหน้าเมนู
        let quitButton = this.add.text(t.quitButton.x, t.quitButton.y, t.quitButton.value, {
            fontSize: t.quitButton.fontSize, fontFamily: "Arial", color: t.quitButton.color,
            backgroundColor: t.quitButton.backgroundColor, padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        quitButton.on("pointerover", () => quitButton.setBackgroundColor(t.quitButton.hoverColor));
        quitButton.on("pointerout", () => quitButton.setBackgroundColor(t.quitButton.backgroundColor));
        quitButton.on("pointerdown", () => {
            this.playClick();
            this.time.delayedCall(150, () => {
                this.sound.stopAll();
                this.scene.stop("GameplayScene");
                this.scene.start("MenuScene");
            });
        });
    }
}
