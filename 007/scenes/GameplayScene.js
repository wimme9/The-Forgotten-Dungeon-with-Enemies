// ---------------------------------------------------------------
// GameplayScene.js
//
// เค้าโครงห้อง, ลำดับปริศนา, ข้อความ, ตำแหน่งวัตถุ ฯลฯ ทั้งหมด
// ถูกย้ายออกไปอยู่ใน assetes/data/gameData.json แล้ว
// ไฟล์นี้เหลือเฉพาะ "Logic" การทำงานของเกมเท่านั้น
//
// ⚠️ หมายเหตุ: กำแพงจริง (การชน) มาจาก tilemap (map.tmj)
// gameData.json -> walls[].gap ใช้กำหนดตำแหน่งกล่องประตูล็อกสีแดง
// ให้ตรงกับช่องประตูในแมพจริงเท่านั้น ไม่ได้ใช้ชนจริง
// ---------------------------------------------------------------

export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");

        // ---------- ข้อมูลเกมที่โหลดมาจาก gameData.json (ตั้งค่าใน create()) ----------
        this.gameData = null;

        // ---------- ตัวแปรที่เคยเป็น let ระดับ global ----------
        this.player = null;
        this.wallsLayer = null;
        this.lockedDoors = null;
        this.doorBarriers = {};

        // ---------- ศัตรู (Orc) : ไล่ตามผู้เล่นเมื่ออยู่ในระยะ แต่เดินได้แค่ในห้องของตัวเอง ----------
        // รองรับหลายตัวพร้อมกัน แต่ละตัวเก็บ { sprite, data, attackTimer, roomGfx }
        this.enemies = [];

        this.cursors = null;
        this.keyW = null;
        this.keyA = null;
        this.keyS = null;
        this.keyD = null;
        this.keyE = null;

        this.speed = 150;
        this.moving = false;

        this.promptText = null;
        this.messageBox = null;
        this.messageText = null;
        this.hudText = null;
        this.messageTimer = null;

        this.interactables = [];
        this.winZone = null;

        this.torchFlickerTime = 0;
        this.footstepTimer = 0;

        this.audioCtx = null;

        // ---------- ระบบ "แสงแห่งสติ" (Sanity Light) : เงื่อนไขการแพ้ ----------
        // ค่อยๆ ลดลงตามเวลาที่อยู่ในความมืดของดันเจี้ยน, ลดแรงเมื่อโดนกับดักหรือทำผิดพลาด
        // ถ้าลดถึง 0 => ผู้เล่นหลงทางในความมืดตลอดกาล (Game Over)
        this.sanityBarBg = null;
        this.sanityBarFill = null;
        this.sanityLabel = null;
        this.sanityDrainTimer = 0;
        this.sanityLowWarned = false;

        this.gameState = {
            scrollCollected: false,
            statueSolved: false,
            torchSolved: false,
            torchNextExpected: 0,
            npcStep: 0,
            npcDone: false,
            keyCollected: false,
            gameWon: false,
            gameLost: false,
            sanity: 100,
            maxSanity: 100
        };
    }

    preload() {
        // ---------- ข้อมูลเกม (ไม่มี logic ใดๆ อยู่ในไฟล์นี้) ----------
        this.load.json('gameData', 'data/gameData.json');

        this.load.image('ground', 'assetes/images/tile.jpg');
        this.load.spritesheet('player', 'assetes/sprites/AnimationSheet_Character.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.tilemapTiledJSON('dungeonMap', 'assetes/map.tmj');
        this.load.image('walls_floor', 'assetes/sprites/walls_floor.png');
        this.load.image('Objects', 'assetes/sprites/Objects.png');

        this.load.svg('book',   'assetes/images/book.svg',   { width: 64, height: 64 });
        this.load.svg('statue', 'assetes/images/statue.svg', { width: 64, height: 96 });
        this.load.svg('torch',  'assetes/images/torch.svg',  { width: 40, height: 64 });
        this.load.svg('npc',    'assetes/images/npc.svg',    { width: 32, height: 48 });
        this.load.svg('chest',  'assetes/images/chest.svg',  { width: 56, height: 48 });

        this.load.svg('floorTile', 'assetes/images/floor_tile.svg', { width: 128, height: 128 });
        this.load.svg('vignette',  'assetes/images/vignette.svg',   { width: 900, height: 600 });

        this.load.spritesheet('orc', 'assetes/sprites/Orc.png', { frameWidth: 100, frameHeight: 100 });
    }

    create() {
        // ---------- โหลดข้อมูลเกมจาก JSON (cache) ----------
        this.gameData = this.cache.json.get('gameData');

        // รีเซ็ตสถานะทุกครั้งที่ scene เริ่มใหม่ (กันข้อมูลเก่าค้างตอน restart)
        this.interactables = [];
        this.doorBarriers = {};
        this.sanityDrainTimer = 0;
        this.sanityLowWarned = false;
        this.enemies = [];
        this.speed = this.gameData.player.speed;

        this.gameState = {
            scrollCollected: false,
            statueSolved: false,
            torchSolved: false,
            torchNextExpected: 0,
            npcStep: 0,
            npcDone: false,
            keyCollected: false,
            gameWon: false,
            gameLost: false,
            sanity: this.gameData.sanity.max,
            maxSanity: this.gameData.sanity.max
        };

        // ---------- Keyboard ----------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // ---------- สร้างแมพจาก tilemap ----------
        const map = this.make.tilemap({ key: 'dungeonMap' });
        const tileset = map.addTilesetImage('walls_floor', 'walls_floor');

        this.wallsLayer = map.createLayer('Wall Layer', tileset, 0, 0);
        this.wallsLayer.setCollisionByExclusion([0, -1]);

        const floorLayer = map.createLayer('Floor Layer', tileset, 0, 0);
        floorLayer.setDepth(-1.5);

        const objectsTileset = map.addTilesetImage('Objects', 'Objects');
        const objectLayer = map.createLayer('Object Layer', [tileset, objectsTileset], 0, 0);
        objectLayer.setDepth(0.15);

        console.log('floorLayer:', floorLayer, 'objectLayer:', objectLayer);

        const WORLD_W = map.widthInPixels;
        const WORLD_H = map.heightInPixels;

        // ---------- ขอบเขตโลก / กล้อง ----------
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

        // ---------- สร้าง texture แบบ procedural ----------
        this.generateGlowTexture();
        this.generateShadowTexture();
        this.generateEmberTexture();
        this.generateDustTexture();
        this.generateBeamTexture();

        // ---------- ฉากหลัง ----------
        this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'floorTile')
            .setDepth(-2);

        const tintGfx = this.add.graphics().setDepth(-1);
        this.gameData.roomTints.forEach(r => {
            tintGfx.fillStyle(Number(r.color), 0.35);
            tintGfx.fillRect(r.x, r.y, r.w, r.h);
        });

        this.createRoomDecorations();

        this.add.image(WORLD_W / 2, WORLD_H / 2, 'vignette')
            .setScrollFactor(0)
            .setDepth(15);

        // ---------- ป้ายชื่อห้อง ----------
        this.gameData.roomLabels.forEach(l => {
            this.add.text(l.x, l.y, l.text, {
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(1);
        });

        this.wallsLayer.setDepth(0.2);

        // ---------- ประตูล็อก ----------
        this.lockedDoors = this.physics.add.staticGroup();
        this.gameData.locks.forEach(lock => this.buildDoorBarrier(lock));

        // ---------- Player ----------
        this.player = this.physics.add.sprite(this.gameData.player.startX, this.gameData.player.startY, 'player');
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.wallsLayer);
        this.physics.add.collider(this.player, this.lockedDoors);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // ---------- Animation ----------
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
            frameRate: 8,
            repeat: -1
        });
        this.player.play('idle');

        // ---------- MISSION 1: ห้องสมุด ----------
        const libraryData = this.gameData.missions.library;
        libraryData.bookXs.forEach((x, i) => {
            this.addDropShadow(x, libraryData.bookY + 30, 34, 12, 0.3);
            const book = this.add.sprite(x, libraryData.bookY, 'book').setScale(1.1).setDepth(1);
            this.interactables.push({ sprite: book, type: 'book', index: i, used: false });
        });

        // ---------- MISSION 2: ห้องรูปปั้น ----------
        const statueData = this.gameData.missions.statue;
        statueData.statueXs.forEach((x, i) => {
            this.addDropShadow(x, statueData.statueY + 46, 46, 16, 0.35);
            const statue = this.add.sprite(x, statueData.statueY, 'statue').setScale(0.9).setDepth(1);
            statue.setAngle(0);

            const check = this.add.text(x, statueData.statueY - 62, '✔', {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#33dd55',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(2).setVisible(false);

            this.interactables.push({
                sprite: statue,
                type: 'statue',
                index: i,
                rotation: 0,
                checkmark: check
            });
        });

        // ---------- MISSION 3: ห้องคบเพลิง ----------
        const torchData = this.gameData.missions.torch;
        torchData.torchXs.forEach((x, i) => {
            const shadow = this.addDropShadow(x, torchData.torchY + 30, 40, 14, 0.22);

            const glow = this.add.image(x, torchData.torchY, 'torchGlow')
                .setScale(1.2)
                .setDepth(0.6)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setVisible(false);

            const torch = this.add.sprite(x, torchData.torchY, 'torch').setScale(1).setDepth(1);
            torch.setAlpha(0.4);

            const emitter = this.add.particles(x, torchData.torchY - 20, 'emberParticle', {
                speed: { min: 10, max: 30 },
                angle: { min: 260, max: 280 },
                lifespan: { min: 500, max: 1000 },
                scale: { start: 0.6, end: 0 },
                alpha: { start: 0.9, end: 0 },
                frequency: 140,
                blendMode: 'ADD'
            });
            emitter.setDepth(0.7);
            emitter.stop();

            this.interactables.push({ sprite: torch, type: 'torch', index: i, lit: false, glow, shadow, emitter });
        });

        // ---------- MISSION 4: NPC ----------
        const npcData = this.gameData.missions.npc;
        this.addDropShadow(npcData.x, npcData.y + 26, 30, 12, 0.3);
        const npc = this.add.sprite(npcData.x, npcData.y, 'npc').setScale(1.3).setDepth(1);
        this.interactables.push({ sprite: npc, type: 'npc', index: 0 });

        // ---------- ศัตรู: Orc เฝ้าห้อง 4 (หลายตัว) ----------
        this.initEnemies();

        // ---------- MISSION 5: ห้องกล่อง ----------
        const chestData = this.gameData.missions.chest;
        chestData.chestXs.forEach((x, i) => {
            this.addDropShadow(x, chestData.chestY + 24, 40, 14, 0.3);
            const chest = this.add.sprite(x, chestData.chestY, 'chest').setScale(1).setDepth(1);
            this.interactables.push({ sprite: chest, type: 'chest', index: i, opened: false });
        });

        // ---------- ประตูทางออก ----------
        const exitData = this.gameData.exitZone;
        const exitGfx = this.add.graphics();
        exitGfx.fillStyle(0xffd700, 0.5);
        exitGfx.fillRect(exitData.graphicsX, exitData.graphicsY, exitData.graphicsW, exitData.graphicsH);
        this.winZone = this.add.zone(exitData.zoneX, exitData.zoneY, exitData.zoneW, exitData.zoneH);
        this.physics.world.enable(this.winZone, Phaser.Physics.Arcade.STATIC_BODY);

        this.physics.add.overlap(this.player, this.winZone, this.tryWin, null, this);

        // ---------- UI: กล่องข้อความ ----------
        this.messageBox = this.add.rectangle(450, 555, 860, 60, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(20).setVisible(false);
        this.messageText = this.add.text(450, 555, '', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 820 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21).setVisible(false);

        // ---------- UI: HUD ----------
        this.hudText = this.add.text(10, 10, '', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '14px',
            color: '#ffe08a'
        }).setScrollFactor(0).setDepth(20);

        // ---------- UI: แถบแสงแห่งสติ (Sanity Light Bar) ----------
        this.sanityLabel = this.add.text(10, 32, 'แสงแห่งสติ', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '12px',
            color: '#cfcfe0'
        }).setScrollFactor(0).setDepth(20);

        this.sanityBarBg = this.add.rectangle(10, 50, 150, 12, 0x000000, 0.55)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(20)
            .setStrokeStyle(1, 0x1a1a22, 1);
        this.sanityBarFill = this.add.rectangle(12, 52, 146, 8, 0x66ddaa, 1)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(21);

        this.updateHud();

        // ---------- UI: prompt ----------
        this.promptText = this.add.text(0, 0, 'กด E เพื่อโต้ตอบ', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(22).setVisible(false);

        // ปุ่ม Pause
        let pauseButton = this.add.text(
            800,
            50,
            "||",
            {
                fontSize:"30px",
                color:"#ff0000",
                backgroundColor:"#333333",
                padding:{
                    x:15,
                    y:10
                }
            }
        );

        pauseButton.setInteractive();

        pauseButton.on(
            "pointerdown",
            ()=>{
                console.log("Pause");
                this.scene.pause();
                this.scene.launch("PauseScene");
            }
        );
    }

    update() {
        this.initAudio();

        if (this.gameState.gameWon || this.gameState.gameLost) {
            this.player.setVelocity(0, 0);
            return;
        }

        // ---------- แสงแห่งสติค่อยๆ ลดลงตามเวลาในความมืด ----------
        this.sanityDrainTimer += 16;
        if (this.sanityDrainTimer >= this.gameData.sanity.drainIntervalMs) {
            this.sanityDrainTimer = 0;
            this.adjustSanity(-this.gameData.sanity.drainAmount);
        }

        this.moving = false;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.keyA.isDown) {
            vx = -1;
            this.player.flipX = true;
            this.moving = true;
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            vx = 1;
            this.player.flipX = false;
            this.moving = true;
        }

        if (this.cursors.up.isDown || this.keyW.isDown) {
            vy = -1;
            this.moving = true;
        } else if (this.cursors.down.isDown || this.keyS.isDown) {
            vy = 1;
            this.moving = true;
        }

        if (vx !== 0 && vy !== 0) {
            const norm = Math.SQRT1_2;
            vx *= norm;
            vy *= norm;
        }

        this.player.setVelocity(vx * this.speed, vy * this.speed);
        this.player.play(this.moving ? 'walk' : 'idle', true);

        // ---------- เสียงฝีเท้า ----------
        if (this.moving) {
            this.footstepTimer += 16;
            if (this.footstepTimer >= 260) {
                this.footstepTimer = 0;
                this.sfxStep();
            }
        } else {
            this.footstepTimer = 200;
        }

        // ---------- แสงคบเพลิงกระเพื่อม ----------
        this.torchFlickerTime += 0.016;
        const flicker = 0.85 + Math.sin(this.torchFlickerTime * 4) * 0.08 + (Math.random() - 0.5) * 0.12;
        const s = Phaser.Math.Clamp(flicker, 0.6, 1.15);

        this.interactables.forEach(obj => {
            if (obj.type === 'torch' && obj.lit) {
                obj.glow.setScale(0.5 * s);
                obj.glow.setAlpha(Phaser.Math.Clamp(0.8 * s, 0.45, 1));
                if (obj.shadow) {
                    obj.shadow.setAlpha(Phaser.Math.Clamp(0.35 - (s - 0.85) * 0.3, 0.15, 0.4));
                }
            }
        });

        // ---------- ศัตรู: ไล่ตาม/โจมตี/เลิกไล่ (หลายตัว) ----------
        this.updateEnemiesAI();

        // ---------- หาสิ่งที่โต้ตอบได้ใกล้ที่สุด ----------
        let nearest = null;
        let nearestDist = 55;

        this.interactables.forEach(obj => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.sprite.x, obj.sprite.y);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = obj;
            }
        });

        if (nearest) {
            this.promptText.setVisible(true);
            this.promptText.setPosition(nearest.sprite.x, nearest.sprite.y - 40);

            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                this.interactWith(nearest);
            }
        } else {
            this.promptText.setVisible(false);
        }
    }

    // ================= Texture ที่สร้างขึ้นเอง =================

    generateGlowTexture() {
        if (this.textures.exists('torchGlow')) return;
        const size = 256;
        const tex = this.textures.createCanvas('torchGlow', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,214,130,0.95)');
        grad.addColorStop(0.35, 'rgba(255,150,50,0.55)');
        grad.addColorStop(1, 'rgba(255,90,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateShadowTexture() {
        if (this.textures.exists('softShadow')) return;
        const w = 128, h = 64;
        const tex = this.textures.createCanvas('softShadow', w, h);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        grad.addColorStop(0, 'rgba(0,0,0,0.55)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        tex.refresh();
    }

    addDropShadow(x, y, w, h, alpha) {
        return this.add.image(x, y, 'softShadow')
            .setDisplaySize(w, h)
            .setAlpha(alpha)
            .setDepth(0.3);
    }

    generateEmberTexture() {
        if (this.textures.exists('emberParticle')) return;
        const size = 16;
        const tex = this.textures.createCanvas('emberParticle', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,230,150,1)');
        grad.addColorStop(0.5, 'rgba(255,140,50,0.8)');
        grad.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateDustTexture() {
        if (this.textures.exists('dustMote')) return;
        const size = 10;
        const tex = this.textures.createCanvas('dustMote', size, size);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, 'rgba(255,240,200,0.9)');
        grad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }

    generateBeamTexture() {
        if (this.textures.exists('lightBeam')) return;
        const w = 60, h = 260;
        const tex = this.textures.createCanvas('lightBeam', w, h);
        const ctx = tex.getContext();
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(255,235,180,0.35)');
        grad.addColorStop(1, 'rgba(255,235,180,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 - 6, 0);
        ctx.lineTo(w * 0.5 + 6, 0);
        ctx.lineTo(w * 0.5 + 26, h);
        ctx.lineTo(w * 0.5 - 26, h);
        ctx.closePath();
        ctx.fill();
        tex.refresh();
    }

    addPedestal(x, y) {
        const gfx = this.add.graphics().setDepth(0.4);
        gfx.fillStyle(0x4a4a52, 1);
        gfx.fillRoundedRect(x - 26, y, 52, 14, 3);
        gfx.lineStyle(1, 0x24242a, 1);
        gfx.strokeRoundedRect(x - 26, y, 52, 14, 3);
        gfx.fillStyle(0x5c5c66, 1);
        gfx.fillRoundedRect(x - 20, y - 6, 40, 8, 2);
    }

    addPillar(x, y, height) {
        const gfx = this.add.graphics().setDepth(0.4);
        gfx.fillStyle(0x565660, 1);
        gfx.fillRect(x - 12, y, 24, height);
        gfx.lineStyle(1, 0x2a2a30, 0.9);
        gfx.strokeRect(x - 12, y, 24, height);
        for (let i = 0; i < 3; i++) {
            gfx.lineStyle(1, 0x3a3a42, 0.7);
            gfx.lineBetween(x - 12 + (i + 1) * 6, y + 4, x - 12 + (i + 1) * 6, y + height - 4);
        }
        gfx.fillStyle(0x6a6a74, 1);
        gfx.fillRect(x - 16, y - 6, 32, 8);
        gfx.fillRect(x - 16, y + height - 2, 32, 8);
    }

    addCobweb(x, y, flipX, flipY) {
        const gfx = this.add.graphics().setDepth(0.5);
        gfx.lineStyle(1, 0xdedede, 0.25);
        const sx = flipX ? -1 : 1;
        const sy = flipY ? -1 : 1;
        const r = 36;
        for (let i = 0; i <= 4; i++) {
            const a = (i / 4) * (Math.PI / 2);
            gfx.lineBetween(x, y, x + Math.cos(a) * r * sx, y + Math.sin(a) * r * sy);
        }
        for (let rr = 12; rr <= r; rr += 12) {
            gfx.beginPath();
            gfx.arc(x, y, rr, flipX ? Math.PI : 0, flipX ? (3 * Math.PI) / 2 : Math.PI / 2, false);
            gfx.strokePath();
        }
    }

    addMagicCircle(x, y) {
        const gfx = this.add.graphics();
        gfx.lineStyle(2, 0x66ddaa, 0.35);
        gfx.strokeCircle(0, 0, 46);
        gfx.lineStyle(1, 0x66ddaa, 0.3);
        gfx.strokeCircle(0, 0, 36);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            gfx.lineBetween(Math.cos(a) * 36, Math.sin(a) * 36, Math.cos(a) * 46, Math.sin(a) * 46);
        }
        const container = this.add.container(x, y, [gfx]).setDepth(0.4);
        this.tweens.add({
            targets: gfx,
            angle: 360,
            duration: 14000,
            repeat: -1
        });
        return container;
    }

    addBanner(x, y, color) {
        const gfx = this.add.graphics().setDepth(0.4);
        gfx.fillStyle(color, 0.85);
        gfx.fillRect(x - 14, y, 28, 46);
        gfx.fillTriangle(x - 14, y + 46, x + 14, y + 46, x, y + 58);
        gfx.lineStyle(1, 0x000000, 0.4);
        gfx.strokeRect(x - 14, y, 28, 46);
        gfx.fillStyle(0xffe08a, 0.7);
        gfx.fillCircle(x, y + 18, 5);
    }

    addCrate(x, y, scale = 1) {
        const gfx = this.add.graphics().setDepth(0.55);
        const w = 30 * scale, h = 24 * scale;
        gfx.fillStyle(0x7a5230, 1);
        gfx.fillRect(x - w / 2, y - h, w, h);
        gfx.lineStyle(2, 0x4a3018, 1);
        gfx.strokeRect(x - w / 2, y - h, w, h);
        gfx.lineBetween(x - w / 2, y - h / 2, x + w / 2, y - h / 2);
        gfx.lineBetween(x, y - h, x, y);
        this.addDropShadow(x, y + 4, w * 1.1, h * 0.4, 0.3);
    }

    addCoinScatter(x, y) {
        const gfx = this.add.graphics().setDepth(0.35);
        gfx.fillStyle(0xffd700, 0.9);
        gfx.lineStyle(1, 0xaa7700, 0.9);
        for (let i = 0; i < 5; i++) {
            const cx = x + (Math.random() - 0.5) * 26;
            const cy = y + (Math.random() - 0.5) * 12;
            gfx.fillCircle(cx, cy, 3 + Math.random() * 2);
            gfx.strokeCircle(cx, cy, 3 + Math.random() * 2);
        }
    }

    // ================= ลวดลายพื้นเฉพาะแต่ละห้อง =================
    // (ลวดลายตกแต่งเหล่านี้เป็นรายละเอียดภาพล้วนๆ ไม่ใช่ Game Data
    //  ที่มีผลต่อกติกาเกม จึงยังคงเก็บเป็นโค้ดในนี้ตามเดิม)

    createRoomDecorations() {
        const decoGfx = this.add.graphics().setDepth(-0.5);

        // ห้อง1 ห้องสมุด
        for (let shelf = 0; shelf < 2; shelf++) {
            const shelfY = 14 + shelf * 26;
            decoGfx.fillStyle(0x3b2a1c, 0.9);
            decoGfx.fillRect(20, shelfY, 300, 20);
            decoGfx.lineStyle(2, 0x1f150d, 0.9);
            decoGfx.strokeRect(20, shelfY, 300, 20);
            for (let b = 0; b < 22; b++) {
                const bx = 24 + b * 13.4;
                const bw = 8 + Math.random() * 4;
                const hue = [0x8b3a3a, 0x3a5f8b, 0x3a8b57, 0x8b7a3a, 0x6a3a8b][b % 5];
                decoGfx.fillStyle(hue, 0.9);
                decoGfx.fillRect(bx, shelfY + 2, bw, 16);
            }
        }

        decoGfx.fillStyle(0x6b3f3f, 0.35);
        decoGfx.fillRoundedRect(140, 160, 170, 90, 10);
        decoGfx.lineStyle(2, 0x8a5555, 0.3);
        decoGfx.strokeRoundedRect(140, 160, 170, 90, 10);

        this.addCobweb(12, 12, false, false);
        this.addCobweb(438, 12, true, false);

        const dust = this.add.particles(225, 150, 'dustMote', {
            x: { min: 20, max: 430 },
            y: { min: 20, max: 290 },
            lifespan: 6000,
            speedY: { min: -4, max: -1 },
            speedX: { min: -2, max: 2 },
            scale: { start: 0.6, end: 0.1 },
            alpha: { start: 0.35, end: 0 },
            frequency: 400,
            blendMode: 'ADD'
        });
        dust.setDepth(0.5);

        // ห้อง2 ห้องรูปปั้น
        this.gameData.missions.statue.statueXs.forEach(x => this.addPedestal(x, this.gameData.missions.statue.statueY + 30));

        decoGfx.lineStyle(2, 0x3f6b4a, 0.16);
        [[100, 450, 60], [300, 430, 45], [220, 560, 70]].forEach(([cx, cy, r]) => {
            decoGfx.strokeCircle(cx, cy, r);
        });

        decoGfx.lineStyle(1, 0x1c1c22, 0.35);
        [[40, 330, 90, 360], [90, 360, 70, 400], [380, 340, 340, 380], [340, 380, 360, 420],
         [150, 560, 190, 590], [250, 340, 290, 320]].forEach(([x1, y1, x2, y2]) => {
            decoGfx.lineBetween(x1, y1, x2, y2);
        });

        decoGfx.lineStyle(3, 0x2f5a3a, 0.4);
        [20, 430].forEach(wx => {
            let py = 305;
            decoGfx.beginPath();
            decoGfx.moveTo(wx, py);
            for (let i = 0; i < 5; i++) {
                py += 30;
                decoGfx.lineTo(wx + (i % 2 === 0 ? 10 : -10), py);
            }
            decoGfx.strokePath();
        });

        decoGfx.fillStyle(0x5a4530, 1);
        decoGfx.fillRect(28, 560, 24, 20);
        decoGfx.fillStyle(0x2f6b3f, 0.9);
        decoGfx.fillTriangle(40, 505, 20, 560, 60, 560);
        this.addDropShadow(40, 578, 30, 10, 0.3);

        // ห้อง3 ห้องคบเพลิง
        this.gameData.missions.torch.torchXs.forEach(x => {
            decoGfx.fillStyle(0x1a1410, 0.4);
            decoGfx.fillEllipse(x, 552, 34, 12);
        });

        decoGfx.fillStyle(0xff8844, 0.10);
        for (let i = 0; i < 40; i++) {
            const x = 460 + Math.random() * 230;
            const y = 320 + Math.random() * 260;
            decoGfx.fillCircle(x, y, 1 + Math.random() * 2);
        }

        [490, 640].forEach(x => {
            decoGfx.fillStyle(0x4a3020, 1);
            decoGfx.fillRect(x - 20, 546, 14, 5);
            decoGfx.fillRect(x - 14, 540, 14, 5);
            decoGfx.fillRect(x - 20, 534, 14, 5);
        });

        // ห้อง4 ห้อง NPC
        this.addPillar(480, 20, 260);
        this.addPillar(870, 20, 260);

        this.addBanner(560, 8, 0x7a2020);
        this.addBanner(790, 8, 0x1f4f7a);

        decoGfx.lineStyle(1, 0x88cc88, 0.14);
        for (let i = 0; i < 6; i++) {
            const cx = 520 + i * 55;
            const cy = 60 + (i % 2) * 20;
            decoGfx.strokeRect(cx - 8, cy - 8, 16, 16);
            decoGfx.lineBetween(cx - 8, cy - 8, cx + 8, cy + 8);
            decoGfx.lineBetween(cx - 8, cy + 8, cx + 8, cy - 8);
        }

        this.addMagicCircle(this.gameData.missions.npc.x, this.gameData.missions.npc.y + 5);

        // ห้อง5 ห้องกล่อง
        this.add.image(800, 340, 'lightBeam').setOrigin(0.5, 0).setAlpha(0.5)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(-0.3);

        this.addCrate(715, 560, 0.9);
        this.addCrate(885, 555, 1);

        this.gameData.missions.chest.chestXs.forEach(x => this.addCoinScatter(x, 540));

        for (let i = 0; i < 20; i++) {
            const x = 705 + Math.random() * 190;
            const y = 320 + Math.random() * 260;
            const star = this.add.text(x, y, '✦', {
                fontFamily: 'Arial',
                fontSize: (8 + Math.random() * 8) + 'px',
                color: '#ffe08a'
            }).setAlpha(0.15).setDepth(-0.4);

            this.tweens.add({
                targets: star,
                alpha: { from: 0.08, to: 0.5 },
                duration: 800 + Math.random() * 1200,
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000
            });
        }
    }

    // ================= 🎮 JUICE SYSTEM: เสียง (Web Audio synth) + เอฟเฟคภาพ =================

    initAudio() {
        if (this.audioCtx) {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.audioCtx = new AC();
    }

    tone(freq, duration, opts = {}) {
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

    noiseBurst(duration, vol = 0.2) {
        if (!this.audioCtx) return;
        const size = Math.max(1, Math.floor(this.audioCtx.sampleRate * duration));
        const buffer = this.audioCtx.createBuffer(1, size, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
        const src = this.audioCtx.createBufferSource();
        src.buffer = buffer;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        src.connect(gain).connect(this.audioCtx.destination);
        src.start();
    }

    sfxClick()     { this.tone(600, 0.05, { type: 'square', vol: 0.12 }); }
    sfxStep()      { this.noiseBurst(0.04, 0.035); }
    sfxCorrect()   { this.tone(523.25, 0.12, { type: 'triangle', vol: 0.22 }); this.tone(783.99, 0.16, { type: 'triangle', vol: 0.22, delay: 0.09 }); }
    sfxWrong()     { this.tone(200, 0.25, { type: 'sawtooth', vol: 0.2, freqEnd: 70 }); }
    sfxUnlock()    { this.tone(300, 0.1, { type: 'square', vol: 0.18 }); this.tone(500, 0.15, { type: 'square', vol: 0.18, delay: 0.08 }); this.tone(700, 0.22, { type: 'square', vol: 0.18, delay: 0.16 }); }
    sfxTorchLight(){ this.noiseBurst(0.15, 0.15); this.tone(150, 0.12, { type: 'sine', vol: 0.15 }); }
    sfxChestOpen() { this.tone(660, 0.1, { type: 'triangle', vol: 0.2 }); this.tone(880, 0.15, { type: 'triangle', vol: 0.2, delay: 0.1 }); this.tone(1046, 0.22, { type: 'triangle', vol: 0.2, delay: 0.2 }); }
    sfxChestTrap() { this.tone(120, 0.3, { type: 'sawtooth', vol: 0.25, freqEnd: 40 }); this.noiseBurst(0.2, 0.2); }
    sfxWin()       { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', vol: 0.24, delay: i * 0.15 })); }

    // ---- เอฟเฟคภาพ ----

    punch(sprite, amount = 0.18, duration = 90) {
        if (!sprite) return;
        const baseX = sprite.scaleX;
        const baseY = sprite.scaleY;
        this.tweens.add({
            targets: sprite,
            scaleX: baseX * (1 + amount),
            scaleY: baseY * (1 - amount * 0.6),
            duration,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => { sprite.setScale(baseX, baseY); }
        });
    }

    shakeCamera(duration = 150, intensity = 0.01) {
        this.cameras.main.shake(duration, intensity);
    }

    flashCamera(duration = 150, r = 255, g = 255, b = 255) {
        this.cameras.main.flash(duration, r, g, b);
    }

    sparkleBurst(x, y, count = 20, tint = 0xffe08a) {
        const emitter = this.add.particles(x, y, 'emberParticle', {
            speed: { min: 60, max: 180 },
            angle: { min: 0, max: 360 },
            lifespan: { min: 400, max: 750 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            tint,
            blendMode: 'ADD'
        }).setDepth(5);
        emitter.explode(count, x, y);
        this.time.delayedCall(900, () => emitter.destroy());
    }

    // ================= ประตูล็อก =================

    buildDoorBarrier(lock) {
        const wallDef = this.gameData.walls.find(w => w.id === lock.wallId);
        if (!wallDef || !wallDef.gap) return;

        const THICK = 10;
        let rect;
        if (wallDef.type === 'h') {
            const width = wallDef.gap[1] - wallDef.gap[0];
            const midX = (wallDef.gap[0] + wallDef.gap[1]) / 2;
            rect = this.add.rectangle(midX, wallDef.y, width, THICK + 4, 0x8b1a1a, 0.85);
        } else {
            const height = wallDef.gap[1] - wallDef.gap[0];
            const midY = (wallDef.gap[0] + wallDef.gap[1]) / 2;
            rect = this.add.rectangle(wallDef.x, midY, THICK + 4, height, 0x8b1a1a, 0.85);
        }
        this.physics.add.existing(rect, true);
        this.lockedDoors.add(rect);
        this.doorBarriers[lock.wallId] = rect;
    }

    refreshLocks() {
        this.gameData.locks.forEach(lock => {
            if (this.gameState[lock.flag] && this.doorBarriers[lock.wallId]) {
                const rect = this.doorBarriers[lock.wallId];
                this.sfxUnlock();
                this.shakeCamera(180, 0.008);
                this.sparkleBurst(rect.x, rect.y, 24, 0xff6666);
                rect.destroy();
                delete this.doorBarriers[lock.wallId];
            }
        });
    }

    // ================= UI Helpers =================

    showMessage(text, duration = 3500) {
        this.messageText.setText(text).setVisible(true);
        this.messageBox.setVisible(true);
        if (this.messageTimer) this.messageTimer.remove(false);
        this.messageTimer = this.time.delayedCall(duration, () => {
            this.messageText.setVisible(false);
            this.messageBox.setVisible(false);
        });
    }

    updateHud() {
        const scroll = this.gameState.scrollCollected ? '✓' : '✗';
        const key = this.gameState.keyCollected ? '✓' : '✗';
        this.hudText.setText(`MAGIC SCROLL: ${scroll}    KEY: ${key}`);

        if (this.sanityBarFill) {
            const ratio = Phaser.Math.Clamp(this.gameState.sanity / this.gameState.maxSanity, 0, 1);
            this.sanityBarFill.width = 146 * ratio;

            let color = 0x66ddaa; // เขียว: ปกติ
            if (ratio <= 0.55) color = 0xffcc44; // เหลือง: เริ่มเสี่ยง
            if (ratio <= 0.25) color = 0xdd3344; // แดง: อันตราย
            this.sanityBarFill.setFillStyle(color, 1);
        }
    }

    // ---------- ปรับค่าแสงแห่งสติ (บวก = ฟื้นฟู, ลบ = สูญเสีย) ----------
    adjustSanity(amount) {
        if (this.gameState.gameWon || this.gameState.gameLost) return;

        this.gameState.sanity = Phaser.Math.Clamp(
            this.gameState.sanity + amount,
            0,
            this.gameState.maxSanity
        );
        this.updateHud();

        if (amount < 0) {
            const ratio = this.gameState.sanity / this.gameState.maxSanity;
            const lowWarnRatio = this.gameData.sanity.lowWarnRatio;
            if (ratio <= lowWarnRatio && !this.sanityLowWarned) {
                this.sanityLowWarned = true;
                this.showMessage('ความมืดเริ่มกลืนกินสติของเจ้า... รีบไขปริศนาต่อไป!', 3000);
            } else if (ratio > lowWarnRatio) {
                this.sanityLowWarned = false;
            }
        }

        if (this.gameState.sanity <= 0) {
            this.loseGame();
        }
    }

    // ================= เงื่อนไขการแพ้ =================
    // ผู้เล่นแพ้เมื่อ "แสงแห่งสติ" หมดลงเหลือ 0 ซึ่งเกิดจาก:
    //   1) เวลาผ่านไปเรื่อยๆ ในความมืดของดันเจี้ยน (ค่อยๆ ลดลงเอง)
    //   2) เปิดหีบกับดักผิดใบ (ลดลงมาก)
    //   3) จุดคบเพลิงผิดลำดับซ้ำๆ (ลดลงเล็กน้อยทุกครั้งที่ผิด)
    //   4) โดน Orc จู่โจม (ลดลงตาม sanityDamage ของแต่ละตัว)
    // หากไม่ไขปริศนาให้เร็วพอ หรือทำผิดพลาดบ่อยเกินไป เจ้าจะ "หลงทางในความมืดตลอดกาล"
    loseGame() {
        if (this.gameState.gameWon || this.gameState.gameLost) return;
        this.gameState.gameLost = true;
        this.player.setVelocity(0, 0);

        this.sfxWrong();
        this.shakeCamera(400, 0.02);
        this.flashCamera(500, 120, 0, 0);
        this.showMessage('ความมืดกลืนกินเจ้าจนหมดสิ้น... เจ้าหลงทางอยู่ในดันเจี้ยนตลอดกาล', 4000);

        this.time.delayedCall(1600, () => {
            this.scene.start('GameOverScene');
        });
    }

       tryWin(playerObj, zone) {
        if (this.gameState.gameWon || this.gameState.gameLost) return;
        if (!this.gameState.keyCollected) {
            this.showMessage('ประตูถูกล็อกด้วยกุญแจ... เจ้ายังไม่มีกุญแจ!');
            this.sfxWrong();
            return;
        }
        this.gameState.gameWon = true;
        this.player.setVelocity(0, 0);
        this.sfxWin();
        this.shakeCamera(350, 0.015);
        this.flashCamera(400, 255, 235, 180);
        this.sparkleBurst(this.player.x, this.player.y, 40, 0xffe08a);
        this.showMessage('ยินดีด้วย! เจ้าหนีออกจากดันเจี้ยนที่ถูกลืมได้สำเร็จ!', 10000);

        // ✅ รอให้เอฟเฟกต์ชนะเล่นจบสักหน่อย แล้วค่อยเปลี่ยนไปหน้า VictoryScene
        this.time.delayedCall(1500, () => {
            this.scene.start('VictoryScene');
        });
    }

    // ================= Mission Logic =================

    interactWith(obj) {
        if (this.gameState.gameWon || this.gameState.gameLost) return;
        this.punch(obj.sprite);

        switch (obj.type) {
            case 'book':      this.handleBook(obj); break;
            case 'statue':    this.handleStatue(obj); break;
            case 'torch':     this.handleTorch(obj); break;
            case 'npc':       this.handleNpc(obj); break;
            case 'chest':     this.handleChest(obj); break;
        }
    }

    handleBook(obj) {
        const libraryData = this.gameData.missions.library;

        if (obj.index === libraryData.correctIndex && !this.gameState.scrollCollected) {
            this.gameState.scrollCollected = true;
            obj.sprite.setTint(0xffd700);
            this.updateHud();
            this.showMessage(`[หนังสือเล่มที่ ${obj.index + 1}] ${libraryData.texts[obj.index]} ประตูไปห้องรูปปั้นเปิดแล้ว!`);
            this.sfxCorrect();
            this.sparkleBurst(obj.sprite.x, obj.sprite.y);
            this.refreshLocks();
            this.adjustSanity(15);
        } else {
            this.sfxClick();
            this.showMessage(`[หนังสือเล่มที่ ${obj.index + 1}] ${libraryData.texts[obj.index]}`);
        }
    }

    handleStatue(obj) {
        if (this.gameState.statueSolved) {
            this.showMessage('รูปปั้นตัวนี้หันถูกทิศแล้ว');
            return;
        }

        const targets = this.gameData.missions.statue.targets;

        obj.rotation = (obj.rotation + 90) % 360;
        obj.sprite.setAngle(obj.rotation);

        const isCorrect = obj.rotation === targets[obj.index];
        obj.checkmark.setVisible(isCorrect);

        const allCorrect = this.interactables
            .filter(o => o.type === 'statue')
            .every(o => o.rotation === targets[o.index]);

        if (allCorrect) {
            this.gameState.statueSolved = true;
            this.showMessage('รูปปั้นทั้งหมดหันถูกทิศแล้ว! ประตูลับเปิดออก...');
            this.sfxUnlock();
            this.shakeCamera(200, 0.01);
            this.sparkleBurst(obj.sprite.x, obj.sprite.y, 26);
            this.refreshLocks();
            this.adjustSanity(15);
        } else if (isCorrect) {
            this.sfxCorrect();
            this.showMessage(`ตัวนี้หันถูกทิศแล้ว (${obj.rotation}°) ✔ — หมุนตัวที่เหลือให้ครบ`);
        } else {
            this.sfxClick();
            this.showMessage(`หมุนรูปปั้นไปที่ ${obj.rotation}° แล้ว (ยังไม่ถูก)`);
        }
    }

    handleTorch(obj) {
        if (this.gameState.torchSolved) {
            this.showMessage('คบเพลิงอันนี้ลุกโชนอยู่แล้ว');
            return;
        }

        const order = this.gameData.missions.torch.order;
        const expected = order[this.gameState.torchNextExpected];

        if (obj.index === expected) {
            obj.lit = true;
            obj.sprite.setAlpha(1);
            obj.glow.setVisible(true);
            obj.emitter.start();
            this.gameState.torchNextExpected++;
            this.sfxTorchLight();
            this.sparkleBurst(obj.sprite.x, obj.sprite.y, 14, 0xff9944);

            if (this.gameState.torchNextExpected >= order.length) {
                this.gameState.torchSolved = true;
                this.showMessage('จุดคบเพลิงถูกลำดับครบทุกอัน! ทางไปห้อง NPC เปิดแล้ว');
                this.sfxUnlock();
                this.shakeCamera(200, 0.01);
                this.refreshLocks();
                this.adjustSanity(15);
            } else {
                this.showMessage('ถูกต้อง! จุดคบเพลิงอันต่อไป...');
            }
        } else {
            this.interactables
                .filter(o => o.type === 'torch')
                .forEach(o => {
                    o.lit = false;
                    o.sprite.setAlpha(0.4);
                    o.glow.setVisible(false);
                    if (o.shadow) o.shadow.setAlpha(0.22);
                    if (o.emitter) o.emitter.stop();
                });
            this.gameState.torchNextExpected = 0;
            this.sfxWrong();
            this.shakeCamera(220, 0.014);
            this.flashCamera(150, 255, 90, 90);
            this.showMessage('ผิดลำดับ! คบเพลิงทั้งหมดดับลง ลองใหม่อีกครั้ง');
            this.adjustSanity(-6);
        }
    }

    handleNpc(obj) {
        const lines = this.gameData.missions.npc.lines;

        if (this.gameState.npcDone) {
            this.showMessage('"ไปเถอะ นักผจญภัย ทางข้างหน้ารออยู่"');
            return;
        }

        this.sfxClick();
        this.showMessage(lines[this.gameState.npcStep]);
        this.gameState.npcStep++;

        if (this.gameState.npcStep >= lines.length) {
            this.gameState.npcDone = true;
            this.sfxUnlock();
            this.sparkleBurst(obj.sprite.x, obj.sprite.y, 20, 0x66ddaa);
            this.refreshLocks();
            this.adjustSanity(15);
        }
    }

    handleChest(obj) {
        if (obj.opened) {
            this.showMessage('หีบนี้เปิดไปแล้ว ไม่มีอะไรเหลืออยู่');
            return;
        }
        obj.opened = true;

        const correctIndex = this.gameData.missions.chest.correctIndex;

        if (obj.index === correctIndex) {
            this.gameState.keyCollected = true;
            obj.sprite.setTint(0xffd700);
            this.showMessage('เจ้าพบกุญแจอยู่ในหีบ! ตอนนี้สามารถเปิดประตูทางออกได้แล้ว');
            this.sfxChestOpen();
            this.sparkleBurst(obj.sprite.x, obj.sprite.y, 22);
            this.updateHud();
            this.adjustSanity(15);
        } else {
            obj.sprite.setTint(0x552222);
            this.showMessage('กับดัก! หีบใบนี้ว่างเปล่า... แสงแห่งสติของเจ้าลดลงอย่างรุนแรง');
            this.sfxChestTrap();
            this.shakeCamera(250, 0.018);
            this.flashCamera(180, 200, 60, 60);
            const dx = this.player.x - obj.sprite.x;
            const dy = this.player.y - obj.sprite.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            this.player.setVelocity((dx / len) * 300, (dy / len) * 300);
            this.adjustSanity(-25);
        }
    }

    // ================= ศัตรู (Orc) =================
    // แต่ละตัวไล่ตามผู้เล่นเมื่ออยู่ในระยะ chaseRadius, โจมตีซ้ำได้ทุก attackCooldownMs
    // เมื่ออยู่ในระยะ dangerRadius, และเลิกไล่ทันทีที่ผู้เล่นออกนอกระยะ chaseRadius
    // ตำแหน่งของ Orc แต่ละตัวจะถูกจำกัด (clamp) ให้อยู่แค่ใน roomBounds ของตัวเองเท่านั้น
    // รองรับ Orc ได้หลายตัวพร้อมกันตาม gameData.enemies

    initEnemies() {
        const enemyList = this.gameData.enemies;
        if (!enemyList || !enemyList.length) return;

        // ---------- สร้างแอนิเมชันของ Orc (สร้างครั้งเดียว กันชนตอน scene restart) ----------
        // โครงสร้าง orc.png: เฟรมขนาด 100x100, เรียงเป็น 8 คอลัมน์ x 6 แถว
        // แถว1 Idle(0-5) / แถว2 Walk(8-15) / แถว3 Attack1(16-21)
        // แถว4 Attack2(24-29) / แถว5 Hurt(32-35) / แถว6 Death(40-43)
        if (!this.anims.exists('orc-idle')) {
            this.anims.create({
                key: 'orc-idle',
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }),
                frameRate: 6,
                repeat: -1
            });
        }
        if (!this.anims.exists('orc-walk')) {
            this.anims.create({
                key: 'orc-walk',
                frames: this.anims.generateFrameNumbers('orc', { start: 8, end: 15 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists('orc-attack1')) {
            this.anims.create({
                key: 'orc-attack1',
                frames: this.anims.generateFrameNumbers('orc', { start: 16, end: 21 }),
                frameRate: 12,
                repeat: 0
            });
        }

        enemyList.forEach(enemyData => {
            this.addDropShadow(enemyData.spawnX, enemyData.spawnY + 22, 34, 12, 0.3);

            const sprite = this.physics.add.sprite(enemyData.spawnX, enemyData.spawnY, 'orc').setScale(2);
            sprite.setDepth(1);
            sprite.body.setCollideWorldBounds(false);
            sprite.play('orc-idle');

            this.enemies.push({ sprite, data: enemyData, attackTimer: 0 });
        });
    }

    updateEnemiesAI() {
        if (!this.enemies.length) return;

        this.enemies.forEach(enemy => {
            const sprite = enemy.sprite;
            const data = enemy.data;
            const bounds = data.roomBounds;

            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);

            if (dist <= data.dangerRadius) {
                // ---------- ระยะโจมตี: หยุดเดิน หันหน้าเข้าหาผู้เล่น โจมตีเป็นช่วงๆ ----------
                sprite.body.setVelocity(0, 0);
                sprite.setFlipX(this.player.x < sprite.x);

                enemy.attackTimer += 16;
                if (enemy.attackTimer >= data.attackCooldownMs) {
                    enemy.attackTimer = 0;
                    this.onEnemyHit(enemy);
                }
            } else if (dist <= data.chaseRadius) {
                // ---------- ระยะไล่ตาม: เดินเข้าหาผู้เล่น แต่ไม่ออกนอกห้องของตัวเอง ----------
                enemy.attackTimer = 0;

                const targetX = bounds ? Phaser.Math.Clamp(this.player.x, bounds.x1, bounds.x2) : this.player.x;
                const targetY = bounds ? Phaser.Math.Clamp(this.player.y, bounds.y1, bounds.y2) : this.player.y;
                const dx = targetX - sprite.x;
                const dy = targetY - sprite.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;

                sprite.body.setVelocity((dx / len) * data.speed, (dy / len) * data.speed);
                sprite.setFlipX(dx < 0);

                if (sprite.anims.currentAnim?.key !== 'orc-attack1') {
                    sprite.play('orc-walk', true);
                }
            } else {
                // ---------- นอกระยะ: เลิกไล่ตาม กลับไปยืนเฉยๆ ----------
                enemy.attackTimer = 0;
                sprite.body.setVelocity(0, 0);

                if (sprite.anims.currentAnim?.key !== 'orc-attack1') {
                    sprite.play('orc-idle', true);
                }
            }

            // ---------- กันหลุดกรอบห้องของตัวเอง (เผื่อ momentum เกินขอบ) ----------
            if (bounds) {
                sprite.x = Phaser.Math.Clamp(sprite.x, bounds.x1, bounds.x2);
                sprite.y = Phaser.Math.Clamp(sprite.y, bounds.y1, bounds.y2);
            }
        });
    }

    onEnemyHit(enemy) {
        const sprite = enemy.sprite;
        const data = enemy.data;

        this.sfxChestTrap();
        this.shakeCamera(250, 0.02);
        this.flashCamera(200, 200, 40, 40);
        this.showMessage('ออร์คตรวจพบเจ้า! เจ้าถูกจู่โจมและเสียสติไปมาก', 3000);

        // หันหน้าเข้าหาผู้เล่น แล้วเล่นท่าโจมตี ก่อนกลับไป idle
        sprite.setFlipX(this.player.x < sprite.x);
        sprite.play('orc-attack1');
        sprite.once('animationcomplete-orc-attack1', () => {
            if (sprite.active) sprite.play('orc-idle');
        });

        // ผลักผู้เล่นออกจากตัว Orc กันไม่ให้ติดโดนซ้ำทันที
        const dx = this.player.x - sprite.x;
        const dy = this.player.y - sprite.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        this.player.setVelocity((dx / len) * 260, (dy / len) * 260);

        this.adjustSanity(-data.sanityDamage);
    }
}