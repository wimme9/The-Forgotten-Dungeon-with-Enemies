// =========================================================
// GameplayScene.js — LOGIC เท่านั้น
// ข้อมูลทั้งหมด (ตำแหน่ง, ข้อความ, ค่าคงที่, ลำดับคำตอบ ฯลฯ)
// ถูกย้ายไปอยู่ในไฟล์ data/*.json และโหลดผ่าน Phaser Loader
// =========================================================

let cursors, keyW, keyA, keyS, keyD, keyE, keyB;
let player;
let lastFacing = 'down';

let bgmSound, runSound;

// --- ข้อมูลที่โหลดมาจาก JSON (ตั้งค่าใน create()) ---
let CONFIG = null;      // data/gameConfig.json
let BOOKS_DATA = null;  // data/mission-books.json
let STATUES_DATA = null;// data/mission-statues.json
let TORCHES_DATA = null;// data/mission-torches.json
let MESSI_DATA = null;  // data/mission-messi.json
let CHESTS_DATA = null; // data/mission-chests.json
let DOOR_DATA = null;   // data/mission-door.json
let ENEMIES_DATA = null;// data/mission-enemies.json

let currentMission = 1;
let hasKey = false;
let penaltyUntil = 0;

// --- ระบบหัวใจและเวลาจำกัด ---
let hearts = 0;
let heartsText;
let timeRemainingMs = 0;
let timerText;
let timerEvent;

let interactPrompt, messageBox, messageText, messageTimer = null;
let interactables = [];

let gates = [], gatesGroup;
let wallsLayer;
let gateBumpMessageAt = 0;

let debugGraphics;
let debugVisible = false;

let missionStatusText;

let books = [];
let hasFootballScroll = false;
let correctBookIndex = 0; // ถูกสุ่มใหม่ทุกครั้งใน init()

let statues = [];
let statueDirections = [0, 0, 0, 0];
let statuesSolved = false;

let torches = [];
let torchLit = [false, false, false, false];
let torchSequence = [];
let torchSolved = false;

let messiNPC;
let messiDialogueActive = false;
let messiDialogueIndex = 0;
let messiDialogueComplete = false;

let chests = [];
let correctChestIndex = 0; // ถูกสุ่มใหม่ทุกครั้งใน init()
let chestOpened = false;

let door;
let doorOpened = false;
let gameWon = false;

let enemies = [];

