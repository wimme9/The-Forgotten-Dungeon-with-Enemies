export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");
    }

    init() {
        this.player = null;
        this.cursors = null;
        this.wasd = null;
        this.uiText = null;
        this.interactables = null;
        this.activeDialogueInstance = null;
        this.victoryTriggered = false;
        this.levelCompleted = false;

        this.sfxSfxBgMusic = null;
        this.sfxNpcSpeak = null;
        this.sfxStatueMove = null;
        this.sfxTorchWhoosh = null;
        this.sfxTorchCrack = null;
        this.sfxPageFlip = null;
        this.sfxSuccessMission = null;
        this.sfxSpellLearned = null;
        this.sfxSuccessChime = null;
        this.sfxOpenChest = null;
        this.clickSfx = null;

        // Disguise State
        this.disguiseState = {
            isDisguised: false,
            isCooldown: false,
            activeTimeRemaining: 10,
            cooldownTimeRemaining: 20,
            activeEvent: null,
            cooldownEvent: null
        };

        this.gameState = {
            hasSpell: false,
            hasLighter: false,
            torchSequence: [],
            correctTorchOrder: [],
            correctStatueAngles: [],
            statueAngles: [0, 0, 0, 0],
            correctBookIndex: 0,
            gatesOpened: { torchRoomAccess: false, endHallwayAccess: false },
            chestOpened: false
        };
    }

    preload() {
        // --- 0. LOAD GAME CONFIG DATA ---
        this.load.json('gameData', 'Data/gameData.json');

        // --- SPRITES & ANIMS ---
        this.load.spritesheet('character', 'sprite/character.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('bookAsset', 'sprite/book.png');
        this.load.image('dragonAsset', 'sprite/dragon.png');
        this.load.image('npcAsset', 'sprite/npc.png');
        this.load.image('torchAsset', 'sprite/static_torch.png');
        this.load.spritesheet('torchAnimated', 'sprite/Torch Animated.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('chestStatic', 'sprite/Wooden Chest 2 - frame  00.png');
        this.load.spritesheet('chestAnimated', 'sprite/Wooden Chest 2 - Spritesheet.png', { frameWidth: 48, frameHeight: 32 });
        this.load.spritesheet('orc', 'sprite/Orc.png', { frameWidth: 100, frameHeight: 100 });
        
        // Disguise Asset
        this.load.image('disguiseIcon', 'sprite/disguise.png');

        // --- MAP & TILESET ---
        this.load.tilemapTiledJSON('dungeonMap', 'assets/dungeonv4.json');
        this.load.image('dungeonTiles', 'tileset/Dungeon_FloorsWallsA5.png');

        // --- SOUND EFFECTS ---
        this.load.audio('clickSfx', 'sound/adriantnt_u_click.mp3');
        this.load.audio('npcSpeak', 'sound/blue-archive-respond-chat.mp3');
        this.load.audio('statueMove', 'sound/concrete-tap-gtag.mp3');
        this.load.audio('bgMusic', 'sound/deuslower-dark-fantasy-ambient-dungeon-synth-music-281592.mp3');
        this.load.audio('torchWhoosh', 'sound/fire-whoosh.mp3');
        this.load.audio('torchCrack', 'sound/fogo-lighter.mp3');
        this.load.audio('pageFlip', 'sound/page-flip-sound-effect.mp3');
        this.load.audio('successMission', 'sound/pokemon-black-and-white-ost-disc-3-mission-success.mp3');
        this.load.audio('spellLearned', 'sound/spell-learned.mp3');
        this.load.audio('successChime', 'sound/success-chime.mp3');
        this.load.audio('openChest', 'sound/zelda-chest.mp3');
    }

    create() {
        this.gameData = this.cache.json.get('gameData') || null;
        if (!this.gameData) {
            console.error('GameplayScene: gameData.json failed to load.');
            this.add.text(640, 360, 'Failed to load game data.', {
                fontSize: '24px',
                fill: '#ff6666'
            }).setOrigin(0.5);
            return;
        }

        // Create orc animations
        if (!this.anims.exists('orc_idle')) {
            this.anims.create({
                key: 'orc_idle',
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.anims.exists('orc_walk')) {
            this.anims.create({
                key: 'orc_walk',
                frames: this.anims.generateFrameNumbers('orc', { start: 9, end: 16 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.initEnemy();

        this.timeRemaining = this.gameData.puzzleConfig.initialTimerSeconds;
        this.isTimerRunning = true;

        this.createTimerHUD();

        this.gameTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true
        });

        this.cameras.main.fadeIn(800, 0, 0, 0);
        this.sound.stopAll();

        // Pause Button
        let pauseButton = this.add.text(1100, 50, "||", {
            fontSize: "30px",
            color: "#ff0000",
            backgroundColor: "#333333",
            padding: { x: 15, y: 10 }
        }).setScrollFactor(0).setDepth(200);

        pauseButton.setInteractive();
        pauseButton.on("pointerdown", () => {
            this.scene.pause();
            this.scene.launch("PauseScene");
        });

        this.interactables = this.physics.add.staticGroup();

        // AUDIO INITIALIZATION
        this.clickSfx = this.sound.add('clickSfx', { volume: 0.7 });
        this.sfxSfxBgMusic = this.sound.add('bgMusic', { volume: 0.25, loop: true });
        this.sfxSfxBgMusic.play();

        this.sfxNpcSpeak = this.sound.add('npcSpeak', { volume: 0.6 });
        this.sfxStatueMove = this.sound.add('statueMove', { volume: 0.7 });
        this.sfxTorchWhoosh = this.sound.add('torchWhoosh', { volume: 0.6 });
        this.sfxTorchCrack = this.sound.add('torchCrack', { volume: 0.4, loop: true });
        this.sfxPageFlip = this.sound.add('pageFlip', { volume: 0.6 });
        this.sfxSuccessMission = this.sound.add('successMission', { volume: 0.7 });
        this.sfxSpellLearned = this.sound.add('spellLearned', { volume: 0.7 });
        this.sfxSuccessChime = this.sound.add('successChime', { volume: 0.7 });
        this.sfxOpenChest = this.sound.add('openChest', { volume: 0.7 });

        // 1. RENDER TILED MAP
        const map = this.make.tilemap({ key: 'dungeonMap' });
        const tilesetName = (map.tilesets && map.tilesets.length > 0) ? map.tilesets[0].name : 'dungeon';
        const tileset = map.addTilesetImage(tilesetName, 'dungeonTiles');

        if (tileset) {
            const voidLayer = map.createLayer('void', tileset, 0, 0);
            const floorLayer = map.createLayer('Floor Layers', tileset, 0, 0);
            const wallLayer = map.createLayer('Wall Layers', tileset, 0, 0);
            const wall2Layer = map.createLayer('Wall 2 Layers', tileset, 0, 0);

            if (voidLayer) voidLayer.setDepth(-15);
            if (floorLayer) floorLayer.setDepth(-10);
            if (wallLayer) {
                wallLayer.setDepth(-5);
                wallLayer.setCollisionByExclusion([-1]);
            }
            if (wall2Layer) {
                wall2Layer.setDepth(-5);
                wall2Layer.setCollisionByExclusion([-1]);
            }
        }

        // 2. RANDOMIZE PUZZLE SOLUTIONS
        const pConfig = this.gameData.puzzleConfig;
        this.gameState.correctBookIndex = Phaser.Math.Between(0, pConfig.colors.length);

        let torchPool = [1, 2, 3, 4];
        this.gameState.correctTorchOrder = Phaser.Utils.Array.Shuffle(torchPool);

        let angleClues = [];
        for (let i = 0; i < 4; i++) {
            let randAngle = pConfig.possibleAngles[Phaser.Math.Between(0, pConfig.possibleAngles.length - 1)];
            this.gameState.correctStatueAngles.push(randAngle);
            this.gameState.statueAngles[i] = (randAngle + 90) % 360;
            angleClues.push(`${pConfig.colors[i]} = ${randAngle}°`);
        }

        let clueIndex = 0;
        const bookClues = [];
        for (let i = 0; i < 5; i++) {
            if (i === this.gameState.correctBookIndex) {
                bookClues.push(pConfig.specialBookClue);
            } else {
                bookClues.push(`${pConfig.cluePrefix}"${angleClues[clueIndex]}"`);
                clueIndex++;
            }
        }

        const titleStyle = { font: "bold 15px Arial", stroke: "#000000", strokeThickness: 4 };

        this.gameData.roomTitles.forEach(rt => {
            this.add.text(rt.x, rt.y, rt.text, { ...titleStyle, fill: rt.color }).setDepth(10);
        });

        // 3. THE LIBRARY
        const libPos = this.gameData.positions.libraryBooks;
        for (let i = 0; i < libPos.count; i++) {
            let posX = libPos.startX + (i * libPos.spacingX);
            let posY = libPos.y;
            this.add.circle(posX, posY, 18, 0x5d4037).setStrokeStyle(2, 0xd7ccc8);
            this.add.sprite(posX, posY, 'bookAsset').setScale(0.04);

            let hitZone = this.add.rectangle(posX, posY, 48, 48, 0x000, 0).setInteractive();
            this.interactables.add(hitZone);

            this.add.text(posX, posY + 24, `${i + 1}`, { font: "bold 12px Arial", fill: "#ffffff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
            hitZone.setData('type', 'book').setData('id', i).setData('clue', bookClues[i]);
        }

        // 4. DRAGON CHAMBER
        const pedestals = this.gameData.positions.dragonPedestals;
        for (let i = 0; i < pedestals.length; i++) {
            let posX = pedestals[i].x;
            let posY = pedestals[i].y;
            let dragon = this.add.sprite(posX, posY, 'dragonAsset').setTint(pConfig.hexColors[i]).setScale(0.045);

            let dragonHitZone = this.add.rectangle(posX, posY, 50, 60, 0x000, 0).setInteractive();
            this.interactables.add(dragonHitZone);
            dragonHitZone.setData('type', 'statue').setData('id', i).setData('art', dragon);

            let label = this.add.text(posX, posY - 28, `${this.gameState.statueAngles[i]}°`, { font: "bold 13px monospace", fill: "#000000", stroke: "#ffffff", strokeThickness: 3 }).setOrigin(0.5).setDepth(5);
            dragonHitZone.setData('labelText', label);
        }

        // 5. TORCH ROOM
        if (!this.anims.exists('burn')) {
            this.anims.create({
                key: 'burn',
                frames: this.anims.generateFrameNumbers('torchAnimated', { start: 0, end: 7 }),
                frameRate: 12,
                repeat: -1
            });
        }

        const torchPos = this.gameData.positions.torches;
        for (let i = 0; i < torchPos.count; i++) {
            let posX = torchPos.startX + (i * torchPos.spacingX);
            let posY = torchPos.y;

            let base = this.add.sprite(posX, posY, 'torchAsset');
            let fire = this.add.sprite(posX, posY, 'torchAnimated').setVisible(false);
            let hitArea = this.add.rectangle(posX, posY, 50, 60, 0x000, 0).setInteractive();
            let light = this.add.circle(posX, posY - 10, 50, 0xffaa00, 0.15).setVisible(false);

            this.interactables.add(hitArea);
            hitArea.setData('type', 'torch').setData('id', i + 1).setData('fire', fire).setData('light', light);
            this.add.text(posX, posY + 32, `${i + 1}`, { font: "bold 12px monospace", fill: "#ffffff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
        }

        // 6. TREASURE & NPC
        const npcPos = this.gameData.positions.npc;
        this.add.sprite(npcPos.x, npcPos.y, 'npcAsset').setScale(0.06);
        let npcHitZone = this.add.rectangle(npcPos.x, npcPos.y, 50, 60, 0x000, 0).setInteractive();
        this.interactables.add(npcHitZone);
        npcHitZone.setData('type', 'npc');

        const chestPos = this.gameData.positions.chest;
        let chest = this.add.sprite(chestPos.x, chestPos.y, 'chestStatic');
        let chestHitZone = this.add.rectangle(chestPos.x, chestPos.y, 50, 50, 0x000, 0).setInteractive();
        this.interactables.add(chestHitZone);
        chestHitZone.setData('type', 'chest').setData('art', chest);

        if (!this.anims.exists('chestOpen')) {
            this.anims.create({
                key: 'chestOpen',
                frames: this.anims.generateFrameNumbers('chestAnimated', { start: 0, end: 4 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // 7. PLAYER SPAWN & COLLIDERS
        const pSpawn = this.gameData.positions.playerSpawn;
        this.player = this.physics.add.sprite(pSpawn.x, pSpawn.y, 'character', 0).setScale(1.2).setCollideWorldBounds(true);

        // Sync body right after spawning
        this.syncPlayerBodyToSprite();

        let wallLayer = map.getLayer('Wall Layers') ? map.getLayer('Wall Layers').tilemapLayer : null;
        let wall2Layer = map.getLayer('Wall 2 Layers') ? map.getLayer('Wall 2 Layers').tilemapLayer : null;

        if (wallLayer) {
            this.physics.add.collider(this.player, wallLayer);
            if (this.enemies) this.physics.add.collider(this.enemies, wallLayer);
        }
        if (wall2Layer) {
            this.physics.add.collider(this.player, wall2Layer);
            if (this.enemies) this.physics.add.collider(this.enemies, wall2Layer);
        }

        // 8. UI TEXT & CONTROLS
        const msgs = this.gameData.uiMessages;
        this.add.rectangle(640, 685, 1200, 40, 0x000000, 0.75).setDepth(100);
        this.uiText = this.add.text(40, 675, msgs.initialObjective, { font: "15px Arial", fill: "#ffffff" }).setDepth(101);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
        });

        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        }
        if (!this.anims.exists('walk')) {
            this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
        }
        this.player.play('idle');

        // 9. DISGUISE HUD INITIALIZATION
        this.createDisguiseHUD();
    }

    // --- DISGUISE HUD & SYSTEM ---
    createDisguiseHUD() {
        const hudX = 1200;
        const hudY = 360;

        this.disguiseContainer = this.add.container(hudX, hudY).setDepth(200);

        // Radiant White Glow Graphics (Behind Icon)
        this.disguiseGlow = this.add.graphics();
        this.drawRadiantGlow(this.disguiseGlow, 80, 0xffffff);
        this.disguiseContainer.add(this.disguiseGlow);

        // Radiant Pulsing Animation
        this.disguiseGlowTween = this.tweens.add({
            targets: this.disguiseGlow,
            alpha: { start: 0.3, to: 0.9 },
            scaleX: { start: 0.95, to: 1.15 },
            scaleY: { start: 0.95, to: 1.15 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Disguise Icon (700x700 scaled down to 70x70)
        this.disguiseIcon = this.add.image(0, 0, 'disguiseIcon');
        this.disguiseIcon.setDisplaySize(70, 70);

        // Hit Area on Icon
        let iconHitArea = this.add.circle(0, 0, 35, 0x000000, 0).setInteractive({ useHandCursor: true });

        // Countdown Text Overlay
        this.disguiseTimerText = this.add.text(0, 0, "", {
            fontFamily: "FirlestFont",
            fontSize: "28px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5).setVisible(false);

        this.disguiseContainer.add([this.disguiseIcon, iconHitArea, this.disguiseTimerText]);

        // ICON CLICK HANDLER
        iconHitArea.on('pointerdown', () => {
            if (this.disguiseState.isDisguised || this.disguiseState.isCooldown) return;
            this.activateDisguise();
        });

        // DECORATED SKIP BUTTON (Below Icon)
        this.skipButtonContainer = this.add.container(0, 65);
        
        let skipBtnBg = this.add.graphics();
        this.drawStoneButtonGraphics(skipBtnBg, 70, 26, 0x3d3a3a, 0x1f1d1d, 0x888888);

        let skipBtnText = this.add.text(0, 0, "SKIP", {
            fontFamily: "FirlestFont",
            fontSize: "14px",
            fill: "#e0e0e0",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        let skipHitArea = this.add.rectangle(0, 0, 70, 26, 0x000000, 0).setInteractive({ useHandCursor: true });

        this.skipButtonContainer.add([skipBtnBg, skipBtnText, skipHitArea]);
        this.disguiseContainer.add(this.skipButtonContainer);

        skipHitArea.on('pointerover', () => {
            this.drawStoneButtonGraphics(skipBtnBg, 70, 26, 0x5a5555, 0x2e2a2a, 0x00ffff);
            skipBtnText.setFill('#00ffff');
        });

        skipHitArea.on('pointerout', () => {
            this.drawStoneButtonGraphics(skipBtnBg, 70, 26, 0x3d3a3a, 0x1f1d1d, 0x888888);
            skipBtnText.setFill('#e0e0e0');
        });

        skipHitArea.on('pointerdown', () => {
            if (this.clickSfx) this.clickSfx.play();
            this.skipCooldown();
        });
    }

    // --- DISGUISE LOGIC ---
    activateDisguise() {
        if (this.clickSfx) this.clickSfx.play();

        this.disguiseState.isDisguised = true;
        this.disguiseState.activeTimeRemaining = 10;

        // White smoke particle on character
        this.spawnSmokeParticles(this.player.x, this.player.y);

        // Turn player into Red Orc & scale up
        this.player.setTexture('orc');
        this.player.setScale(1.6);
        this.player.setTint(0xff4444);
        this.player.play('orc_idle', true);

        // KEY FIX: Recalculate collision box for Orc form
        this.syncPlayerBodyToSprite();

        // Disguise Icon UI Changes (Darkened Icon + Active Timer)
        if (this.disguiseGlowTween) this.disguiseGlowTween.pause();
        this.disguiseGlow.setVisible(false);
        this.disguiseIcon.setTint(0x444444);
        this.disguiseTimerText.setText("10").setVisible(true);

        // Start 10s Disguise Countdown Event
        this.disguiseState.activeEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.disguiseState.activeTimeRemaining--;
                if (this.disguiseState.activeTimeRemaining > 0) {
                    this.disguiseTimerText.setText(`${this.disguiseState.activeTimeRemaining}`);
                } else {
                    this.deactivateDisguise();
                }
            },
            repeat: 9
        });
    }

    deactivateDisguise() {
        if (this.disguiseState.activeEvent) {
            this.disguiseState.activeEvent.remove();
            this.disguiseState.activeEvent = null;
        }

        this.disguiseState.isDisguised = false;
        this.disguiseState.isCooldown = true;
        this.disguiseState.cooldownTimeRemaining = 20;

        // White smoke particle on character
        this.spawnSmokeParticles(this.player.x, this.player.y);

        // Revert Player to Human
        this.player.setTexture('character');
        this.player.setScale(1.2);
        this.player.clearTint();
        this.player.play('idle', true);

        // KEY FIX: Reset collision box for Human form
        this.syncPlayerBodyToSprite();

        // Disguise Icon UI Changes (Blue Tint + Cooldown Timer)
        this.disguiseIcon.setTint(0x0088ff);
        this.disguiseTimerText.setText("20").setVisible(true);

        // Start 20s Cooldown Countdown Event
        this.disguiseState.cooldownEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.disguiseState.cooldownTimeRemaining--;
                if (this.disguiseState.cooldownTimeRemaining > 0) {
                    this.disguiseTimerText.setText(`${this.disguiseState.cooldownTimeRemaining}`);
                } else {
                    this.resetDisguiseReady();
                }
            },
            repeat: 19
        });
    }

    skipCooldown() {
        if (this.disguiseState.cooldownEvent) {
            this.disguiseState.cooldownEvent.remove();
            this.disguiseState.cooldownEvent = null;
        }

        // If currently disguised, immediately end disguise and reset to ready
        if (this.disguiseState.isDisguised) {
            if (this.disguiseState.activeEvent) {
                this.disguiseState.activeEvent.remove();
                this.disguiseState.activeEvent = null;
            }
            this.spawnSmokeParticles(this.player.x, this.player.y);
            this.player.setTexture('character');
            this.player.setScale(1.2);
            this.player.clearTint();
            this.player.play('idle', true);
        }

        this.resetDisguiseReady();
    }

    resetDisguiseReady() {
        this.disguiseState.isDisguised = false;
        this.disguiseState.isCooldown = false;

        // Restore Icon & Glowing Radiant State
        this.disguiseIcon.clearTint();
        this.disguiseTimerText.setVisible(false);
        this.disguiseGlow.setVisible(true);
        if (this.disguiseGlowTween) this.disguiseGlowTween.resume();
    }

    syncPlayerBodyToSprite() {
        if (!this.player || !this.player.body) return;

        const isDisguised = this.disguiseState.isDisguised;

        if (isDisguised) {
            // Orc Sprite (100x100 at 1.6 scale) -> Tight feet collision box (28x20)
            this.player.body.setSize(28, 20);
            this.player.body.setOffset(36, 70);
        } else {
            // Human Character Sprite (32x32 at 1.2 scale) -> Feet collision box (16x14)
            this.player.body.setSize(16, 14);
            this.player.body.setOffset(8, 18);
        }
    }

    spawnSmokeParticles(x, y) {
        // Create quick white smoke effect
        let smokeGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        smokeGraphics.fillStyle(0xffffff, 0.9);
        smokeGraphics.fillCircle(8, 8, 8);
        smokeGraphics.generateTexture('smokeParticle', 16, 16);

        let emitter = this.add.particles(x, y, 'smokeParticle', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 600,
            gravityY: -30,
            quantity: 20
        });

        this.time.delayedCall(600, () => emitter.destroy());
    }

    drawRadiantGlow(graphics, radius, color) {
        graphics.clear();
        graphics.fillStyle(color, 0.4);
        graphics.fillCircle(0, 0, radius / 2 + 8);
        graphics.fillStyle(color, 0.2);
        graphics.fillCircle(0, 0, radius / 2 + 16);
    }

    drawStoneButtonGraphics(graphics, width, height, colorTop, colorBottom, borderColor) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.fillStyle(0x0d0d0d, 0.8);
        graphics.fillRoundedRect(-halfW - 1, -halfH - 1, width + 2, height + 2, 6);

        graphics.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1);
        graphics.fillRoundedRect(-halfW, -halfH, width, height, 5);

        graphics.lineStyle(1.5, borderColor, 0.9);
        graphics.strokeRoundedRect(-halfW + 1, -halfH + 1, width - 2, height - 2, 4);
    }

    handleInteraction(obj) {
        const type = obj.getData('type');
        const msgs = this.gameData.uiMessages;

        if (type === 'book') {
            this.sfxPageFlip.play();

            let isCorrect = (obj.getData('id') === this.gameState.correctBookIndex);
            let textClue = obj.getData('clue');

            if (isCorrect && !this.gameState.hasSpell) {
                this.gameState.hasSpell = true;
                this.sfxSpellLearned.play();

                this.uiText.setText(msgs.spellLearned);

                let particles = this.add.particles(0, 0, 'bookAsset', {
                    speed: 120,
                    scale: { start: 0.02, end: 0 },
                    blendMode: 'ADD',
                    lifespan: 800,
                    tint: 0x00aaff
                });
                particles.startFollow(this.player);
                this.time.delayedCall(1000, () => particles.destroy());
            } else {
                this.uiText.setText(textClue);
            }
        }

        if (type === 'statue') {
            if (!this.gameState.hasSpell) {
                this.uiText.setText(msgs.needSpell);
                return;
            }
            if (this.gameState.hasLighter) return;

            this.sfxStatueMove.play();

            let id = obj.getData('id');
            this.gameState.statueAngles[id] = (this.gameState.statueAngles[id] + 45) % 360;
            obj.getData('labelText').setText(`${this.gameState.statueAngles[id]}°`);

            if (this.gameState.statueAngles.every((angle, idx) => angle === this.gameState.correctStatueAngles[idx])) {
                this.gameState.hasLighter = true;
                this.gameState.gatesOpened.torchRoomAccess = true;
                this.sfxSuccessChime.play();

                this.uiText.setText(msgs.lighterObtained);
            }
        }

        if (type === 'torch') {
            if (!this.gameState.hasLighter) {
                this.uiText.setText(msgs.needLighter);
                return;
            }

            let id = obj.getData('id');
            let fireSprite = obj.getData('fire');
            let lightSprite = obj.getData('light');

            if (this.gameState.torchSequence.includes(id)) return;

            this.sfxTorchWhoosh.play();
            if (!this.sfxTorchCrack.isPlaying) this.sfxTorchCrack.play();

            this.gameState.torchSequence.push(id);
            fireSprite.setVisible(true).play('burn');
            lightSprite.setVisible(true);

            let step = this.gameState.torchSequence.length - 1;
            if (this.gameState.torchSequence[step] !== this.gameState.correctTorchOrder[step]) {
                this.uiText.setText(msgs.wrongTorchOrder);
                this.gameState.torchSequence = [];

                this.sfxTorchCrack.stop();

                this.children.list.forEach(child => {
                    if (child.getData && child.getData('type') === 'torch') {
                        child.getData('fire').setVisible(false).stop();
                        child.getData('light').setVisible(false);
                    }
                });
            } else if (this.gameState.torchSequence.length === 4) {
                this.sfxSuccessChime.play();
                this.uiText.setText(msgs.torchesLit);
            }
        }

        if (type === 'npc') {
            this.sfxNpcSpeak.play();
            this.triggerDialogueTree();
        }

        if (type === 'chest') {
            if (this.gameState.torchSequence.length < 4) {
                this.uiText.setText(msgs.chestLocked);
                return;
            }
            if (this.gameState.chestOpened) return;

            this.gameState.chestOpened = true;
            this.sfxOpenChest.play();

            let chestArt = obj.getData('art');
            chestArt.setTexture('chestAnimated');
            chestArt.play('chestOpen');

            this.uiText.setText(msgs.chestOpened);

            let alert = this.add.text(640, 250, "+5000 GOLD", { font: "bold 40px Arial", fill: "#ffd700", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5).setDepth(200);
            this.tweens.add({ targets: alert, y: 180, alpha: 0, duration: 2000, onComplete: () => alert.destroy() });

            this.gameState.gatesOpened.endHallwayAccess = true;
            this.openEndHallway();
        }
    }

    triggerDialogueTree() {
        if (this.activeDialogueInstance) return;

        let dialogues = [];
        if (this.gameState.torchSequence.length < 4) {
            dialogues = JSON.parse(JSON.stringify(this.gameData.dialogues.unfinished));
            dialogues[4].text = dialogues[4].text.replace('{TORCH_ORDER}', this.gameState.correctTorchOrder.join(' - '));
        } else {
            dialogues = this.gameData.dialogues.finished;
        }

        this.renderDialogueWindow(dialogues, 0);
    }

    renderDialogueWindow(tree, index) {
        if (index === -1) {
            if (this.activeDialogueInstance) this.activeDialogueInstance.destroy();
            this.activeDialogueInstance = null;
            return;
        }

        if (this.activeDialogueInstance) this.activeDialogueInstance.destroy();

        const node = tree[index];
        const box = this.add.container(390, 480).setDepth(300);
        this.activeDialogueInstance = box;

        let bg = this.add.rectangle(0, 0, 500, 160, 0x000000, 0.85).setOrigin(0).setStrokeStyle(2, 0xffffff);
        let mainTxt = this.add.text(20, 20, node.text, { font: "15px Arial", fill: "#fff", wordWrap: { width: 460 } });
        box.add([bg, mainTxt]);

        node.options.forEach((opt) => {
            let optText = this.add.text(30, 80 + (opt.next * 10), `> ${opt.text}`, { font: "14px Arial", fill: "#00ff66" }).setInteractive();
            box.add(optText);
            optText.on('pointerdown', () => {
                this.sfxNpcSpeak.play();
                this.renderDialogueWindow(tree, opt.next);
            });
        });
    }

    openEndHallway() {
        let wallBreaker = this.add.rectangle(1255, 512, 30, 80, 0x00ff00, 0);
        this.physics.add.existing(wallBreaker, true);

        this.physics.add.overlap(this.player, wallBreaker, () => {
            if (!this.levelCompleted) {
                this.levelCompleted = true;
                this.victoryTriggered = true;
                this.triggerVictory();
            }
        });
    }

    triggerVictory() {
        this.isTimerRunning = false;
        if (this.gameTimerEvent) {
            this.gameTimerEvent.remove();
            this.gameTimerEvent = null;
        }
        this.sound.stopAll();
        this.scene.start("VictoryScene");
    }

    update() {
        if (this.isHintActive) {
            if (this.gameTimerEvent) this.gameTimerEvent.paused = true;
            if (this.player && this.player.body) this.player.body.setVelocity(0, 0);
            return;
        } else if (this.gameTimerEvent && this.gameTimerEvent.paused) {
            this.gameTimerEvent.paused = false;
        }

        // Update Orc enemy AI logic
        this.updateEnemy();

        if (this.victoryTriggered || this.activeDialogueInstance) {
            this.player.setVelocity(0);
            if (this.disguiseState.isDisguised) {
                this.player.play('orc_idle', true);
            } else {
                this.player.play('idle', true);
            }
            return;
        }

        this.children.list.forEach(child => {
            if (child.getData && child.getData('type') === 'torch' && child.getData('light').visible) {
                child.getData('light').setAlpha(Phaser.Math.FloatBetween(0.12, 0.25));
            }
        });

        const speed = 180;
        this.player.setVelocity(0);
        let moving = false;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed); this.player.setFlipX(true); moving = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed); this.player.setFlipX(false); moving = true;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed); moving = true;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed); moving = true;
        }

        // Play appropriate walk / idle animation depending on disguise state
        const walkAnim = this.disguiseState.isDisguised ? 'orc_walk' : 'walk';
        const idleAnim = this.disguiseState.isDisguised ? 'orc_idle' : 'idle';

        if (moving) {
            this.player.play(walkAnim, true);
        } else {
            this.player.play(idleAnim, true);
        }

        this.physics.overlap(this.player, this.interactables, (p, obj) => {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                this.handleInteraction(obj);
            }
        });
    }

    createTimerHUD() {
        this.timerContainer = this.add.container(640, 50).setDepth(90);

        let frameGraphics = this.add.graphics();
        this.drawTimerFrame(frameGraphics, 180, 80);

        this.timerText = this.add.text(0, -15, this.formatTime(this.timeRemaining), {
            fontFamily: "FirlestFont",
            fontSize: "32px",
            fill: "#ffe066",
            stroke: "#3a0007",
            strokeThickness: 5,
            shadow: { offsetX: 0, offsetY: 0, color: "#ff8800", blur: 10, fill: true }
        }).setOrigin(0.5);

        let btnMinus = this.createAdjustButton(-45, 20, 60, 28, "-5", () => {
            this.adjustTime(-5);
        });

        let btnPlus = this.createAdjustButton(45, 20, 60, 28, "+5", () => {
            this.adjustTime(+5);
        });

        this.timerContainer.add([frameGraphics, this.timerText, btnMinus, btnPlus]);
    }

    tickTimer() {
        if (this.isHintActive || !this.isTimerRunning || this.levelCompleted) return;

        this.timeRemaining--;

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.timerText.setText("00:00");
            this.triggerDefeat();
        } else {
            this.timerText.setText(this.formatTime(this.timeRemaining));

            if (this.timeRemaining <= 10) {
                this.timerText.setFill('#ff3333');
            } else {
                this.timerText.setFill('#ffe066');
            }
        }
    }

    adjustTime(seconds) {
        if (!this.isTimerRunning) return;

        if (this.clickSfx) this.clickSfx.play();

        this.timeRemaining += seconds;

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.timerText.setText("00:00");
            this.triggerDefeat();
        } else {
            this.timerText.setText(this.formatTime(this.timeRemaining));
        }

        this.tweens.add({
            targets: this.timerText,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    triggerDefeat() {
        if (!this.isTimerRunning) return;
        this.isTimerRunning = false;

        if (this.gameTimerEvent) this.gameTimerEvent.remove();
        this.sound.stopAll();

        this.scene.start("DefeatScene");
    }

    formatTime(seconds) {
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;
        let mm = mins < 10 ? `0${mins}` : `${mins}`;
        let ss = secs < 10 ? `0${secs}` : `${secs}`;
        return `${mm}:${ss}`;
    }

    drawTimerFrame(graphics, width, height) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.fillStyle(0x0a0a0a, 0.85);
        graphics.fillRoundedRect(-halfW - 3, -halfH - 3, width + 6, height + 6, 12);

        graphics.fillGradientStyle(0x2d2b2b, 0x2d2b2b, 0x181717, 0x181717, 0.95);
        graphics.fillRoundedRect(-halfW, -halfH, width, height, 10);

        graphics.lineStyle(3, 0x6e6868, 0.8);
        graphics.strokeRoundedRect(-halfW + 2, -halfH + 2, width - 4, height - 4, 8);

        graphics.lineStyle(2, 0xffaa00, 0.9);
        graphics.strokeRoundedRect(-halfW + 5, -halfH + 5, width - 10, height - 10, 6);
    }

    createAdjustButton(x, y, width, height, labelText, onClick) {
        let container = this.add.container(x, y);

        let btnBg = this.add.graphics();
        this.drawTimerButton(btnBg, width, height, 0x3d3a3a, 0x1f1d1d, 0x888888);

        let text = this.add.text(0, 0, labelText, {
            fontFamily: "FirlestFont",
            fontSize: "16px",
            fill: "#e0e0e0",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        container.add([btnBg, text]);

        let hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerover', () => {
            this.drawTimerButton(btnBg, width, height, 0x5a5555, 0x2e2a2a, 0x00ffff);
            text.setFill('#00ffff');
            this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });

        hitArea.on('pointerout', () => {
            this.drawTimerButton(btnBg, width, height, 0x3d3a3a, 0x1f1d1d, 0x888888);
            text.setFill('#e0e0e0');
            this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 100 });
        });

        hitArea.on('pointerdown', onClick);

        return container;
    }

    drawTimerButton(graphics, width, height, colorTop, colorBottom, borderColor) {
        graphics.clear();
        let halfW = width / 2;
        let halfH = height / 2;

        graphics.fillStyle(0x0d0d0d, 0.8);
        graphics.fillRoundedRect(-halfW - 1, -halfH - 1, width + 2, height + 2, 6);

        graphics.fillGradientStyle(colorTop, colorTop, colorBottom, colorBottom, 1);
        graphics.fillRoundedRect(-halfW, -halfH, width, height, 5);

        graphics.lineStyle(1.5, borderColor, 0.9);
        graphics.strokeRoundedRect(-halfW + 1, -halfH + 1, width - 2, height - 2, 4);
    }

    // --- INITIALIZE ENEMY ---
    initEnemy() {
        if (!this.gameData || !this.gameData.enemy) return;

        const enemyConfig = this.gameData.enemy;
        const spawnPoints = enemyConfig.spawnPoints || [{ x: enemyConfig.spawnX, y: enemyConfig.spawnY }];
        this.enemies = [];

        spawnPoints.forEach((spawn, index) => {
            const spawnX = spawn.x ?? enemyConfig.spawnX;
            const spawnY = spawn.y ?? enemyConfig.spawnY;
            const hitbox = spawn.hitbox || enemyConfig.hitbox;

            const enemy = this.physics.add.sprite(spawnX, spawnY, 'orc').setScale(1.45).setCollideWorldBounds(true);

            if (hitbox) {
                enemy.body.setCircle(hitbox.hRadius, (100 - hitbox.hRadius * 2) / 2, (100 - hitbox.vRadius * 2) / 2);
            }

            enemy.setData('index', index);
            enemy.play('orc_idle');
            this.enemies.push(enemy);
        });
    }

    // --- UPDATE ENEMY AI & MOVEMENT ---
    updateEnemy() {
        if (!this.enemies || this.enemies.length === 0 || !this.player || this.isHintActive || this.levelCompleted || !this.isTimerRunning) return;

        const { speed, detectRadius } = this.gameData.enemy;

        this.enemies.forEach((enemy) => {
            if (!enemy || !enemy.body) return;

            // IF DISGUISED: Orcs do not attack or trigger defeat
            if (this.disguiseState.isDisguised) {
                enemy.setVelocity(0, 0);
                enemy.play('orc_idle', true);
                return;
            }

            const distance = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );

            if (distance <= detectRadius) {
                const moveSpeed = speed * 60;
                this.physics.moveToObject(enemy, this.player, moveSpeed);

                if (this.player.x < enemy.x) {
                    enemy.setFlipX(true);
                } else {
                    enemy.setFlipX(false);
                }

                enemy.play('orc_walk', true);

                if (distance < 30) {
                    this.triggerDefeat();
                }
            } else {
                enemy.setVelocity(0, 0);
                enemy.play('orc_idle', true);
            }
        });
    }
}