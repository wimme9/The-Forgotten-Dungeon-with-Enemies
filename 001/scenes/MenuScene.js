export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {
        // --- ASSETS LOAD ---
        this.load.image('menuBg', 'assets/MainMenu.png');
        this.load.audio('clickSfx', 'sound/adriantnt_u_click.mp3');
        this.load.audio('menuMusic', 'sound/mainmenu.mp3');
    }

    create() {
        // --- 1. BGM INITIALIZATION & AUTOPLAY HANDLING ---
        this.menuMusic = this.sound.add('menuMusic', { volume: 0.5, loop: true });

        if (this.sound.locked) {
            this.sound.once('unlocked', () => {
                if (this.menuMusic && !this.menuMusic.isPlaying) {
                    this.menuMusic.play();
                }
            });
        } else {
            this.menuMusic.play();
        }

        // --- 2. BACKGROUND SCALING ---
        let bg = this.add.image(640, 360, 'menuBg');
        bg.setDisplaySize(1280, 720);

        let shadowOverlay = this.add.graphics();
        shadowOverlay.fillStyle(0x000000, 0.4);
        shadowOverlay.fillRect(0, 0, 1280, 720);

        // --- 3. MAGICAL TITLE ---
        let titleText = this.add.text(640, 180, "HIGH LORD DUNGEON", {
            fontFamily: "FirlestFont",
            fontSize: "64px",
            fill: "#ffe066",
            stroke: "#3a0007",
            strokeThickness: 8,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: "#ff8800",
                blur: 25,
                fill: true
            }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 4. STONE PLAY BUTTON CONTAINER ---
        let btnX = 640;
        let btnY = 460;
        let btnWidth = 220;
        let btnHeight = 65;

        let buttonContainer = this.add.container(btnX, btnY);

        let btnBg = this.add.graphics();
        this.drawStoneButton(btnBg, btnWidth, btnHeight, 0x3d3a3a, 0x1f1d1d, 0x888888);

        let glowFx = this.add.graphics();
        this.drawGlowBorder(glowFx, btnWidth, btnHeight, 0x00ffff);
        glowFx.setAlpha(0);

        let btnText = this.add.text(0, 0, "PLAY GAME", {
            fontFamily: "FirlestFont",
            fontSize: "28px",
            fill: "#e0e0e0",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        buttonContainer.add([glowFx, btnBg, btnText]);

        let hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0).setInteractive({ useHandCursor: true });
        buttonContainer.add(hitArea);

        let clickSfx = this.sound.add('clickSfx', { volume: 0.7 });
        let transitionTriggered = false;

        // --- 5. BUTTON INTERACTION LOGIC ---
        hitArea.on('pointerover', () => {
            if (transitionTriggered) return;

            this.drawStoneButton(btnBg, btnWidth, btnHeight, 0x5a5555, 0x2e2a2a, 0x00ffff);
            btnText.setFill('#00ffff');

            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 150,
                ease: 'Back.easeOut'
            });

            this.tweens.add({
                targets: glowFx,
                alpha: 0.8,
                duration: 200
            });
        });

        hitArea.on('pointerout', () => {
            if (transitionTriggered) return;

            this.drawStoneButton(btnBg, btnWidth, btnHeight, 0x3d3a3a, 0x1f1d1d, 0x888888);
            btnText.setFill('#e0e0e0');

            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Linear'
            });

            this.tweens.add({
                targets: glowFx,
                alpha: 0,
                duration: 200
            });
        });

        hitArea.on('pointerdown', () => {
            if (transitionTriggered) return;
            transitionTriggered = true;

            clickSfx.play();

            // Stop menu BGM
            if (this.menuMusic) {
                this.menuMusic.stop();
                this.menuMusic.destroy();
            }

            // Direct scene switch (No camera fades)
            this.scene.start("GameplayScene");
        });
    }

    drawStoneButton(graphics, width, height, colorTop, colorBottom, borderColor) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.fillStyle(0x0d0d0d, 0.8);
        graphics.fillRoundedRect(-halfW - 3, -halfH - 3, width + 6, height + 6, 12);

        graphics.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1);
        graphics.fillRoundedRect(-halfW, -halfH, width, height, 10);

        graphics.lineStyle(3, borderColor, 0.9);
        graphics.strokeRoundedRect(-halfW + 2, -halfH + 2, width - 4, height - 4, 8);
    }

    drawGlowBorder(graphics, width, height, glowColor) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.lineStyle(8, glowColor, 0.5);
        graphics.strokeRoundedRect(-halfW - 4, -halfH - 4, width + 8, height + 8, 14);
    }
}