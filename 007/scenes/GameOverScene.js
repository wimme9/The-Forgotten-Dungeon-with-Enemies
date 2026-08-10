export default class GameOverScene extends Phaser.Scene {

    constructor() {
        super("GameOverScene");
        this.audioCtx = null;
    }

    create() {
        const W = this.scale.width || 900;
        const H = this.scale.height || 650;
        const cx = W / 2;

        // ---------- พื้นหลังมืดสนิท ไล่เฉดแดงเลือดหมู ----------
        this.generateBgTexture(W, H);
        this.add.image(cx, H / 2, 'goverBg').setDisplaySize(W, H).setDepth(-3);

        // ---------- หมอกดำหมุนวน ----------
        this.generateFogTexture();
        const fog1 = this.add.tileSprite(cx, H / 2, W, H, 'goverFog').setAlpha(0.18).setDepth(-2);
        const fog2 = this.add.tileSprite(cx, H / 2, W, H, 'goverFog').setAlpha(0.12).setDepth(-2).setScale(1.5);
        this.tweens.add({ targets: fog1, tilePositionX: 260, duration: 30000, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: fog2, tilePositionX: -200, duration: 45000, repeat: -1, ease: 'Linear' });

        // ---------- ผงเถ้าดำลอยลง ----------
        this.generateAshTexture();
        const ash = this.add.particles(cx, -10, 'goverAsh', {
            x: { min: 0, max: W },
            y: 0,
            lifespan: 6000,
            speedY: { min: 10, max: 30 },
            speedX: { min: -8, max: 8 },
            scale: { start: 0.5, end: 0.1 },
            alpha: { start: 0.5, end: 0 },
            frequency: 130
        });
        ash.setDepth(-1);

        // ---------- วิญเญตสีแดงกดดันขอบจอ ----------
        const vgfx = this.add.graphics().setDepth(0.2);
        vgfx.fillStyle(0x330000, 0.0);
        for (let i = 0; i < 40; i++) {
            const a = (i / 40) * 0.012;
            vgfx.lineStyle(6, 0x220000, a);
            vgfx.strokeRect(i * 4, i * 3, W - i * 8, H - i * 6);
        }

        // ---------- แสงคบเพลิงที่ดับลงกระพริบริบหรี่ ----------
        this.generateEmberTexture();
        [cx - 260, cx + 260].forEach(x => {
            const g = this.add.particles(x, H - 120, 'goverEmber', {
                speed: { min: 4, max: 14 },
                angle: { min: 260, max: 280 },
                lifespan: { min: 700, max: 1300 },
                scale: { start: 0.4, end: 0 },
                alpha: { start: 0.35, end: 0 },
                frequency: 500,
                blendMode: 'ADD'
            });
            g.setDepth(0.3);
        });

        // ---------- ไอคอนตาที่ปิดลง / หลงทาง ----------
        this.drawLostEye(cx, 175);

        // ---------- หัวข้อ GAME OVER ----------
        const title = this.add.text(cx, 260, "หลงทางในความมืด", {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "46px",
            fontStyle: "bold",
            color: "#b23a3a",
            stroke: "#1a0505",
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(1);

        this.tweens.add({
            targets: title,
            alpha: { from: 0.7, to: 1 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(cx, 305, "GAME OVER", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "14px",
            color: "#7a5555",
            letterSpacing: 6
        }).setOrigin(0.5).setDepth(1);

        // ---------- อธิบายเงื่อนไขการแพ้ ----------
        const explainBox = this.add.graphics().setDepth(0.8);
        explainBox.fillStyle(0x000000, 0.4);
        explainBox.fillRoundedRect(cx - 300, 335, 600, 90, 10);
        explainBox.lineStyle(1, 0x5a2a2a, 0.7);
        explainBox.strokeRoundedRect(cx - 300, 335, 600, 90, 10);

        this.add.text(cx, 362,
            "แสงแห่งสติของเจ้าดับลงจนหมดสิ้น",
            {
                fontFamily: "Tahoma, sans-serif",
                fontSize: "18px",
                color: "#e0b8b8"
            }
        ).setOrigin(0.5).setDepth(1);

        this.add.text(cx, 392,
            "การอยู่ในความมืดนานเกินไป โดนกับดักในหีบ หรือจุดคบเพลิงผิดลำดับซ้ำๆ\nล้วนทำให้แสงแห่งสติลดลง — ไขปริศนาให้เร็วและแม่นยำในครั้งหน้า",
            {
                fontFamily: "Tahoma, sans-serif",
                fontSize: "13px",
                color: "#b89a9a",
                align: "center",
                lineSpacing: 4
            }
        ).setOrigin(0.5).setDepth(1);

        // ---------- ปุ่ม ----------
        this.createDarkButton(cx - 130, 470, "ลองใหม่อีกครั้ง", () => {
            this.sfxClick();
            this.cameras.main.flash(200, 120, 30, 30);
            this.time.delayedCall(150, () => this.scene.start("GameplayScene"));
        }, 220, 52, '18px', 0x4a1f1f, 0x6b2b2b);

        this.createDarkButton(cx + 130, 470, "กลับสู่เมนูหลัก", () => {
            this.sfxClick();
            this.time.delayedCall(150, () => this.scene.start("MenuScene"));
        }, 220, 52, '18px', 0x2a2430, 0x3d3548);

        // ---------- เสียงหลอนตอนเปิดฉาก ----------
        this.sfxDoom();
    }

    // ================= ลูกเล่นภาพ =================

    drawLostEye(x, y) {
        const gfx = this.add.graphics().setDepth(1);
        gfx.lineStyle(3, 0x8a3a3a, 0.8);
        gfx.strokeCircle(x, y, 34);
        gfx.fillStyle(0x1a0505, 1);
        gfx.fillCircle(x, y, 10);
        gfx.lineStyle(2, 0x5a2222, 0.6);
        gfx.strokeCircle(x, y, 10);

        this.tweens.add({
            targets: gfx,
            scaleY: 0.05,
            duration: 400,
            delay: 900,
            yoyo: true,
            repeat: -1,
            repeatDelay: 2200,
            ease: 'Sine.easeInOut'
        });
    }

    createDarkButton(x, y, label, onClick, w, h, fontSize, fillColor, hoverColor) {
        const gfx = this.add.graphics().setDepth(1.5);
        const drawBase = (fill) => {
            gfx.clear();
            gfx.fillStyle(fill, 1);
            gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            gfx.lineStyle(2, 0x8a5a5a, 0.6);
            gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        drawBase(fillColor);

        const label_ = this.add.text(x, y, label, {
            fontFamily: "Tahoma, sans-serif",
            fontSize,
            fontStyle: 'bold',
            color: "#e0c8c8"
        }).setOrigin(0.5).setDepth(1.6);

        const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(1.7);

        hitZone.on('pointerover', () => {
            drawBase(hoverColor);
            label_.setColor('#ffffff');
            this.tweens.add({ targets: [gfx, label_], scale: 1.04, duration: 120 });
        });
        hitZone.on('pointerout', () => {
            drawBase(fillColor);
            label_.setColor('#e0c8c8');
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
        if (this.textures.exists('goverBg')) return;
        const tex = this.textures.createCanvas('goverBg', w, h);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.4, w * 0.75);
        grad.addColorStop(0, '#2a1414');
        grad.addColorStop(0.5, '#160a0a');
        grad.addColorStop(1, '#050303');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        tex.refresh();
    }

    generateFogTexture() {
        if (this.textures.exists('goverFog')) return;
        const size = 256;
        const tex = this.textures.createCanvas('goverFog', size, size);
        const ctx = tex.getContext();
        for (let i = 0; i < 6; i++) {
            const gx = Math.random() * size;
            const gy = Math.random() * size;
            const r = 60 + Math.random() * 60;
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
            grad.addColorStop(0, 'rgba(40,10,10,0.6)');
            grad.addColorStop(1, 'rgba(40,10,10,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
        }
        tex.refresh();
    }

    generateAshTexture() {
        if (this.textures.exists('goverAsh')) return;
        const size = 8;
        const tex = this.textures.createCanvas('goverAsh', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(120,110,110,0.8)');
        grad.addColorStop(1, 'rgba(120,110,110,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateEmberTexture() {
        if (this.textures.exists('goverEmber')) return;
        const size = 12;
        const tex = this.textures.createCanvas('goverEmber', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(200,90,60,0.9)');
        grad.addColorStop(1, 'rgba(200,90,60,0)');
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
        this.initAudio();
        if (!this.audioCtx) return;
        const { type = 'sine', vol = 0.2, freqEnd = null, delay = 0 } = opts;
        const t0 = this.audioCtx.currentTime + delay;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (freqEnd !== null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
        }
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    sfxDoom() {
        this.tone(90, 1.4, { type: 'sawtooth', vol: 0.18, freqEnd: 30 });
        this.tone(140, 1.0, { type: 'sine', vol: 0.12, freqEnd: 40, delay: 0.2 });
    }

    sfxClick() {
        this.tone(300, 0.09, { type: 'square', vol: 0.14 });
    }
}