// =========================================================
// 2. คลาส Scene หลัก
// =========================================================
export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");
    }

    // ฟังก์ชันนี้จะทำงานทุกครั้งที่เริ่ม Scene ใหม่ (เคลียร์ค่าเก่า)
    init() {
        currentMission = 1;
        hasKey = false;
        penaltyUntil = 0;
        interactables = [];
        books = [];
        statues = [];
        torches = [];
        chests = [];
        hasFootballScroll = false;
        statueDirections = [0, 0, 0, 0];
        statuesSolved = false;
        torchLit = [false, false, false, false];
        torchSequence = [];
        torchSolved = false;
        messiDialogueActive = false;
        messiDialogueIndex = 0;
        messiDialogueComplete = false;
        chestOpened = false;
        doorOpened = false;
        gameWon = false;
        enemies = [];

        if (messageTimer) messageTimer.remove();
        if (timerEvent) timerEvent.remove();
    }

    preload() {
        // 1. โหลดไฟล์ข้อมูล (JSON) ทั้งหมดก่อน — ไม่มี logic อยู่ในไฟล์เหล่านี้เลย
        this.load.json('gameConfig', 'data/gameConfig.json');
        this.load.json('assetsManifest', 'data/assets.json');
        this.load.json('missionBooks', 'data/mission-books.json');
        this.load.json('missionStatues', 'data/mission-statues.json');
        this.load.json('missionTorches', 'data/mission-torches.json');
        this.load.json('missionMessi', 'data/mission-messi.json');
        this.load.json('missionChests', 'data/mission-chests.json');
        this.load.json('missionDoor', 'data/mission-door.json');
        this.load.json('missionEnemies', 'data/mission-enemies.json');

        // 2. เมื่อ assetsManifest โหลดเสร็จ ให้อ่านรายการไฟล์จากมันแล้วสั่งโหลดจริง
        //    (นี่คือ "logic การโหลด" — อยู่ใน .js ตามที่ควร ส่วนรายชื่อไฟล์อยู่ใน .json)
        this.load.once('filecomplete-json-assetsManifest', () => {
            const manifest = this.cache.json.get('assetsManifest');

            this.load.tilemapTiledJSON(manifest.tilemap.key, manifest.tilemap.path);
            this.load.image(manifest.tilesetImage.key, manifest.tilesetImage.path);

            manifest.spritesheets.forEach(s => {
                this.load.spritesheet(s.key, s.path, { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
            });
            manifest.images.forEach(img => this.load.image(img.key, img.path));
            manifest.audio.forEach(a => this.load.audio(a.key, a.path));

            this.load.start();
        });
    }

    create() {
        const scene = this;

        // --- ดึงข้อมูลทั้งหมดจาก JSON cache มาเก็บไว้ใช้งาน ---
        CONFIG = this.cache.json.get('gameConfig');
        BOOKS_DATA = this.cache.json.get('missionBooks');
        STATUES_DATA = this.cache.json.get('missionStatues');
        TORCHES_DATA = this.cache.json.get('missionTorches');
        MESSI_DATA = this.cache.json.get('missionMessi');
        CHESTS_DATA = this.cache.json.get('missionChests');
        DOOR_DATA = this.cache.json.get('missionDoor');
        ENEMIES_DATA = this.cache.json.get('missionEnemies');

        // ค่าที่สุ่มใหม่ทุกรอบ (โอกาสเท่ากันทุกตัวเลือก) — สุ่มด้วย logic, ค่าที่สุ่มได้ไม่ใช่ data ที่ fix ไว้
        correctBookIndex = Phaser.Math.Between(0, BOOKS_DATA.texts.length - 1);
        correctChestIndex = Phaser.Math.Between(0, CHESTS_DATA.keys.length - 1);

        hearts = CONFIG.maxHearts;
        timeRemainingMs = CONFIG.timeLimitMs;

        // --- ส่วนสร้างแผนที่ ---
        const map = this.make.tilemap({ key: 'stadium_map' });
        const tileset = map.addTilesetImage('Map', 'tiles');

        map.createLayer('Floor Layer', tileset, 0, 0);
        wallsLayer = map.createLayer('Wall Layer', tileset, 0, 0);
        wallsLayer.setCollisionByExclusion([-1]);

        this.physics.world.setBounds(0, 0, CONFIG.worldBounds.width, CONFIG.worldBounds.height);

        this.sound.stopAll();
        bgmSound = playSoundSafely(this, 'bgm', { loop: true, volume: 0.35 });

        // ให้ PauseScene เรียกใช้เพื่อหยุด/เล่นเสียงต่อได้จากภายนอก
        this.pauseAudio = () => {
            if (bgmSound && bgmSound.isPlaying) bgmSound.pause();
            if (runSound && runSound.isPlaying) runSound.pause();
        };
        this.resumeAudio = () => {
            if (bgmSound && bgmSound.isPaused) bgmSound.resume();
            if (runSound && runSound.isPaused) runSound.resume();
        };

        // --- ระบบประตูใสและโซนภารกิจ ---
        gatesGroup = this.physics.add.staticGroup();
        gates = CONFIG.gates.map(def => {
            const rect = scene.add.rectangle(def.x, def.y, def.w, def.h, 0x000000, 0.001);
            scene.physics.add.existing(rect, true);
            gatesGroup.add(rect);
            return { key: def.key, rect, requiredMission: def.requiredMission };
        });

        // --- ผู้เล่น ---
        const p = CONFIG.player;
        player = this.physics.add.sprite(p.startX, p.startY, 'player', 0).setScale(p.displayScale).setDepth(10);
        player.setCollideWorldBounds(true);
        player.body.setSize(p.bodySize.width, p.bodySize.height);
        player.body.setOffset(p.bodyOffset.x, p.bodyOffset.y);

        this.physics.add.collider(player, wallsLayer);
        this.physics.add.collider(player, gatesGroup, (pl, g) => onGateBump(this, pl, g));

        updateGates();

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: p.animations.idle.start, end: p.animations.idle.end }),
            frameRate: p.animations.idle.frameRate, repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: p.animations.walk.start, end: p.animations.walk.end }),
            frameRate: p.animations.walk.frameRate, repeat: -1
        });

        // --- แอนิเมชันมอนสเตอร์ (Orc.png) ---
        const eAnim = CONFIG.enemy.animations;
        this.anims.create({
            key: 'orcIdle',
            frames: this.anims.generateFrameNumbers('orc', { start: eAnim.idle.start, end: eAnim.idle.end }),
            frameRate: eAnim.idle.frameRate, repeat: -1
        });
        this.anims.create({
            key: 'orcWalk',
            frames: this.anims.generateFrameNumbers('orc', { start: eAnim.walk.start, end: eAnim.walk.end }),
            frameRate: eAnim.walk.frameRate, repeat: -1
        });

        // --- คีย์บอร์ดและกล้อง ---
        cursors = this.input.keyboard.createCursorKeys();
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

        this.cameras.main.setBounds(0, 0, CONFIG.worldBounds.width, CONFIG.worldBounds.height);
        this.cameras.main.startFollow(player, true, 0.09, 0.09);

        // --- UI ของเกม ---
        let pauseButton = this.add.text(CONFIG.worldBounds.width, 50, CONFIG.uiText.pauseButtonLabel, {
            fontSize: "22px",
            fontFamily: "Arial",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#1a472a",
            padding: { x: 16, y: 10 }
        })
            .setOrigin(1, 0)
            .setScrollFactor(0) // ล็อกให้อยู่บนหน้าจอเสมอแม้กล้องจะขยับ
            .setDepth(100);

        pauseButton.setInteractive({ useHandCursor: true });
        pauseButton.on("pointerover", () => pauseButton.setBackgroundColor("#2e8b57"));
        pauseButton.on("pointerout", () => pauseButton.setBackgroundColor("#1a472a"));
        pauseButton.on("pointerdown", () => {
            playSoundSafely(this, 'sfx_click_npc');
            this.pauseAudio();
            this.scene.pause();
            this.scene.launch("PauseScene");
        });

        interactPrompt = this.add.text(0, 0, CONFIG.uiText.interactPrompt, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(30).setVisible(false);

        messageBox = this.add.rectangle(690, 630, 1040, 90, 0x000000, 0.8)
            .setStrokeStyle(2, 0xffe066).setDepth(40).setVisible(false);
        messageText = this.add.text(690, 630, '', {
            fontSize: '19px', fontFamily: 'Arial', color: '#ffffff',
            align: 'center', wordWrap: { width: 980 }
        }).setOrigin(0.5).setDepth(41).setVisible(false);

        messageBox.setScrollFactor(0);
        messageText.setScrollFactor(0);

        missionStatusText = this.add.text(20, 850, '', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffe066',
            backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
        }).setDepth(50).setScrollFactor(0);
        updateMissionStatusText();

        // --- UI หัวใจ ---
        heartsText = this.add.text(20, 20, '', {
            fontSize: '28px', fontFamily: 'Arial'
        }).setDepth(50).setScrollFactor(0);
        updateHeartsText();

        // --- UI นับเวลาถอยหลัง ---
        timerText = this.add.text(740, 20, '', {
            fontSize: '26px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffe066',
            backgroundColor: '#000000aa', padding: { x: 14, y: 6 }
        }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);
        updateTimerText();

        timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (gameWon) return;
                timeRemainingMs -= 1000;
                updateTimerText();
                if (timeRemainingMs <= 0) {
                    loseGame(this, 'time');
                }
            }
        });

        debugGraphics = this.add.graphics().setDepth(200).setVisible(false);

        // --- สร้างไอเทมต่างๆ ในฉาก ---
        setupBooks(scene);
        setupStatues(scene);
        setupTorches(scene);
        setupMessi(scene);
        setupChests(scene);
        setupDoor(scene);
        setupEnemies(scene);
    }

    update(time, delta) {
        if (gameWon) return;
        handleMovement(time, this);
        handleInteractionCheck(this);
        handleEnemies(time, delta, this);

        if (Phaser.Input.Keyboard.JustDown(keyB)) {
            debugVisible = !debugVisible;
            debugGraphics.setVisible(debugVisible);
            if (debugVisible) drawDebugOverlay();
        }
    }
}


