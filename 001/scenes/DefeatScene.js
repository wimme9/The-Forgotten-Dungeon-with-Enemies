export default class DefeatScene extends Phaser.Scene {
    constructor() {
        super("DefeatScene");
    }

    preload() {
        // --- ASSETS LOAD ---
        this.load.image('defeatBg', 'assets/Defeated.png');
        this.load.audio('defeatMusic', 'sound/defeat.mp3');
        this.load.audio('clickSfx', 'sound/adriantnt_u_click.mp3');
    }

    create() {
        // --- 1. CAMERA & BACKGROUND ---
        this.cameras.main.clearFX();
        this.cameras.main.fadeIn(800, 0, 0, 0);

        // Scale 2752x1536 background to 1280x720
        let bg = this.add.image(640, 360, 'defeatBg');
        bg.setDisplaySize(1280, 720);

        // Dark vignette/overlay to emphasize dark mood and UI contrast
        let shadowOverlay = this.add.graphics();
        shadowOverlay.fillStyle(0x000000, 0.45);
        shadowOverlay.fillRect(0, 0, 1280, 720);

        // --- 2. AUDIO MANAGEMENT ---
        // Stop any leftover music from previous scenes
        this.sound.stopAll();

        let clickSfx = this.sound.add('clickSfx', { volume: 0.7 });

        // Play defeat song once (no loop)
        this.defeatMusic = this.sound.add('defeatMusic', { volume: 0.6, loop: false });
        if (this.sound.locked) {
            this.sound.once('unlocked', () => {
                if (this.defeatMusic && !this.defeatMusic.isPlaying) {
                    this.defeatMusic.play();
                }
            });
        } else {
            this.defeatMusic.play();
        }

        // --- 3. HEADER & OMINOUS TEXT ---
        this.add.text(640, 180, "DEFEATED", {
            fontFamily: "FirlestFont",
            fontSize: "64px",
            fill: "#ff3333",
            stroke: "#1a0000",
            strokeThickness: 8,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: "#ff0000",
                blur: 25,
                fill: true
            }
        }).setOrigin(0.5);

        let subText = this.add.text(640, 260, "Nobody is getting out today", {
            fontFamily: "FirlestFont",
            fontSize: "28px",
            fill: "#d1c4b2",
            stroke: "#000000",
            strokeThickness: 5,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: "#000000",
                blur: 10,
                fill: true
            }
        }).setOrigin(0.5);

        // Subtle slow breathing pulsing effect on subtext
        this.tweens.add({
            targets: subText,
            alpha: 0.7,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 4. NAVIGATION BUTTONS ---
        let btnX = 640;
        let btnWidth = 260;
        let btnHeight = 55;

        // RESTART LEVEL BUTTON
        this.createStoneButton(btnX, 430, btnWidth, btnHeight, "RESTART LEVEL", () => {
            clickSfx.play();
            if (this.defeatMusic) {
                this.defeatMusic.stop();
            }
            this.scene.start("GameplayScene");
        });

        // MAIN MENU BUTTON
        this.createStoneButton(btnX, 510, btnWidth, btnHeight, "MAIN MENU", () => {
            clickSfx.play();
            if (this.defeatMusic) {
                this.defeatMusic.stop();
            }
            this.scene.start("MenuScene");
        });
    }

    // --- HELPER: CREATE INTERACTIVE STONE BUTTON ---
    createStoneButton(x, y, width, height, labelText, onClick) {
        let container = this.add.container(x, y);

        let btnBg = this.add.graphics();
        this.drawStoneButton(btnBg, width, height, 0x3d3a3a, 0x1f1d1d, 0x888888);

        let glowFx = this.add.graphics();
        this.drawGlowBorder(glowFx, width, height, 0xff3333); // Red glow accent for defeat theme
        glowFx.setAlpha(0);

        let text = this.add.text(0, 0, labelText, {
            fontFamily: "FirlestFont",
            fontSize: "24px",
            fill: "#e0e0e0",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        container.add([glowFx, btnBg, text]);

        let hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerover', () => {
            this.drawStoneButton(btnBg, width, height, 0x5a5555, 0x2e2a2a, 0xff3333);
            text.setFill('#ff8888');
            this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 150 });
            this.tweens.add({ targets: glowFx, alpha: 0.8, duration: 200 });
        });

        hitArea.on('pointerout', () => {
            this.drawStoneButton(btnBg, width, height, 0x3d3a3a, 0x1f1d1d, 0x888888);
            text.setFill('#e0e0e0');
            this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 150 });
            this.tweens.add({ targets: glowFx, alpha: 0, duration: 200 });
        });

        hitArea.on('pointerdown', onClick);

        return container;
    }

    drawStoneButton(graphics, width, height, colorTop, colorBottom, borderColor) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.fillStyle(0x0d0d0d, 0.8);
        graphics.fillRoundedRect(-halfW - 2, -halfH - 2, width + 4, height + 4, 10);

        graphics.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1);
        graphics.fillRoundedRect(-halfW, -halfH, width, height, 8);

        graphics.lineStyle(2, borderColor, 0.9);
        graphics.strokeRoundedRect(-halfW + 2, -halfH + 2, width - 4, height - 4, 6);
    }

    drawGlowBorder(graphics, width, height, glowColor) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.lineStyle(6, glowColor, 0.5);
        graphics.strokeRoundedRect(-halfW - 3, -halfH - 3, width + 6, height + 6, 12);
    }
}