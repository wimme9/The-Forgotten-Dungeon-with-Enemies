export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {
        this.load.json('menuData', 'data/menuScene.json');
        this.load.once('filecomplete-json-menuData', () => {
            const data = this.cache.json.get('menuData');
            if (!this.cache.audio.exists(data.audio.key)) {
                this.load.audio(data.audio.key, data.audio.path);
            }
            this.load.start();
        });
    }

    // เล่นเสียงคลิกปุ่ม ใช้ร่วมกันทุกปุ่มในหน้านี้
    playClick() {
        try { this.sound.play('sfx_click_npc'); } catch (e) {}
    }

    create() {
        const data = this.cache.json.get('menuData');

        // พื้นหลังสีเขียวสนามฟุตบอล
        this.add.rectangle(0, 0, data.background.width, data.background.height, parseInt(data.background.color, 16)).setOrigin(0, 0);

        // เส้นสนาม (ตกแต่ง)
        const circleCfg = data.field.centerCircle;
        this.add.circle(circleCfg.x, circleCfg.y, circleCfg.radius, parseInt(data.background.color, 16))
            .setStrokeStyle(5, parseInt(circleCfg.strokeColor, 16), circleCfg.strokeAlpha);

        const lineCfg = data.field.centerLine;
        this.add.line(0, 0, lineCfg.x1, lineCfg.y1, lineCfg.x2, lineCfg.y2, parseInt(lineCfg.color, 16), lineCfg.alpha).setOrigin(0, 0);

        const borderCfg = data.field.border;
        this.add.rectangle(borderCfg.x, borderCfg.y, borderCfg.width, borderCfg.height)
            .setStrokeStyle(2, parseInt(borderCfg.strokeColor, 16), borderCfg.strokeAlpha);

        // ธงมุมสนามตกแต่ง 4 มุม
        data.cornerFlags.forEach(pos => this.drawCornerFlag(pos.x, pos.y, data.cornerFlagStyle));

        // ชื่อเกม
        const t = data.texts;
        this.add.text(t.title.x, t.title.y, t.title.value, {
            fontSize: t.title.fontSize,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: t.title.color,
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
        }).setOrigin(0.5);

        this.add.text(t.subtitle.x, t.subtitle.y, t.subtitle.value, {
            fontSize: t.subtitle.fontSize, fontFamily: 'Arial', color: t.subtitle.color
        }).setOrigin(0.5);

        // คำอธิบายการเล่น
        this.add.text(t.description.x, t.description.y, t.description.value, {
            fontSize: t.description.fontSize, fontFamily: 'Arial', fontStyle: 'bold', color: t.description.color
        }).setOrigin(0.5);

        this.add.text(t.quote.x, t.quote.y, t.quote.value, {
            fontSize: t.quote.fontSize, fontFamily: 'Arial', color: t.quote.color, fontStyle: 'italic'
        }).setOrigin(0.5);

        // ถ้วยรางวัลตกแต่งกลางจอ
        this.add.text(t.trophyEmoji.x, t.trophyEmoji.y, t.trophyEmoji.value, { fontSize: t.trophyEmoji.fontSize }).setOrigin(0.5).setAlpha(0.9);

        // ปุ่ม Start Game
        let startBtn = this.add.text(t.startButton.x, t.startButton.y, t.startButton.value, {
            fontSize: t.startButton.fontSize,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: t.startButton.color,
            backgroundColor: t.startButton.backgroundColor,
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // เอฟเฟกต์ตอนชี้ปุ่ม
        startBtn.on('pointerover', () => startBtn.setBackgroundColor(t.startButton.hoverColor));
        startBtn.on('pointerout', () => startBtn.setBackgroundColor(t.startButton.backgroundColor));
        startBtn.on('pointerdown', () => {
            this.playClick();
            this.scene.start("GameplayScene");
        });

        // คำแนะนำการควบคุมและกฎกติกา
        this.add.text(t.controlsHint.x, t.controlsHint.y, t.controlsHint.value, {
            fontSize: t.controlsHint.fontSize, fontFamily: 'Arial', color: t.controlsHint.color
        }).setOrigin(0.5);

        this.add.text(t.limitsHint.x, t.limitsHint.y, t.limitsHint.value, {
            fontSize: t.limitsHint.fontSize, fontFamily: 'Arial', color: t.limitsHint.color
        }).setOrigin(0.5);
    }

    // วาดธงมุมสนามเล็กๆ ไว้ตกแต่ง 4 มุมของหน้าเมนู
    drawCornerFlag(x, y, style) {
        this.add.rectangle(x, y, 4, 44, parseInt(style.poleColor, 16), style.poleAlpha).setOrigin(0.5, 1);
        const flag = this.add.graphics();
        flag.fillStyle(parseInt(style.flagColor, 16), style.flagAlpha);
        flag.beginPath();
        flag.moveTo(x, y - 44);
        flag.lineTo(x + 22, y - 36);
        flag.lineTo(x, y - 28);
        flag.closePath();
        flag.fillPath();
    }
}
