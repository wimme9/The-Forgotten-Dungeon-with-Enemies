export default class VictoryScene extends Phaser.Scene {

    constructor() {
        super("VictoryScene");
        this.audioCtx = null;
    }

    create() {
        const W = this.scale.width || 900;
        const H = this.scale.height || 650;
        const cx = W / 2;

        // ---------- พื้นหลังไล่เฉดทองอบอุ่น ----------
        this.generateBgTexture(W, H);
        this.add.image(cx, H / 2, 'victoryBg').setDisplaySize(W, H).setDepth(-3);

        // ---------- ลำแสงจากด้านบน (ทางออกจากถ้ำ) ----------
        this.generateBeamTexture();
        for (let i = -1; i <= 1; i++) {
            const beam = this.add.image(cx + i * 90, 0, 'victoryBeam')
                .setOrigin(0.5, 0)
                .setAlpha(0.35)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(-2)
                .setScale(1.4, 3);
            this.tweens.add({
                targets: beam,
                alpha: { from: 0.2, to: 0.45 },
                duration: 1400 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ---------- ประกายทองลอยฟุ้ง ----------
        this.generateSparkleTexture();
        const sparkles = this.add.particles(cx, H / 2, 'victorySparkle', {
            x: { min: 0, max: W },
            y: { min: 0, max: H },
            lifespan: 2200,
            speedY: { min: -20, max: -6 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.9, end: 0 },
            frequency: 90,
            tint: [0xffe08a, 0xffd27a, 0xfff2c2],
            blendMode: 'ADD'
        });
        sparkles.setDepth(0.5);

        // ---------- แสงระเบิดฉลองตอนเริ่มฉาก ----------
        this.time.delayedCall(150, () => this.celebrationBurst(cx, 260));
        this.time.delayedCall(500, () => this.celebrationBurst(cx - 180, 340));
        this.time.delayedCall(750, () => this.celebrationBurst(cx + 180, 340));

        // ---------- กรอบตกแต่ง ----------
        const frame = this.add.graphics().setDepth(0.8);
        frame.lineStyle(3, 0xffd27a, 0.55);
        frame.strokeRoundedRect(cx - 300, 100, 600, 260, 16);
        frame.lineStyle(1, 0xfff2c2, 0.3);
        frame.strokeRoundedRect(cx - 292, 108, 584, 244, 12);

        // ---------- ไอคอนกุญแจไขว้ (สื่อถึงการหนีสำเร็จ) ----------
        this.drawKeyIcon(cx, 150);

        // ---------- ข้อความ VICTORY ----------
        const title = this.add.text(cx, 220, "VICTORY!", {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "62px",
            fontStyle: "bold",
            color: "#ffe08a",
            stroke: "#5c3a10",
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(1);

        this.tweens.add({
            targets: title,
            scale: { from: 1, to: 1.04 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(cx, 275, "เจ้าหนีออกจากดันเจี้ยนที่ถูกลืมได้สำเร็จ!", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "20px",
            color: "#f3e6c8"
        }).setOrigin(0.5).setDepth(1);

        this.add.text(cx, 305, "ปริศนาทั้งหมดถูกไข... แสงแห่งสติของเจ้ายังคงลุกโชนอยู่", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "14px",
            fontStyle: "italic",
            color: "#c9b98a"
        }).setOrigin(0.5).setDepth(1);

        // ---------- ปุ่ม BACK TO MENU ----------
        this.createGoldButton(cx, 400, "กลับสู่เมนูหลัก", () => {
            this.sfxClick();
            this.cameras.main.flash(200, 255, 235, 180);
            this.time.delayedCall(150, () => this.scene.start("MenuScene"));
        }, 260, 54, '22px');

        // ---------- เสียงแฟนแฟร์ฉลองชัยชนะ ----------
        this.sfxFanfare();
    }

    // ================= ลูกเล่นภาพ =================

    celebrationBurst(x, y) {
        const emitter = this.add.particles(x, y, 'victorySparkle', {
            speed: { min: 80, max: 220 },
            angle: { min: 0, max: 360 },
            lifespan: { min: 500, max: 900 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffe08a, 0xffffff, 0xffd27a],
            blendMode: 'ADD'
        }).setDepth(2);
        emitter.explode(28, x, y);
        this.time.delayedCall(1000, () => emitter.destroy());
    }

    drawKeyIcon(x, y) {
        const gfx = this.add.graphics().setDepth(1);
        gfx.lineStyle(5, 0xffd27a, 1);
        gfx.strokeCircle(x - 16, y, 14);
        gfx.lineBetween(x - 2, y, x + 26, y);
        gfx.lineBetween(x + 18, y, x + 18, y + 10);
        gfx.lineBetween(x + 26, y, x + 26, y + 10);

        const container = this.add.container(x, y, []);
        this.tweens.add({
            targets: gfx,
            angle: { from: -6, to: 6 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createGoldButton(x, y, label, onClick, w, h, fontSize) {
        const gfx = this.add.graphics().setDepth(2);
        const drawBase = (fill) => {
            gfx.clear();
            gfx.fillStyle(fill, 1);
            gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
            gfx.lineStyle(2, 0xfff2c2, 0.85);
            gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        };
        drawBase(0x6b4a1f);

        const label_ = this.add.text(x, y, label, {
            fontFamily: "Tahoma, sans-serif",
            fontSize,
            fontStyle: 'bold',
            color: "#fff2c2"
        }).setOrigin(0.5).setDepth(2.1);

        const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(2.2);

        hitZone.on('pointerover', () => {
            drawBase(0x8a6428);
            label_.setColor('#ffffff');
            this.tweens.add({ targets: [gfx, label_], scale: 1.05, duration: 120 });
        });
        hitZone.on('pointerout', () => {
            drawBase(0x6b4a1f);
            label_.setColor('#fff2c2');
            this.tweens.add({ targets: [gfx, label_], scale: 1, duration: 120 });
        });
        hitZone.on('pointerdown', () => {
            this.tweens.add({ targets: [gfx, label_], scale: 0.95, duration: 60, yoyo: true });
            onClick();
        });

        return { gfx, label: label_, hitZone };
    }

    // ================= Texture แบบ procedural =================

    generateBgTexture(w, h) {
        if (this.textures.exists('victoryBg')) return;
        const tex = this.textures.createCanvas('victoryBg', w, h);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(w / 2, h * 0.3, 30, w / 2, h * 0.3, w * 0.8);
        grad.addColorStop(0, '#4a3a24');
        grad.addColorStop(0.45, '#28201a');
        grad.addColorStop(1, '#100d0a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        tex.refresh();
    }

    generateBeamTexture() {
        if (this.textures.exists('victoryBeam')) return;
        const w = 70, h = 300;
        const tex = this.textures.createCanvas('victoryBeam', w, h);
        const ctx = tex.getContext();
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(255,235,180,0.5)');
        grad.addColorStop(1, 'rgba(255,235,180,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 - 8, 0);
        ctx.lineTo(w * 0.5 + 8, 0);
        ctx.lineTo(w * 0.5 + 30, h);
        ctx.lineTo(w * 0.5 - 30, h);
        ctx.closePath();
        ctx.fill();
        tex.refresh();
    }

    generateSparkleTexture() {
        if (this.textures.exists('victorySparkle')) return;
        const size = 14;
        const tex = this.textures.createCanvas('victorySparkle', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,240,200,1)');
        grad.addColorStop(0.5, 'rgba(255,210,120,0.8)');
        grad.addColorStop(1, 'rgba(255,180,60,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    // ================= เสียง (Web Audio synth) =================

    initAudio() {
        if (this.audioCtx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.audioCtx = new AC();
    }

    tone(freq, duration, opts = {}) {
        if (!this.audioCtx) return;
        const { type = 'triangle', vol = 0.2, delay = 0 } = opts;
        const t0 = this.audioCtx.currentTime + delay;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    sfxFanfare() {
        this.initAudio();
        if (!this.audioCtx) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
            this.tone(f, 0.3, { vol: 0.22, delay: i * 0.16 })
        );
    }

    sfxClick() {
        this.initAudio();
        this.tone(600, 0.08, { type: 'square', vol: 0.15 });
    }
}