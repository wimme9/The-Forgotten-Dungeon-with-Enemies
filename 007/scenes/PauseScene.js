export default class PauseScene extends Phaser.Scene {

    constructor() {
        super("PauseScene");
        this.audioCtx = null;
    }

    create() {
        const W = this.scale.width || 900;
        const H = this.scale.height || 650;
        const cx = W / 2;
        const cy = H / 2;

        // ---------- ม่านมืดปกคลุมฉากเกม ----------
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.72).setScrollFactor(0).setDepth(30);

        // ---------- แผ่นหินตรงกลาง ----------
        const panelW = 420;
        const panelH = 300;
        const panel = this.add.graphics().setScrollFactor(0).setDepth(31);
        panel.fillStyle(0x1c1620, 0.92);
        panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);
        panel.lineStyle(3, 0x6a5a3a, 0.7);
        panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);
        panel.lineStyle(1, 0xffd27a, 0.25);
        panel.strokeRoundedRect(cx - panelW / 2 + 6, cy - panelH / 2 + 6, panelW - 12, panelH - 12, 12);

        // ---------- ไอคอนคบเพลิงตกแต่งหัวข้อ ----------
        this.generateGlowTexture();
        const glowL = this.add.image(cx - 140, cy - panelH / 2 + 14, 'pauseGlow')
            .setScale(0.4).setDepth(31.5).setBlendMode(Phaser.BlendModes.ADD);
        const glowR = this.add.image(cx + 140, cy - panelH / 2 + 14, 'pauseGlow')
            .setScale(0.4).setDepth(31.5).setBlendMode(Phaser.BlendModes.ADD);
        [glowL, glowR].forEach(g => {
            this.tweens.add({
                targets: g,
                scale: { from: 0.32, to: 0.46 },
                alpha: { from: 0.7, to: 1 },
                duration: 650,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // ---------- ข้อความ PAUSED ----------
        this.add.text(cx, cy - 95, "หยุดชั่วคราว", {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "34px",
            fontStyle: "bold",
            color: "#ffd27a",
            stroke: "#2a1608",
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(32);

        this.add.text(cx, cy - 60, "PAUSED", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "13px",
            color: "#8f8264",
            letterSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(32);

        // ---------- เส้นแบ่ง ----------
        const divider = this.add.graphics().setScrollFactor(0).setDepth(32);
        divider.lineStyle(1, 0x6a5a3a, 0.6);
        divider.lineBetween(cx - 150, cy - 32, cx + 150, cy - 32);

        // ---------- ปุ่ม RESUME ----------
        this.createStoneButton(cx, cy + 10, "เล่นต่อ", () => {
            this.sfxClick();
            this.scene.stop();
            this.scene.resume("GameplayScene");
        }, 240, 50, '22px', 0x2c4a33, 0x3f6b4a);

        // ---------- ปุ่มกลับเมนูหลัก ----------
        this.createStoneButton(cx, cy + 78, "กลับสู่เมนูหลัก", () => {
            this.sfxClick();
            this.scene.stop();
            this.scene.stop("GameplayScene");
            this.scene.start("MenuScene");
        }, 240, 46, '18px', 0x3a2a1c, 0x53381f);

        // ---------- ผงฝุ่นลอยเบาๆ ----------
        this.generateDustTexture();
        const dust = this.add.particles(cx, cy, 'pauseDust', {
            x: { min: -panelW / 2, max: panelW / 2 },
            y: { min: -panelH / 2, max: panelH / 2 },
            lifespan: 3500,
            speedY: { min: -6, max: -2 },
            scale: { start: 0.4, end: 0.05 },
            alpha: { start: 0.25, end: 0 },
            frequency: 400,
            blendMode: 'ADD'
        });
        dust.setScrollFactor(0).setDepth(31.8);
    }

    createStoneButton(x, y, label, onClick, w, h, fontSize, fillColor, hoverColor) {
        const gfx = this.add.graphics().setScrollFactor(0).setDepth(32);
        const drawBase = (fill) => {
            gfx.clear();
            gfx.fillStyle(fill, 1);
            gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            gfx.lineStyle(2, 0xffd27a, 0.6);
            gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        drawBase(fillColor);

        const label_ = this.add.text(x, y, label, {
            fontFamily: "Tahoma, sans-serif",
            fontSize,
            fontStyle: 'bold',
            color: "#ffe08a"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(32.1);

        const hitZone = this.add.zone(x, y, w, h)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0).setDepth(32.2);

        hitZone.on('pointerover', () => {
            drawBase(hoverColor);
            label_.setColor('#ffffff');
        });
        hitZone.on('pointerout', () => {
            drawBase(fillColor);
            label_.setColor('#ffe08a');
        });
        hitZone.on('pointerdown', () => {
            this.tweens.add({ targets: [gfx, label_], scale: 0.95, duration: 60, yoyo: true });
            onClick();
        });

        return { gfx, label: label_, hitZone };
    }

    generateGlowTexture() {
        if (this.textures.exists('pauseGlow')) return;
        const size = 200;
        const tex = this.textures.createCanvas('pauseGlow', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,214,130,0.95)');
        grad.addColorStop(0.35, 'rgba(255,150,50,0.5)');
        grad.addColorStop(1, 'rgba(255,90,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateDustTexture() {
        if (this.textures.exists('pauseDust')) return;
        const size = 8;
        const tex = this.textures.createCanvas('pauseDust', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,240,200,0.8)');
        grad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    initAudio() {
        if (this.audioCtx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.audioCtx = new AC();
    }

    sfxClick() {
        this.initAudio();
        if (!this.audioCtx) return;
        const t0 = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, t0);
        osc.frequency.exponentialRampToValueAtTime(720, t0 + 0.08);
        gain.gain.setValueAtTime(0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.12);
    }
}