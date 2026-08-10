export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
        this.audioCtx = null;
    }

    create() {
        const W = this.scale.width || 900;
        const H = this.scale.height || 650;
        const cx = W / 2;

        // ---------- พื้นหลังถ้ำมืด (ไล่เฉด) ----------
        this.generateBgTexture(W, H);
        this.add.image(cx, H / 2, 'menuBg').setDisplaySize(W, H).setDepth(-3);

        // ---------- หมอกลอยเบาๆ ----------
        this.generateFogTexture();
        const fog1 = this.add.tileSprite(cx, H / 2, W, H, 'fogTex').setAlpha(0.10).setDepth(-2);
        const fog2 = this.add.tileSprite(cx, H / 2, W, H, 'fogTex').setAlpha(0.06).setDepth(-2).setScale(1.4);
        this.tweens.add({ targets: fog1, tilePositionX: 300, duration: 40000, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: fog2, tilePositionX: -220, duration: 60000, repeat: -1, ease: 'Linear' });

        // ---------- ผงฝุ่นลอยในอากาศ ----------
        this.generateDustTexture();
        const dust = this.add.particles(cx, H / 2, 'menuDust', {
            x: { min: 0, max: W },
            y: { min: 0, max: H },
            lifespan: 7000,
            speedY: { min: -6, max: -2 },
            speedX: { min: -3, max: 3 },
            scale: { start: 0.5, end: 0.05 },
            alpha: { start: 0.3, end: 0 },
            frequency: 260,
            blendMode: 'ADD'
        });
        dust.setDepth(-1);

        // ---------- เสาหินสองข้าง + คบเพลิงลุกโชน ----------
        this.addStonePillar(90, H, 260);
        this.addStonePillar(W - 90, H, 260);
        this.generateGlowTexture();
        this.generateEmberTexture();
        this.addFlameTorch(90, H - 210);
        this.addFlameTorch(W - 90, H - 210);

        // ---------- กรอบหินรอบข้อความ ----------
        const frame = this.add.graphics().setDepth(0.5);
        frame.lineStyle(3, 0x6a5a3a, 0.5);
        frame.strokeRoundedRect(cx - 320, 70, 640, 250, 14);
        frame.lineStyle(1, 0xffd27a, 0.25);
        frame.strokeRoundedRect(cx - 314, 76, 628, 238, 12);

        // ---------- ชื่อเกม ----------
        const title = this.add.text(cx, 150, "FORGOTTEN DUNGEON", {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "52px",
            fontStyle: "bold",
            color: "#ffd27a",
            stroke: "#2a1608",
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(2);

        this.tweens.add({
            targets: title,
            alpha: { from: 0.85, to: 1 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(cx, 150, "FORGOTTEN DUNGEON", {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "52px",
            fontStyle: "bold",
            color: "#ffd27a"
        }).setOrigin(0.5).setDepth(1.9).setAlpha(0.35).setScale(1.03);

        // ---------- คำโปรย (ธีมเกม) ----------
        this.add.text(cx, 205, "ไขปริศนา • ปลดล็อกทุกห้อง • หาทางออกจากถ้ำมืด", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "18px",
            color: "#cbb894"
        }).setOrigin(0.5).setDepth(2);

        this.add.text(cx, 232, "ก่อนที่แสงแห่งสติของเจ้าจะดับลงตลอดกาล...", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "14px",
            fontStyle: "italic",
            color: "#8f8264"
        }).setOrigin(0.5).setDepth(2);

        // ---------- ปุ่ม START ----------
        this.createStoneButton(cx, 300, "เริ่มการผจญภัย", () => {
            this.sfxClick();
            this.cameras.main.flash(250, 255, 220, 160);
            this.time.delayedCall(180, () => this.scene.start("GameplayScene"));
        }, 220, 54, '28px');

        // ---------- คำแนะนำการเล่น ----------
        const controlsFrame = this.add.graphics().setDepth(0.5);
        controlsFrame.fillStyle(0x000000, 0.35);
        controlsFrame.fillRoundedRect(cx - 260, H - 90, 520, 60, 10);
        controlsFrame.lineStyle(1, 0x6a5a3a, 0.6);
        controlsFrame.strokeRoundedRect(cx - 260, H - 90, 520, 60, 10);

        this.add.text(cx, H - 70, "WASD / ลูกศร : เคลื่อนที่        E : โต้ตอบ / ไขปริศนา", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "14px",
            color: "#d8c9a3"
        }).setOrigin(0.5).setDepth(2);

        this.add.text(cx, H - 48, "ระวัง! แสงแห่งสติจะลดลงเรื่อยๆ ในความมืด — อย่าให้มันดับ", {
            fontFamily: "Tahoma, sans-serif",
            fontSize: "12px",
            color: "#c97a6a"
        }).setOrigin(0.5).setDepth(2);

        // ---------- ประกายฝุ่นทองลอยขึ้น ----------
        for (let i = 0; i < 14; i++) {
            const sx = cx - 300 + Math.random() * 600;
            const sy = 90 + Math.random() * 220;
            const star = this.add.text(sx, sy, '✦', {
                fontFamily: 'Arial',
                fontSize: (7 + Math.random() * 7) + 'px',
                color: '#ffe08a'
            }).setAlpha(0.12).setDepth(0.8);

            this.tweens.add({
                targets: star,
                alpha: { from: 0.05, to: 0.4 },
                duration: 1000 + Math.random() * 1500,
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1200
            });
        }
    }

    // ================= องค์ประกอบตกแต่ง =================

    addStonePillar(x, groundY, height) {
        const gfx = this.add.graphics().setDepth(0.3);
        const y = groundY - height;
        gfx.fillStyle(0x3d3a3f, 1);
        gfx.fillRect(x - 22, y, 44, height);
        gfx.lineStyle(1, 0x201e22, 0.9);
        gfx.strokeRect(x - 22, y, 44, height);
        for (let i = 0; i < 5; i++) {
            gfx.lineStyle(1, 0x55525a, 0.5);
            gfx.lineBetween(x - 22, y + 20 + i * (height - 40) / 5, x + 22, y + 20 + i * (height - 40) / 5);
        }
        gfx.fillStyle(0x4c4952, 1);
        gfx.fillRect(x - 30, y - 12, 60, 16);
        gfx.fillRect(x - 30, groundY - 16, 60, 16);
    }

    addFlameTorch(x, y) {
        const glow = this.add.image(x, y, 'menuGlow')
            .setScale(1.1)
            .setDepth(0.4)
            .setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: glow,
            scale: { from: 0.95, to: 1.25 },
            alpha: { from: 0.7, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const stick = this.add.graphics().setDepth(0.5);
        stick.fillStyle(0x4a3020, 1);
        stick.fillRect(x - 4, y, 8, 34);

        const emitter = this.add.particles(x, y - 6, 'menuEmber', {
            speed: { min: 10, max: 30 },
            angle: { min: 260, max: 280 },
            lifespan: { min: 500, max: 1000 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.9, end: 0 },
            frequency: 130,
            blendMode: 'ADD'
        });
        emitter.setDepth(0.6);
    }

    createStoneButton(x, y, label, onClick, w = 200, h = 50, fontSize = '22px') {
        const gfx = this.add.graphics().setDepth(1);
        const drawBase = (fill) => {
            gfx.clear();
            gfx.fillStyle(fill, 1);
            gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            gfx.lineStyle(2, 0xffd27a, 0.7);
            gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        drawBase(0x3a2a1c);

        const label_ = this.add.text(x, y, label, {
            fontFamily: "Tahoma, sans-serif",
            fontSize,
            fontStyle: 'bold',
            color: "#ffe08a"
        }).setOrigin(0.5).setDepth(1.1);

        const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(1.2);

        hitZone.on('pointerover', () => {
            drawBase(0x53381f);
            label_.setColor('#ffffff');
            this.tweens.add({ targets: [gfx, label_], scale: 1.04, duration: 120 });
        });
        hitZone.on('pointerout', () => {
            drawBase(0x3a2a1c);
            label_.setColor('#ffe08a');
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
        if (this.textures.exists('menuBg')) return;
        const tex = this.textures.createCanvas('menuBg', w, h);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(w / 2, h * 0.35, 40, w / 2, h * 0.35, w * 0.75);
        grad.addColorStop(0, '#3a2f3c');
        grad.addColorStop(0.45, '#221c2c');
        grad.addColorStop(1, '#0f0d15');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        tex.refresh();
    }

    generateFogTexture() {
        if (this.textures.exists('fogTex')) return;
        const size = 256;
        const tex = this.textures.createCanvas('fogTex', size, size);
        const ctx = tex.getContext();
        for (let i = 0; i < 6; i++) {
            const gx = Math.random() * size;
            const gy = Math.random() * size;
            const r = 60 + Math.random() * 60;
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
            grad.addColorStop(0, 'rgba(200,200,220,0.5)');
            grad.addColorStop(1, 'rgba(200,200,220,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
        }
        tex.refresh();
    }

    generateDustTexture() {
        if (this.textures.exists('menuDust')) return;
        const size = 10;
        const tex = this.textures.createCanvas('menuDust', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,240,200,0.9)');
        grad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateGlowTexture() {
        if (this.textures.exists('menuGlow')) return;
        const size = 200;
        const tex = this.textures.createCanvas('menuGlow', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,214,130,0.95)');
        grad.addColorStop(0.35, 'rgba(255,150,50,0.5)');
        grad.addColorStop(1, 'rgba(255,90,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateEmberTexture() {
        if (this.textures.exists('menuEmber')) return;
        const size = 16;
        const tex = this.textures.createCanvas('menuEmber', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,230,150,1)');
        grad.addColorStop(0.5, 'rgba(255,140,50,0.8)');
        grad.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    // ================= เสียง (Web Audio synth เล็กๆ) =================

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