// =========================================================
// 3. ฟังก์ชัน Helper ทั้งหมด (LOGIC ล้วนๆ)
// =========================================================

function playSoundSafely(scene, key, config = {}) {
    try {
        if (scene && scene.sound && scene.cache.audio.exists(key)) {
            return scene.sound.play(key, config);
        }
    } catch (e) {
        console.warn('Audio play warning:', key, e);
    }
    return null;
}

function handleMovement(time, scene) {
    let vx = 0; let vy = 0;
    const baseSpeed = CONFIG.speed;
    const currentSpeed = (time < penaltyUntil) ? baseSpeed * CONFIG.penaltySpeedMultiplier : baseSpeed;
    const movementLocked = messiDialogueActive;

    if (!movementLocked) {
        if (cursors.left.isDown || keyA.isDown) { vx = -currentSpeed; lastFacing = 'left'; }
        else if (cursors.right.isDown || keyD.isDown) { vx = currentSpeed; lastFacing = 'right'; }

        if (cursors.up.isDown || keyW.isDown) { vy = -currentSpeed; lastFacing = 'up'; }
        else if (cursors.down.isDown || keyS.isDown) { vy = currentSpeed; lastFacing = 'down'; }
    }

    if (vx !== 0 && vy !== 0) { const norm = Math.SQRT1_2; vx *= norm; vy *= norm; }
    player.setVelocity(vx, vy);

    if (vx < 0) player.flipX = true; else if (vx > 0) player.flipX = false;

    if (vx !== 0 || vy !== 0) {
        player.anims.play('walk', true);
        if (!runSound) {
            try {
                runSound = scene.sound.add('sfx_run', { loop: true, volume: 0.5 });
            } catch (e) {}
        }
        if (runSound && !runSound.isPlaying) runSound.play();
    } else {
        player.anims.play('idle', true);
        if (runSound && runSound.isPlaying) runSound.stop();
    }
}

