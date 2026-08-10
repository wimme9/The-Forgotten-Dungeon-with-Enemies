export default class PauseScene extends Phaser.Scene {
    constructor() {
        super("PauseScene");
    }

    preload() {
        // Load click sound effect
        this.load.audio('clickSfx', 'sound/adriantnt_u_click.mp3');
    }

    create() {
        // --- 1. AUDIO MANAGEMENT ---
        let gameplayScene = this.scene.get("GameplayScene");
        if (gameplayScene && gameplayScene.sfxSfxBgMusic) {
            gameplayScene.sfxSfxBgMusic.pause();
        }

        let clickSfx = this.sound.add('clickSfx', { volume: 0.7 });

        // Semi-transparent backdrop
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5);

        // --- 2. STONE PAUSE WINDOW FRAME ---
        let panelX = 640;
        let panelY = 360;
        let panelW = 460;
        let panelH = 340;

        let frameGraphics = this.add.graphics();
        this.drawStoneFrame(frameGraphics, panelX, panelY, panelW, panelH);

        // Header Title
        this.add.text(panelX, panelY - 110, "PAUSED", {
            fontFamily: "FirlestFont",
            fontSize: "48px",
            fill: "#ffe066",
            stroke: "#3a0007",
            strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 0, color: "#ff8800", blur: 15, fill: true }
        }).setOrigin(0.5);

        // --- 3. STONE BUTTONS ---
        this.createStoneButton(panelX, panelY - 10, 240, 55, "RESUME", () => {
            clickSfx.play();
            if (gameplayScene && gameplayScene.sfxSfxBgMusic) {
                gameplayScene.sfxSfxBgMusic.resume();
            }
            this.scene.stop();
            this.scene.resume("GameplayScene");
        });

        this.createStoneButton(panelX, panelY + 65, 240, 55, "MAIN MENU", () => {
            clickSfx.play();
            this.sound.stopAll();
            this.scene.stop("GameplayScene");
            this.scene.stop("PauseScene");
            this.scene.start("MenuScene");
        });
    }

    // --- DRAWING HELPERS ---
    drawStoneFrame(graphics, x, y, width, height) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.fillStyle(0x0a0a0a, 0.85);
        graphics.fillRoundedRect(x - halfW - 4, y - halfH - 4, width + 8, height + 8, 16);

        graphics.fillGradientStyle(0x2d2b2b, 0x2d2b2b, 0x181717, 0x181717, 0.95);
        graphics.fillRoundedRect(x - halfW, y - halfH, width, height, 12);

        graphics.lineStyle(4, 0x6e6868, 0.8);
        graphics.strokeRoundedRect(x - halfW + 3, y - halfH + 3, width - 6, height - 6, 10);

        graphics.lineStyle(3, 0xffaa00, 0.9);
        graphics.strokeRoundedRect(x - halfW + 8, y - halfH + 8, width - 16, height - 16, 8);
    }

    createStoneButton(x, y, width, height, labelText, onClick) {
        let container = this.add.container(x, y);

        let btnBg = this.add.graphics();
        this.drawStoneButton(btnBg, width, height, 0x3d3a3a, 0x1f1d1d, 0x888888);

        let glowFx = this.add.graphics();
        this.drawGlowBorder(glowFx, width, height, 0x00ffff);
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
            this.drawStoneButton(btnBg, width, height, 0x5a5555, 0x2e2a2a, 0x00ffff);
            text.setFill('#00ffff');
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