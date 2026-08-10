import MenuScene from "./MenuScene.js";

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

        this.timerText = null;
        this.timerEvent = null;

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
        this.load.json('levelData', 'data/levelData.json');

        this.load.spritesheet('character', 'sprite/character.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('bookAsset', 'sprite/book.png');
        this.load.image('dragonAsset', 'sprite/dragon.png');
        this.load.image('npcAsset', 'sprite/npc.png');
        this.load.image('torchAsset', 'sprite/torch.png'); 
        this.load.spritesheet('torchAnimated', 'sprite/torch_animated.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('chestStatic', 'sprite/Wooden Chest 2 - frame  00.png'); 
        this.load.spritesheet('chestAnimated', 'sprite/Wooden Chest 2 - Spritesheet.png', { frameWidth: 48, frameHeight: 32 });
        
        // ขนาดที่ถูกต้อง 100x100
        this.load.spritesheet('orc', 'sprite/Orc.png', { frameWidth: 100, frameHeight: 100 }); 

        this.load.tilemapTiledJSON('dungeonMap', 'assets/dungeonv4.json');
        this.load.image('dungeonTiles', 'tileset/Dungeon_FloorsWallsA5.png');

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
        this.gameData = this.cache.json.get('levelData');
        this.enemies = []; // อาร์เรย์เก็บศัตรู
        
        this.timeLimit = this.gameData.config.timeLimit;
        const vols = this.gameData.config.volumes;

        let pauseButton = this.add.text(
            this.gameData.positions.pauseButton.x,
            this.gameData.positions.pauseButton.y,
            "||",
            { fontSize: "30px", color: "#ff0000", backgroundColor: "#333333", padding: { x: 15, y: 10 } }
        ).setInteractive();

        pauseButton.on("pointerdown", () => {
            this.scene.pause();
            this.scene.launch("PauseScene");
        });
        
        this.interactables = this.physics.add.staticGroup();

        this.timerText = this.add.text(
            this.scale.width / 2, 50, 
            `TIME: ${this.formatTime(this.timeLimit)}`, 
            { fontSize: "36px", fontFamily: "Arial Black", fill: "#ff0000", stroke: "#ffffff", strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(200);

        this.timerEvent = this.time.addEvent({ delay: 1000, callback: this.onTimerTick, callbackScope: this, loop: true });

        this.sfxSfxBgMusic = this.sound.add('bgMusic', { volume: vols.bgm, loop: true });
        this.sfxSfxBgMusic.play();

        this.sfxNpcSpeak = this.sound.add('npcSpeak', { volume: vols.sfx });
        this.sfxStatueMove = this.sound.add('statueMove', { volume: vols.loudSfx });
        this.sfxTorchWhoosh = this.sound.add('torchWhoosh', { volume: vols.sfx });
        this.sfxTorchCrack = this.sound.add('torchCrack', { volume: 0.4, loop: true });
        this.sfxPageFlip = this.sound.add('pageFlip', { volume: vols.sfx });
        this.sfxSuccessMission = this.sound.add('successMission', { volume: vols.loudSfx });
        this.sfxSpellLearned = this.sound.add('spellLearned', { volume: vols.loudSfx });
        this.sfxSuccessChime = this.sound.add('successChime', { volume: vols.loudSfx });
        this.sfxOpenChest = this.sound.add('openChest', { volume: vols.loudSfx });

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

        this.gameState.correctBookIndex = Phaser.Math.Between(0, 4);

        let torchPool = [1, 2, 3, 4];
        this.gameState.correctTorchOrder = Phaser.Utils.Array.Shuffle(torchPool);

        let angleClues = [];
        const possibleAngles = this.gameData.puzzle.possibleAngles;
        const colors = this.gameData.puzzle.colors;

        for (let i = 0; i < 4; i++) {
            let randAngle = possibleAngles[Phaser.Math.Between(0, possibleAngles.length - 1)];
            this.gameState.correctStatueAngles.push(randAngle);
            this.gameState.statueAngles[i] = (randAngle + 90) % 360;
            angleClues.push(`${colors[i]} = ${randAngle}°`);
        }

        let clueIndex = 0;
        const bookClues = [];
        for (let i = 0; i < 5; i++) {
            if (i === this.gameState.correctBookIndex) {
                bookClues.push("✨ This book contains the ancient Magic Spell scroll! ✨");
            } else {
                bookClues.push(`📜 Clue Fragment: "${angleClues[clueIndex]}"`);
                clueIndex++;
            }
        }

        const titleStyle = { font: "bold 15px Arial", fill: "#ffffff", stroke: "#000000", strokeThickness: 4 };

        this.add.text(90, 35, this.gameData.texts.library, { ...titleStyle, fill: "#88ccff" }).setDepth(10);
        const bookPos = this.gameData.positions.books;
        for (let i = 0; i < 5; i++) {
            let posX = bookPos.startX + (i * bookPos.spacingX);
            let posY = bookPos.y;
            this.add.circle(posX, posY, 18, 0x5d4037).setStrokeStyle(2, 0xd7ccc8);
            this.add.sprite(posX, posY, 'bookAsset').setScale(0.04);

            let hitZone = this.add.rectangle(posX, posY, 48, 48, 0x000, 0).setInteractive();
            this.interactables.add(hitZone);
            this.add.text(posX, posY + 24, `${i + 1}`, { font: "bold 12px Arial", fill: "#ffffff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
            hitZone.setData('type', 'book').setData('id', i).setData('clue', bookClues[i]);
        }

        this.add.text(90, 380, this.gameData.texts.dragon, { ...titleStyle, fill: "#ffcc88" }).setDepth(10);
        const dragonPos = this.gameData.positions.dragons;
        const hexColors = this.gameData.puzzle.hexColors.map(h => parseInt(h, 16)); 
        
        for (let i = 0; i < 4; i++) {
            let posX = dragonPos[i].x;
            let posY = dragonPos[i].y;
            let dragon = this.add.sprite(posX, posY, 'dragonAsset').setTint(hexColors[i]).setScale(0.045);

            let dragonHitZone = this.add.rectangle(posX, posY, 50, 60, 0x000, 0).setInteractive();
            this.interactables.add(dragonHitZone);
            dragonHitZone.setData('type', 'statue').setData('id', i).setData('art', dragon);

            let label = this.add.text(posX, posY - 28, `${this.gameState.statueAngles[i]}°`, { font: "bold 13px monospace", fill: "#000000", stroke: "#ffffff", strokeThickness: 3 }).setOrigin(0.5).setDepth(5);
            dragonHitZone.setData('labelText', label);
        }

        this.add.text(810, 35, this.gameData.texts.torch, { ...titleStyle, fill: "#ff8888" }).setDepth(10);
        if (!this.anims.exists('burn')) {
            this.anims.create({ key: 'burn', frames: this.anims.generateFrameNumbers('torchAnimated', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
        }

        const torchPos = this.gameData.positions.torches;
        for (let i = 0; i < 4; i++) {
            let posX = torchPos.startX + (i * torchPos.spacingX);
            let posY = torchPos.y;
            this.add.sprite(posX, posY, 'torchAsset');
            let fire = this.add.sprite(posX, posY - 17, 'torchAnimated').setVisible(false).setScale(0.7);
            let hitArea = this.add.rectangle(posX, posY, 50, 60, 0x000, 0).setInteractive();
            let light = this.add.circle(posX, posY - 17, 50, 0xffaa00, 0.15).setVisible(false);

            this.interactables.add(hitArea);
            hitArea.setData('type', 'torch').setData('id', i + 1).setData('fire', fire).setData('light', light);
            this.add.text(posX, posY + 24, `${i + 1}`, { font: "bold 12px monospace", fill: "#ffffff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
        }

        this.add.text(810, 380, this.gameData.texts.treasure, { ...titleStyle, fill: "#88ff88" }).setDepth(10);

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
            this.anims.create({ key: 'chestOpen', frames: this.anims.generateFrameNumbers('chestAnimated', { start: 0, end: 4 }), frameRate: 8, repeat: 0 });
        }

        const pSpawn = this.gameData.positions.playerSpawn;
        this.player = this.physics.add.sprite(pSpawn.x, pSpawn.y, 'character', 0).setScale(1.2).setCollideWorldBounds(true);

        this.wallLayer = map.getLayer('Wall Layers') ? map.getLayer('Wall Layers').tilemapLayer : null;
        this.wall2Layer = map.getLayer('Wall 2 Layers') ? map.getLayer('Wall 2 Layers').tilemapLayer : null;
        
        if (this.wallLayer) this.physics.add.collider(this.player, this.wallLayer);
        if (this.wall2Layer) this.physics.add.collider(this.player, this.wall2Layer);

        this.add.rectangle(640, 685, 1200, 40, 0x000000, 0.75).setDepth(100);
        this.uiText = this.add.text(40, 675, this.gameData.texts.objective, { font: "15px Arial", fill: "#ffffff" }).setDepth(101);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
        });

        if (!this.anims.exists('idle')) this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        if (!this.anims.exists('walk')) this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
        this.player.play('idle');

        // สร้างศัตรู
        this.initEnemy(); 
    }

    initEnemy() {
        const { spawnX, spawnY } = this.gameData.config.enemy;
        
        // จุดเกิดศัตรู 3 จุด
        const spawnPoints = [
            { x: spawnX, y: spawnY }, 
            { x: 900, y: 250 },      
            { x: 900, y: 480 }       
        ];

        // สร้างอนิเมชั่น (คืนค่าตัวเลขเฟรมที่ถูกต้อง ไม่ดึงช่องว่างมากระพริบ)
        if (!this.anims.exists('orc-idle')) {
            this.anims.create({ key: 'orc-idle', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        }
        if (!this.anims.exists('orc-walk')) {
            this.anims.create({ key: 'orc-walk', frames: this.anims.generateFrameNumbers('orc', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists('orc-attack')) {
            this.anims.create({ key: 'orc-attack', frames: this.anims.generateFrameNumbers('orc', { start: 16, end: 21 }), frameRate: 12, repeat: -1 });
        }

        spawnPoints.forEach(pos => {
            let enemy = this.physics.add.sprite(pos.x, pos.y, 'orc', 0).setScale(2);
            enemy.setCollideWorldBounds(true); 

            if (this.wallLayer) this.physics.add.collider(enemy, this.wallLayer);
            if (this.wall2Layer) this.physics.add.collider(enemy, this.wall2Layer);
            
            enemy.play('orc-idle');
            this.enemies.push(enemy);
        });
    }

    onTimerTick() {
        if (this.victoryTriggered) return; 
        this.timeLimit--;
        this.timerText.setText(`TIME: ${this.formatTime(this.timeLimit)}`);
        if (this.timeLimit <= 0) this.triggerGameOver();
    }

    triggerGameOver() {
        if (this.timerEvent) this.timerEvent.remove();
        if (this.sfxSfxBgMusic) this.sfxSfxBgMusic.stop();
        if (this.sfxTorchCrack) this.sfxTorchCrack.stop();
        
        this.player.setVelocity(0);
        this.player.play('idle', true);
        
        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.setVelocity(0);
                enemy.play('orc-idle', true);
            }
        });

        this.scene.start("Menulose");
        this.scene.stop("GameplayScene");
    }

    handleInteraction(obj) {
        const type = obj.getData('type');

        if (type === 'book') {
            this.sfxPageFlip.play();
            let isCorrect = (obj.getData('id') === this.gameState.correctBookIndex);
            let textClue = obj.getData('clue');

            if (isCorrect && !this.gameState.hasSpell) {
                this.gameState.hasSpell = true;
                this.sfxSpellLearned.play();
                this.uiText.setText("✨ Magic spell learned! Rotate the Dragon Statues in the bottom-left chamber.");

                let particles = this.add.particles(0, 0, 'bookAsset', {
                    speed: 120, scale: { start: 0.02, end: 0 }, blendMode: 'ADD',
                    lifespan: 800, tint: 0x00aaff
                });
                particles.startFollow(this.player);
                this.time.delayedCall(1000, () => particles.destroy());
            } else {
                this.uiText.setText(textClue);
            }
        }

        if (type === 'statue') {
            if (!this.gameState.hasSpell) {
                this.uiText.setText("🔒 The dragons are completely static. You need a magic spell!");
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
                this.uiText.setText("⚡ Success! Dragons aligned. Obtained the LIGHTER! Proceed to the Torch Room (top right).");
            }
        }

        if (type === 'torch') {
            if (!this.gameState.hasLighter) {
                this.uiText.setText("❌ You cannot ignite these torches. You need the Lighter!");
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
                this.uiText.setText("💨 Wrong order! The flames fizzle out. Start over!");
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
                this.uiText.setText("🔥 Fantastic! All torches burning. Speak to the NPC in the Treasure Room.");
            }
        }

        if (type === 'npc') {
            this.sfxNpcSpeak.play();
            this.triggerDialogueTree();
        }

        if (type === 'chest') {
            if (this.gameState.torchSequence.length < 4) {
                this.uiText.setText("The treasure chest is locked down tight by protective spells.");
                return;
            }
            if (this.gameState.chestOpened) return;

            this.gameState.chestOpened = true;
            this.sfxOpenChest.play();

            let chestArt = obj.getData('art');
            chestArt.setTexture('chestAnimated');
            chestArt.play('chestOpen');
            this.uiText.setText("💰 Opened! Found legendary relic contents. Head right through the wall opening to complete the level!");

            let alert = this.add.text(640, 250, "+5000 GOLD", { font: "bold 40px Arial", fill: "#ffd700", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5).setDepth(200);
            this.tweens.add({ targets: alert, y: 180, alpha: 0, duration: 2000, onComplete: () => alert.destroy() });

            this.gameState.gatesOpened.endHallwayAccess = true;
            this.openEndHallway();
        }
    }

    triggerDialogueTree() {
        if (this.activeDialogueInstance) return;

        let dialoguesData = [];
        if (this.gameState.torchSequence.length < 4) {
            dialoguesData = JSON.parse(JSON.stringify(this.gameData.dialogues.prePuzzle)); 
            dialoguesData[4].text = dialoguesData[4].text.replace(
                "{TORCH_ORDER}", 
                this.gameState.correctTorchOrder.join(' - ')
            );
        } else {
            dialoguesData = this.gameData.dialogues.postPuzzle;
        }

        this.renderDialogueWindow(dialoguesData, 0);
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

        node.options.forEach((opt, i) => {
            let optText = this.add.text(30, 80 + (i * 30), `> ${opt.text}`, { font: "14px Arial", fill: "#00ff66" }).setInteractive();
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
            if (!this.victoryTriggered) {
                this.victoryTriggered = true;
                this.triggerVictoryScene();
            }
        });
    }

    triggerVictoryScene() {
        if (this.timerEvent) this.timerEvent.remove();
        this.player.setVelocity(0);
        this.physics.world.colliders.destroy();

        if (this.sfxSfxBgMusic) this.sfxSfxBgMusic.stop();
        if (this.sfxTorchCrack) this.sfxTorchCrack.stop();
        this.sfxSuccessMission.play();

        this.scene.start("Menuwin");
        this.scene.stop("GameplayScene");
    }

    update() {
        if (this.victoryTriggered || this.activeDialogueInstance) {
            this.player.setVelocity(0);
            this.player.play('idle', true);
            
            this.enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    enemy.setVelocity(0);
                    enemy.play('orc-idle', true);
                }
            });
            return;
        }

        this.children.list.forEach(child => {
            if (child.getData && child.getData('type') === 'torch' && child.getData('light').visible) {
                child.getData('light').setAlpha(Phaser.Math.FloatBetween(0.12, 0.25));
            }
        });

        const detectRadius = this.gameData.config.enemy.detectRadius;
        const enemySpeed = this.gameData.config.enemy.speed * 60; 
        const attackRange = 60; 

        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

                if (distance <= attackRange) {
                    enemy.setVelocity(0);
                    enemy.play('orc-attack', true);
                    enemy.setFlipX(this.player.x < enemy.x);
                } else if (distance <= detectRadius) {
                    this.physics.moveToObject(enemy, this.player, enemySpeed);
                    enemy.play('orc-walk', true);

                    if (enemy.body.velocity.x < 0) {
                        enemy.setFlipX(true);
                    } else if (enemy.body.velocity.x > 0) {
                        enemy.setFlipX(false);
                    }
                } else {
                    enemy.setVelocity(0);
                    enemy.play('orc-idle', true);
                }
            }
        });

        const speed = this.gameData.config.playerSpeed;
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

        if (moving) {
            this.player.play('walk', true);
        } else {
            this.player.play('idle', true);
        }

        this.physics.overlap(this.player, this.interactables, (p, obj) => {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                this.handleInteraction(obj);
            }
        });
    }

    formatTime(seconds) {
        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}