function handleInteractionCheck(scene) {
    if (messiDialogueActive) {
        interactPrompt.setVisible(false);
        if (Phaser.Input.Keyboard.JustDown(keyE)) advanceMessiDialogue(scene);
        return;
    }

    let nearest = null; let nearestDist = Infinity;
    interactables.forEach(obj => {
        if (obj.done) return;
        const d = Phaser.Math.Distance.Between(player.x, player.y, obj.sprite.x, obj.sprite.y);
        if (d < obj.range && d < nearestDist) { nearest = obj; nearestDist = d; }
    });

    if (nearest) {
        interactPrompt.setVisible(true);
        interactPrompt.setPosition(nearest.sprite.x, nearest.sprite.y - nearest.promptOffsetY);
        interactPrompt.setText(nearest.promptText || CONFIG.uiText.interactPrompt);
        if (Phaser.Input.Keyboard.JustDown(keyE)) nearest.onInteract();
    } else {
        interactPrompt.setVisible(false);
    }
}

function registerInteractable(sprite, range, promptOffsetY, onInteract, promptText) {
    interactables.push({ sprite, range, promptOffsetY, onInteract, promptText, done: false });
}

function showMessage(scene, text, durationMs) {
    messageText.setText(text);
    messageBox.setVisible(true);
    messageText.setVisible(true);
    if (messageTimer) messageTimer.remove();
    if (durationMs && durationMs > 0) {
        messageTimer = scene.time.delayedCall(durationMs, () => {
            hideMessage();
        });
    }
}

function hideMessage() { messageBox.setVisible(false); messageText.setVisible(false); }
function showLockedMessage(scene) { showMessage(scene, CONFIG.uiText.lockedMessage, 1600); }

function updateGates() {
    gates.forEach(g => {
        g.rect.body.enable = currentMission < g.requiredMission;
    });
}

function onGateBump(scene, playerObj, gateRect) {
    const now = performance.now();
    if (now - gateBumpMessageAt > 400) {
        gateBumpMessageAt = now;
        showLockedMessage(scene);
    }
}

function updateMissionStatusText() {
    if (!missionStatusText) return;
    missionStatusText.setText(CONFIG.missionStatusLabels[String(currentMission)] || '');
}

function updateHeartsText() {
    if (!heartsText) return;
    const full = Math.max(hearts, 0);
    const empty = Math.max(CONFIG.maxHearts - full, 0);
    heartsText.setText('❤️'.repeat(full) + '🖤'.repeat(empty));
}

function updateTimerText() {
    if (!timerText) return;
    const totalSec = Math.max(0, Math.ceil(timeRemainingMs / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    timerText.setText('⏱ ' + m + ':' + s);
    timerText.setColor(totalSec <= 10 ? '#ff4d4d' : '#ffe066');
}

function drawDebugOverlay() {
    debugGraphics.clear();
    gates.forEach(g => {
        const locked = g.rect.body.enable;
        const color = locked ? 0xffe066 : 0x4caf50;
        debugGraphics.lineStyle(2, color, 1);
        debugGraphics.fillStyle(color, 0.35);
        const b = g.rect.getBounds();
        debugGraphics.fillRect(b.x, b.y, b.width, b.height);
        debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
    });
}

function createHintSign(scene, x, y, hintText) {
    const glow = scene.add.circle(x, y, 17, 0xffe066, 0.25).setDepth(2);
    scene.add.circle(x, y, 14, 0x2b2b2b, 0.9).setStrokeStyle(2, 0xffe066).setDepth(3);
    scene.add.text(x, y, '?', {
        fontSize: '18px', fontFamily: 'Arial', color: '#ffe066', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    scene.tweens.add({ targets: glow, scale: 1.3, alpha: 0.05, duration: 900, yoyo: true, repeat: -1 });
    registerInteractable(glow, 45, 26, () => {
        playSoundSafely(scene, 'sfx_click_npc');
        showMessage(scene, hintText, 4000);
    }, CONFIG.uiText.hintPromptText);
}

// --- Mission 1: หนังสือ ---
function setupBooks(scene) {
    BOOKS_DATA.keys.forEach((key, i) => {
        const book = scene.add.image(BOOKS_DATA.positionsX[i], BOOKS_DATA.y, key).setScale(CONFIG.scale.book).setDepth(2);
        books.push(book);
        registerInteractable(book, 55, 45, () => handleBookInteract(scene, i), CONFIG.uiText.bookPromptText);
    });
}

function handleBookInteract(scene, index) {
    playSoundSafely(scene, 'sfx_book');
    const bookSprite = books[index];
    scene.tweens.add({
        targets: bookSprite, scaleX: CONFIG.scale.book * 1.25, scaleY: CONFIG.scale.book * 1.25,
        duration: 200, ease: 'Back.easeOut', yoyo: true
    });

    const bookText = BOOKS_DATA.texts[index];
    if (currentMission !== 1) { showMessage(scene, bookText, 2500); return; }

    if (index === correctBookIndex) {
        hasFootballScroll = true;
        playSoundSafely(scene, 'sfx_mission_complete');
        playSoundSafely(scene, 'sfx_gate_open');
        showMessage(scene, bookText + '\n\n' + CONFIG.uiText.correctScrollMessagePrefix, 3200);
        currentMission = 2;
        updateGates(); updateMissionStatusText();
    } else {
        showMessage(scene, bookText + CONFIG.uiText.wrongBookMessage, 2200);
    }
}

// --- Mission 2: รูปปั้น ---
function setupStatues(scene) {
    STATUES_DATA.positionsX.forEach((x, i) => {
        const statue = scene.add.image(x, STATUES_DATA.y, 'jude_statue').setScale(CONFIG.scale.statue).setDepth(2);
        const dirText = scene.add.text(x, STATUES_DATA.y + 55, STATUES_DATA.directionLabels[statueDirections[i]], {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffe066', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);
        statues.push({ sprite: statue, dirText: dirText, baseX: x });
        registerInteractable(statue, 55, 50, () => handleStatueInteract(scene, i), CONFIG.uiText.statuePromptText);
    });
    const hintText = STATUES_DATA.hintPrefix + '\n' + STATUES_DATA.targetDirections.map(d => STATUES_DATA.directionLabels[d]).join('  →  ');
    createHintSign(scene, STATUES_DATA.hintPosition.x, STATUES_DATA.hintPosition.y, hintText);
}

function handleStatueInteract(scene, index) {
    if (currentMission < 2) { showLockedMessage(scene); return; }
    if (currentMission > 2) { showMessage(scene, CONFIG.uiText.statuesLockedStillMessage, 1500); return; }

    try {
        const stSfx = scene.sound.add('sfx_statue');
        stSfx.play({ seek: 3 });
        scene.time.delayedCall(1000, () => { if (stSfx.isPlaying) stSfx.stop(); });
    } catch (e) {}

    statueDirections[index] = (statueDirections[index] + 1) % 4;
    statues[index].dirText.setText(STATUES_DATA.directionLabels[statueDirections[index]]);

    const statueSprite = statues[index].sprite;
    const targetAngle = statueDirections[index] * 90;
    scene.tweens.add({ targets: statueSprite, angle: targetAngle, duration: 180, ease: 'Cubic.easeOut' });

    const baseX = statues[index].baseX;
    scene.tweens.add({
        targets: statueSprite, x: baseX + 3, duration: 45, yoyo: true, repeat: 2, ease: 'Sine.easeInOut',
        onComplete: () => { statueSprite.x = baseX; }
    });
    checkStatues(scene);
}

function checkStatues(scene) {
    const solved = statueDirections.every((dir, i) => dir === STATUES_DATA.targetDirections[i]);
    if (solved) {
        statuesSolved = true;
        playSoundSafely(scene, 'sfx_mission_complete'); playSoundSafely(scene, 'sfx_gate_open');
        showMessage(scene, CONFIG.uiText.statueSolvedMessage, 3000);
        currentMission = 3; updateGates(); updateMissionStatusText();
    }
}

// --- Mission 3: คบเพลิง ---
function setupTorches(scene) {
    TORCHES_DATA.positionsX.forEach((x, i) => {
        const torch = scene.add.image(x, TORCHES_DATA.y, 'fire1').setScale(CONFIG.scale.torch).setDepth(2);
        const numText = scene.add.text(x, TORCHES_DATA.y + 40, String(i + 1), {
            fontSize: '17px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);
        torches.push({ sprite: torch, numText: numText, id: i + 1 });
        registerInteractable(torch, 50, 42, () => handleTorchInteract(scene, i), CONFIG.uiText.torchPromptText);
    });
    const hintText = TORCHES_DATA.hintPrefix + '\n' + TORCHES_DATA.correctOrder.join('  →  ');
    createHintSign(scene, TORCHES_DATA.hintPosition.x, TORCHES_DATA.hintPosition.y, hintText);
}

function handleTorchInteract(scene, index) {
    if (currentMission < 3) { showLockedMessage(scene); return; }
    if (currentMission > 3 || torchSolved) { showMessage(scene, CONFIG.uiText.torchesLockedStillMessage, 1500); return; }
    if (torchLit[index]) return;

    playSoundSafely(scene, 'sfx_fire');
    const torchId = torches[index].id;
    torchLit[index] = true;
    torches[index].sprite.setTexture('fire2');
    torchSequence.push(torchId);

    const stepIndex = torchSequence.length - 1;
    if (torchSequence[stepIndex] !== TORCHES_DATA.correctOrder[stepIndex]) {
        showMessage(scene, CONFIG.uiText.torchWrongOrderMessage, 2200);
        resetTorches(); return;
    }

    if (torchSequence.length === TORCHES_DATA.correctOrder.length) {
        torchSolved = true;
        playSoundSafely(scene, 'sfx_mission_complete'); playSoundSafely(scene, 'sfx_gate_open');
        showMessage(scene, CONFIG.uiText.torchSolvedMessage, 3000);
        currentMission = 4; updateGates(); updateMissionStatusText();
    } else {
        showMessage(scene, '✅ ถูกต้อง! (' + torchSequence.length + '/' + TORCHES_DATA.correctOrder.length + ')', 900);
    }
}

function resetTorches() {
    torchSequence = []; torchLit = [false, false, false, false];
    torches.forEach(t => t.sprite.setTexture('fire1'));
}

// --- Mission 4: เมสซี่ ---
function setupMessi(scene) {
    messiNPC = scene.add.image(MESSI_DATA.position.x, MESSI_DATA.position.y, 'messi_npc').setScale(CONFIG.scale.messi).setDepth(2);
    registerInteractable(messiNPC, 60, 55, () => startMessiDialogue(scene), CONFIG.uiText.messiPromptText);
}

function startMessiDialogue(scene) {
    if (currentMission < 4) { showLockedMessage(scene); return; }
    if (messiDialogueComplete) { showMessage(scene, CONFIG.uiText.messiRepeatLine, 1800); return; }
    playSoundSafely(scene, 'sfx_click_npc');
    messiDialogueActive = true; messiDialogueIndex = 0;
    showMessage(scene, MESSI_DATA.lines[messiDialogueIndex] + CONFIG.uiText.messiContinueHint, 0);
}

function advanceMessiDialogue(scene) {
    playSoundSafely(scene, 'sfx_click_npc');
    messiDialogueIndex++;
    if (messiDialogueIndex < MESSI_DATA.lines.length) {
        showMessage(scene, MESSI_DATA.lines[messiDialogueIndex] + CONFIG.uiText.messiContinueHint, 0);
    } else {
        messiDialogueActive = false; messiDialogueComplete = true; currentMission = 5;
        playSoundSafely(scene, 'sfx_mission_complete'); updateGates(); hideMessage();
        showMessage(scene, CONFIG.uiText.chestsUnlockedMessage, 2800);
        updateMissionStatusText();
    }
}

// --- Mission 5: กล่องสมบัติ ---
function setupChests(scene) {
    CHESTS_DATA.keys.forEach((key, i) => {
        const chest = scene.add.image(CHESTS_DATA.positionsX[i], CHESTS_DATA.y, key).setScale(CONFIG.scale.chest).setDepth(2);
        chests.push(chest);
        registerInteractable(chest, 50, 42, () => handleChestInteract(scene, i), CONFIG.uiText.chestPromptText);
    });
}

function handleChestInteract(scene, index) {
    if (currentMission < 5) { showLockedMessage(scene); return; }
    if (chestOpened) { showMessage(scene, CONFIG.uiText.chestAlreadyOpenedMessage, 1500); return; }

    playSoundSafely(scene, 'sfx_chest');
    if (index === correctChestIndex) {
        chestOpened = true; hasKey = true;
        playSoundSafely(scene, 'sfx_mission_complete');
        showMessage(scene, CONFIG.uiText.chestFoundKeyMessage, 3000);
        const keyIcon = scene.add.image(chests[index].x, chests[index].y - 50, 'wc_key').setScale(0.15).setDepth(6);
        scene.tweens.add({ targets: keyIcon, y: keyIcon.y - 30, alpha: 0, duration: 1200, delay: 800, onComplete: () => keyIcon.destroy() });
    } else {
        applyHeartPenalty(scene, CONFIG.uiText.chestWrongPrefix, CONFIG.uiText.chestWrongSuffix, CONFIG.penaltyDurationMs);
    }
}

// ระบบเสียหัวใจแบบใช้ร่วมกัน (กล่องสมบัติผิด / โดนมอนสเตอร์ตี ใช้หัวใจชุดเดียวกัน)
function applyHeartPenalty(scene, messagePrefix, messageSuffix, invulnerableMs) {
    if (performance.now() < penaltyUntil) return; // ยังอยู่ในช่วงอมตะจากโดนตีครั้งก่อน ไม่หักซ้ำ

    hearts--;
    updateHeartsText();
    const remaining = Math.max(hearts, 0);
    showMessage(scene, messagePrefix + remaining + '/' + CONFIG.maxHearts + messageSuffix, 2000);
    penaltyUntil = performance.now() + invulnerableMs;
    scene.cameras.main.shake(300, 0.01); scene.cameras.main.flash(200, 200, 0, 0);

    if (hearts <= 0) {
        scene.time.delayedCall(700, () => loseGame(scene, 'hearts'));
    }
}

// --- Mission 6: ประตูทางออก ---
function setupDoor(scene) {
    door = scene.add.image(DOOR_DATA.x, DOOR_DATA.y, 'door1').setDisplaySize(DOOR_DATA.displayWidth, DOOR_DATA.displayHeight).setDepth(2);
    registerInteractable(door, 70, 65, () => handleDoorInteract(scene), CONFIG.uiText.doorPromptText);
}

function handleDoorInteract(scene) {
    if (doorOpened) return;
    if (!hasKey) { showMessage(scene, CONFIG.uiText.doorLockedMessage, 2000); return; }
    playSoundSafely(scene, 'sfx_exit_door');
    doorOpened = true; door.setTexture('door2');
    showMessage(scene, CONFIG.uiText.doorOpenedMessage, 2000);
    currentMission = 6; updateMissionStatusText();
    scene.time.delayedCall(1500, () => winGame(scene));
}

// --- มอนสเตอร์: เกิดทุกห้อง ไล่ตามเมื่อผู้เล่นเข้าใกล้ ---
function setupEnemies(scene) {
    const spriteKey = ENEMIES_DATA.spriteKey;
    ENEMIES_DATA.list.forEach(def => {
        const sprite = scene.physics.add.sprite(def.spawnX, def.spawnY, spriteKey).setScale(CONFIG.scale.enemy).setDepth(9);
        sprite.body.setSize(def.hitbox.hRadius * 2, def.hitbox.vRadius * 2);
        sprite.body.setCollideWorldBounds(true);
        sprite.play('orcIdle');

        // ชนกำแพงเสมอ และชนประตูเฉพาะตอนยังล็อกอยู่ (gatesGroup ปิดการชนอัตโนมัติเมื่อปลดล็อกแล้ว)
        scene.physics.add.collider(sprite, wallsLayer);
        scene.physics.add.collider(sprite, gatesGroup);

        enemies.push({
            id: def.id,
            sprite,
            speed: def.speed,
            detectRadius: def.detectRadius,
            hitbox: def.hitbox
        });
    });
}

function handleEnemies(time, delta, scene) {
    if (!enemies.length || !player) return;

    enemies.forEach(enemy => {
        const dx = player.x - enemy.sprite.x;
        const dy = player.y - enemy.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // ไล่ตามผู้เล่นเมื่อเข้ารัศมีตรวจจับ (ใช้ physics velocity เพื่อให้ชนกำแพง/ประตูที่ล็อกได้ถูกต้อง)
        if (dist > 1 && dist < enemy.detectRadius) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            const speedPerSec = enemy.speed * 60; // แปลงจากหน่วย px/เฟรม(60fps) เป็น px/วินาที
            enemy.sprite.setVelocity(dirX * speedPerSec, dirY * speedPerSec);
            enemy.sprite.flipX = dirX < 0;
            if (enemy.sprite.anims.currentAnim?.key !== 'orcWalk') enemy.sprite.play('orcWalk');
        } else {
            enemy.sprite.setVelocity(0, 0);
            if (enemy.sprite.anims.currentAnim?.key !== 'orcIdle') enemy.sprite.play('orcIdle');
        }

        // เช็คชนแบบวงรี (hRadius/vRadius ของมอน + hitRadius ของผู้เล่น)
        const hx = enemy.hitbox.hRadius + CONFIG.player.hitRadius;
        const hy = enemy.hitbox.vRadius + CONFIG.player.hitRadius;
        const normalizedDist = (dx * dx) / (hx * hx) + (dy * dy) / (hy * hy);
        if (normalizedDist <= 1) {
            applyHeartPenalty(scene, CONFIG.uiText.enemyHitPrefix, CONFIG.uiText.enemyHitSuffix, CONFIG.enemy.invulnerabilityMs);
            knockbackPlayer(scene, dx, dy, dist);
        }
    });
}

// ผลักผู้เล่นออกจากมอนสเตอร์เบาๆ ตอนโดนตี
function knockbackPlayer(scene, dx, dy, dist) {
    if (dist <= 0) return;
    const pushX = (dx / dist) * CONFIG.enemy.knockbackDistance;
    const pushY = (dy / dist) * CONFIG.enemy.knockbackDistance;
    scene.tweens.add({
        targets: player,
        x: player.x + pushX,
        y: player.y + pushY,
        duration: CONFIG.enemy.knockbackDurationMs,
        ease: 'Cubic.easeOut'
    });
}

// ปรับปรุงฟังก์ชันให้เฟดจอขาว แล้วเรียก VictoryScene
function winGame(scene) {
    gameWon = true;
    player.setVelocity(0, 0);
    if (runSound && runSound.isPlaying) runSound.stop();
    hideMessage();
    interactPrompt.setVisible(false);
    playSoundSafely(scene, 'sfx_win');

    scene.cameras.main.fade(1000, 255, 255, 255);
    scene.time.delayedCall(1000, () => {
        scene.scene.start('VictoryScene');
    });
}

// เรียกเมื่อแพ้ (หมดเวลา หรือ หัวใจหมด)
function loseGame(scene, reason) {
    if (gameWon) return; // กันไม่ให้ทริกเกอร์ซ้ำ (เช่น ชนะไปแล้วพอดี)
    gameWon = true;
    player.setVelocity(0, 0);
    if (runSound && runSound.isPlaying) runSound.stop();
    if (bgmSound && bgmSound.isPlaying) bgmSound.stop();
    if (timerEvent) timerEvent.remove();
    hideMessage();
    interactPrompt.setVisible(false);

    scene.cameras.main.shake(300, 0.012);
    scene.cameras.main.fade(1000, 0, 0, 0);
    scene.time.delayedCall(1000, () => {
        scene.scene.start('LoseScene', { reason });
    });
}