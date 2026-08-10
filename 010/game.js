// ============================================================================
// main.js — GAME LOGIC ONLY.
// All game data (positions, text, colors, puzzle answers, dialogue, etc.)
// lives in the /data/*.json files and is loaded below. Nothing in this file
// should need to change when you tweak numbers, strings, or puzzle layouts —
// edit the JSON instead.
// ============================================================================

let player, cursors, wasd;
let walls;
let books, statues, chests, torchObjs;
let doorZones;              // { bookDoor, statueDoor, torchDoor, exitDoor } physics rectangles
let dialogueBox, dialogueText, dialogueName, nextBtn;
let dialogueState = 0;
let npcSprite;
let hasKey = false;
let hasMagicScroll = false;
let hasTalkedToNPC = false;
let torchOrder = [];
let torchLit = [false, false, false, false];
let statueAngles = [0, 0, 0, 0];
let msgBox, msgText, msgTimer;
let scrollIcon;
let wallLayer;
let popSound;
let enemies = [];

// ── Game state flags ──
let gameStarted = false;   // becomes true after pressing START on the main menu
let isPaused = false;      // toggled by the pause button
let isGameOver = false;    // true after WIN or LOSE (blocks all further interaction)

// Overlay UI references (menu / pause / lose / win)
let startMenuGroup = [];
let pauseOverlayGroup = [];
let pauseBtnBg, pauseBtnTxt;

// Populated once in create() from the JSON cache — read-only after that.
// Same shape as before: DATA.config, DATA.walls, DATA.doors, DATA.rooms,
// DATA.books, DATA.statues, DATA.torches, DATA.npc, DATA.chests, DATA.ui —
// just all nested inside one file now instead of split across ten.
let DATA = {};

// ── Single JSON data file ──
const DATA_KEY = 'gameData';
const DATA_URL = 'data/gameData.json';

const config = {
    type: Phaser.AUTO,
    width: 992,   // overwritten from data/config.json once loaded (see resizeFromConfig)
    height: 736,
    backgroundColor: '#111111',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
};
const game = new Phaser.Game(config);

// ── Small helper: parse a "0xRRGGBB" string from JSON into a numeric color ──
function hex(str, fallback = 0x000000) {
    if (str === undefined || str === null) return fallback;
    return Number(str);
}

function preload() {
    // ── Data ──
    this.load.json(DATA_KEY, DATA_URL);

    // ── Assets ──
    this.load.spritesheet('player', 'images/AnimationSheet_Character.png', {
        frameWidth: 32, frameHeight: 32
    });
    this.load.image('book',   'images/book.png');
    this.load.image('statue', 'images/stat.png');
    this.load.image('torch',  'images/torch.png');
    this.load.image('npc',    'images/mage.png');
    this.load.image('chest',  'images/box.png');
    this.load.spritesheet('orc', 'images/orc.png', { frameWidth: 100, frameHeight: 100 });

    // Tiled dungeon map + its tileset
    this.load.image('tiles', 'images/mainlevbuild.png');
    this.load.tilemapTiledJSON('dungeonMap', 'images/map.tmj');

    // Sound effects
    this.load.audio('pop', 'images/pop.mp3');
}

// ── Proximity helper ──
function isPlayerNear(x, y, range = DATA.config.interactRange) {
    if (!player) return false;
    const d = Phaser.Math.Distance.Between(player.x, player.y, x, y);
    return d <= range;
}

function tooFarMsg(scene) {
    playPop();
    const m = DATA.ui.messages.tooFar;
    showMsg(scene, m.text, hex(m.color));
}

function playPop() {
    if (popSound) popSound.play();
}

// ── Master gate: is the player currently allowed to interact with the world? ──
function canInteract() {
    return gameStarted && !isPaused && !isGameOver;
}

function create() {
    const scene = this;

    // ── Pull the single JSON cache into the convenient DATA object ──
    DATA = this.cache.json.get(DATA_KEY);

    const MAP_W = DATA.config.map.width;
    const MAP_H = DATA.config.map.height;

    // ── Sound effect ──
    popSound = this.sound.add('pop', { volume: 0.5 });

    // ── Tilemap: floor (visual) + wall (visual only, collision is data-driven below) ──
    const map = this.make.tilemap({ key: 'dungeonMap' });
    const tileset = map.addTilesetImage('dun', 'tiles');
    map.createLayer('floor', tileset, 0, 0).setDepth(0);
    wallLayer = map.createLayer('wall', tileset, 0, 0).setDepth(0);

    // ── Invisible collision walls, built from data/walls.json ──
    const DEBUG_SHOW_WALLS = DATA.config.debugShowWalls;
    walls = this.physics.add.staticGroup();

    function wallSeg(x, y, w, h) {
        const r = scene.add.rectangle(x, y, w, h, 0xff0000, DEBUG_SHOW_WALLS ? 0.35 : 0).setDepth(50);
        scene.physics.add.existing(r, true);
        walls.add(r);
        return r;
    }
    DATA.walls.segments.forEach(s => wallSeg(s.x, s.y, s.w, s.h));

    function roomLabel(x, y, w, text, color) {
        scene.add.rectangle(x, y, w, 26, 0x000000, 0.55).setOrigin(0, 0.5).setStrokeStyle(1, color, 0.6).setDepth(2);
        scene.add.text(x + 8, y, text, { fontSize: '15px', fill: color, fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(2);
    }
    DATA.rooms.labels.forEach(r => roomLabel(r.x, r.y, r.w, r.text, r.color));

    // ── Door zones (invisible physics rects placed over the map's connector openings) ──
    // Each one blocks the path until its puzzle is solved, then gets removed (door opens).
    function makeDoor(x, y, w, h) {
        const d = scene.add.rectangle(x, y, w, h, 0x8B0000);
        scene.physics.add.existing(d, true);
        return d;
    }

    doorZones = {};
    ['bookDoor', 'statueDoor', 'torchDoor', 'exitDoor'].forEach(key => {
        const d = DATA.doors[key];
        doorZones[key] = makeDoor(d.x, d.y, d.w, d.h);
    });

    Object.entries(DATA.doors).forEach(([key, d]) => {
        if (!d || !d.labelName || !d.label) return;
        scene.add.text(d.label.x, d.label.y, DATA.ui.lockedLabel, { fontSize: '14px', fill: '#ff4444', fontStyle: 'bold' })
            .setOrigin(d.label.originX, d.label.originY)
            .setName(d.labelName);
    });

    scene.add.text(DATA.books.instruction.x, DATA.books.instruction.y, DATA.books.instruction.text, { fontSize: '13px', fill: '#bbb' });
    scrollIcon = scene.add.text(42, 707, '', { fontSize: '16px', fill: '#cc88ff', fontStyle: 'bold' }).setDepth(10);

    // ── Books (Library room, bottom-left) ──
    books = scene.add.group();
    DATA.books.items.forEach(b => {
        const img = scene.add.image(b.x, b.y, 'book')
            .setDisplaySize(36, 44).setInteractive().setDepth(3);
        scene.add.text(b.x, b.y + 30, b.title,
            { fontSize: '10px', fill: '#eee', align: 'center', wordWrap: { width: 68 }, lineSpacing: 2 })
            .setOrigin(0.5, 0).setDepth(3);
        img.on('pointerover', () => img.setTint(0xffff88));
        img.on('pointerout',  () => img.clearTint());
        img.on('pointerdown', () => {
            if (!canInteract()) return;
            playPop();
            if (!isPlayerNear(b.x, b.y)) { tooFarMsg(scene); return; }
            showMsg(scene, b.msg, b.correct ? 0x004400 : 0x550000);
            if (b.correct && !hasMagicScroll) {
                hasMagicScroll = true;
                const scroll = scene.add.text(b.x, b.y, '📜', { fontSize: '24px' }).setDepth(15);
                scene.tweens.add({
                    targets: scroll, y: b.y - 60, alpha: 0,
                    duration: 1200, ease: 'Power2',
                    onComplete: () => { scroll.destroy(); scrollIcon.setText(DATA.ui.scrollIconText); }
                });
                const m = DATA.ui.messages.scrollObtained;
                scene.time.delayedCall(400,  () => showMsg(scene, m.text, hex(m.color)));
                scene.time.delayedCall(1000, () => openDoor(scene, 'bookDoor'));
                img.setTint(0xcc88ff).disableInteractive();
            }
        });
        books.add(img);
    });

    // ── Statues (Statue room, top-left) ──
    statues = [];
    const dirLabels = DATA.statues.dirLabels;
    scene.add.text(DATA.statues.instruction.x, DATA.statues.instruction.y, DATA.statues.instruction.text, { fontSize: '14px', fill: '#bbb' });

    DATA.statues.positions.forEach((pos, i) => {
        const img = scene.add.image(pos.x, pos.y, 'statue')
            .setDisplaySize(52, 52).setInteractive().setDepth(3);
        const arrow = scene.add.text(pos.x, pos.y + 34, dirLabels[0],
            { fontSize: '18px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
        let angle = 0;
        img.on('pointerover', () => img.setTint(0xaaddff));
        img.on('pointerout',  () => img.clearTint());
        img.on('pointerdown', () => {
            if (!canInteract()) return;
            playPop();
            if (!isPlayerNear(pos.x, pos.y)) { tooFarMsg(scene); return; }
            angle = (angle + 90) % 360;
            statueAngles[i] = angle;
            img.setAngle(angle);
            arrow.setText(dirLabels[Math.round(angle / 90) % 4]);
            checkStatues(scene);
        });
        statues.push({ img, arrow });
    });

    // ── Torches (Torch room, top-right) ──
    torchObjs = [];
    scene.add.text(DATA.torches.instruction.x, DATA.torches.instruction.y, DATA.torches.instruction.text, { fontSize: '14px', fill: '#bbb' });

    DATA.torches.positions.forEach((pos, i) => {
        const img = scene.add.image(pos.x, pos.y, 'torch')
            .setDisplaySize(44, 56).setInteractive().setTint(0x444444).setDepth(3);
        scene.add.text(pos.x + 24, pos.y - 32, String(i + 1),
            { fontSize: '16px', fill: '#ccc', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
        const litT = scene.add.text(pos.x, pos.y + 36, 'OFF',
            { fontSize: '13px', fill: '#999', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
        img.on('pointerover', () => img.setTint(torchLit[i] ? 0xffcc55 : 0x777777));
        img.on('pointerout',  () => img.setTint(torchLit[i] ? 0xffaa00 : 0x444444));
        img.on('pointerdown', () => {
            if (!canInteract()) return;
            playPop();
            if (!isPlayerNear(pos.x, pos.y)) { tooFarMsg(scene); return; }
            toggleTorch(scene, i, img, litT);
        });
        torchObjs.push({ img, litT });
    });

    // ── NPC (Trials End room, bottom-right) ──
    npcSprite = scene.add.image(DATA.npc.x, DATA.npc.y, 'npc').setDisplaySize(48, 56).setInteractive().setDepth(3);
    scene.add.text(DATA.npc.x, DATA.npc.y + 34, DATA.npc.name, { fontSize: '14px', fill: '#ccc', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(3);

    dialogueBox  = scene.add.rectangle(MAP_W / 2, MAP_H - 44, MAP_W - 20, 88, 0x111133, 0.95).setVisible(false).setDepth(10);
    dialogueName = scene.add.text(25, MAP_H - 82, '', { fontSize: '16px', fill: '#ffff88', fontStyle: 'bold' }).setVisible(false).setDepth(11);
    dialogueText = scene.add.text(25, MAP_H - 60, '', { fontSize: '15px', fill: '#fff', wordWrap: { width: MAP_W - 170 }, lineSpacing: 5 }).setVisible(false).setDepth(11);
    nextBtn = scene.add.text(MAP_W - 110, MAP_H - 82, DATA.ui.dialogueBox.nextBtnLabel, { fontSize: '15px', fill: '#88ffff', fontStyle: 'bold' }).setVisible(false).setDepth(11).setInteractive();

    npcSprite.on('pointerover', () => npcSprite.setTint(0xffddaa));
    npcSprite.on('pointerout',  () => npcSprite.clearTint());
    npcSprite.on('pointerdown', () => {
        if (!canInteract()) return;
        playPop();
        if (!isPlayerNear(npcSprite.x, npcSprite.y)) { tooFarMsg(scene); return; }
        dialogueState = 0;
        showDialogue(scene);
    });
    nextBtn.on('pointerdown', () => {
        if (!canInteract()) return;
        playPop();
        dialogueState++;
        if (dialogueState < DATA.npc.dialogues.length) {
            showDialogue(scene);
        } else {
            hideDialogue();
            if (!hasTalkedToNPC) {
                hasTalkedToNPC = true;
                const m = DATA.ui.messages.npcAdvised;
                showMsg(scene, m.text, hex(m.color));
            }
        }
    });

    // ── Chests (Trials End room, bottom-right) ──
    chests = [];
    scene.add.text(DATA.chests.instruction.x, DATA.chests.instruction.y, DATA.chests.instruction.text, { fontSize: '13px', fill: '#bbb' });

    DATA.chests.items.forEach(c => {
        const img = scene.add.image(c.x, c.y, 'chest').setDisplaySize(44, 36).setInteractive().setDepth(3);
        img.on('pointerover', () => { if (!img.getData('opened')) img.setTint(0xffdd88); });
        img.on('pointerout',  () => { if (!img.getData('opened')) img.clearTint(); });
        img.on('pointerdown', () => {
            if (!canInteract()) return;
            if (img.getData('opened')) return;
            playPop();
            if (!hasTalkedToNPC) {
                const m = DATA.ui.messages.needTalkToNpc;
                showMsg(scene, m.text, hex(m.color));
                return;
            }
            if (!isPlayerNear(c.x, c.y)) { tooFarMsg(scene); return; }
            img.setData('opened', true).setAlpha(0.5).clearTint();
            if (c.correct) {
                hasKey = true;
                const m = DATA.ui.messages.keyFound;
                showMsg(scene, m.text, hex(m.color));
                openDoor(scene, 'exitDoor');
                const eo = DATA.chests.exitOpenLabelPosition;
                scene.add.text(eo.x, eo.y, DATA.ui.chestExitOpenLabel, { fontSize: '13px', fill: '#00ff00', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
            } else {
                const m = DATA.ui.messages.trapTriggered;
                showMsg(scene, m.text, hex(m.color));
                player.setTint(0xff0000);
                scene.time.delayedCall(600, () => {
                    if (player.active) player.clearTint();
                    showLose(scene);
                });
            }
        });
        chests.push(img);
    });

    // ── Exit / win zone ──
    const wz = DATA.doors.winZone;
    const ez = DATA.doors.exitZoneVis;
    const el = DATA.doors.exitLabel;
    scene.add.text(el.x, el.y, el.text, { fontSize: '13px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
    const winRect = scene.add.rectangle(wz.x, wz.y, wz.w, wz.h, 0x00ff00, 0);
    scene.physics.add.existing(winRect, true);
    winRect.body.enable = false;
    scene.winZone = winRect;
    scene.exitZoneVis = scene.add.rectangle(ez.x, ez.y, ez.w, ez.h, 0x00aa00, 0.0);

    msgBox  = scene.add.rectangle(MAP_W / 2, MAP_H / 2 - 5, 540, 84, 0x000000, 0.92).setVisible(false).setDepth(20);
    msgText = scene.add.text(MAP_W / 2, MAP_H / 2 - 5, '', { fontSize: '17px', fill: '#fff', wordWrap: { width: 500 }, align: 'center', lineSpacing: 5 })
        .setOrigin(0.5).setVisible(false).setDepth(21);

    // ── Player ──
    const p = DATA.config.player;
    player = this.physics.add.sprite(p.startX, p.startY, 'player', 0);
    player.setCollideWorldBounds(true).setDepth(5);
    this.physics.add.collider(player, walls);
    Object.values(doorZones).forEach(d => this.physics.add.collider(player, d));
    this.physics.add.overlap(player, winRect, () => {
        if (!scene._winShown) { scene._winShown = true; showWin(scene); }
    }, null, scene);

    wasd = this.input.keyboard.addKeys({
        up:    Phaser.Input.Keyboard.KeyCodes.W,
        left:  Phaser.Input.Keyboard.KeyCodes.A,
        down:  Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: p.animations.idle.start, end: p.animations.idle.end }), frameRate: p.animations.idle.frameRate, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: p.animations.walk.start, end: p.animations.walk.end }), frameRate: p.animations.walk.frameRate, repeat: -1 });
    player.anims.play('idle');

    // orc walk animation — row 1 of the spritesheet (frames 0–5)
    this.anims.create({ key: 'orcWalk', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });

    // ── Pause button (top-right corner, fixed) ──
    createPauseButton(scene);

    // ── Start menu overlay (shown first, blocks play until START is pressed) ──
    createStartMenu(scene);

    // ── Enemies (one in Statue Room, Torch Room, Trials End — none in the Library) ──
    initEnemies(scene);
}

function update() {
    // Freeze the player while the start menu is up, the game is paused, or it's game over
    if (!canInteract()) {
        if (player) {
            player.setVelocity(0);
            player.anims.play('idle', true);
        }
        enemies.forEach(e => e.setVelocity(0));
        return;
    }

    const speed = DATA.config.player.speed;
    const left  = wasd.left.isDown  || cursors.left.isDown;
    const right = wasd.right.isDown || cursors.right.isDown;
    const up    = wasd.up.isDown    || cursors.up.isDown;
    const down  = wasd.down.isDown  || cursors.down.isDown;

    player.setVelocity(0);
    if (left)  { player.setVelocityX(-speed); player.flipX = true; }
    if (right) { player.setVelocityX(speed);  player.flipX = false; }
    if (up)    player.setVelocityY(-speed);
    if (down)  player.setVelocityY(speed);

    if (left || right || up || down) player.anims.play('walk', true);
    else player.anims.play('idle', true);

    updateEnemies();
}

function showMsg(scene, text, color) {
    msgBox.setFillStyle(color || 0x000000, 0.92).setVisible(true);
    msgText.setText(text).setVisible(true);
    if (msgTimer) msgTimer.remove();
    msgTimer = scene.time.delayedCall(2800, () => {
        msgBox.setVisible(false);
        msgText.setVisible(false);
    });
}

function openDoor(scene, doorKey) {
    const door = doorZones[doorKey];
    if (!door || !door.visible) return;
    door.setVisible(false);
    door.body.enable = false;
    const labelName = DATA.doors[doorKey] && DATA.doors[doorKey].labelName;
    if (labelName) {
        const lbl = scene.children.getByName(labelName);
        if (lbl) lbl.setText(DATA.ui.openLabel).setStyle({ fill: '#00ff00' });
    }
    const m = DATA.ui.messages.doorUnlocked;
    showMsg(scene, m.text, hex(m.color));
    if (doorKey === 'exitDoor' && scene.winZone) {
        scene.winZone.body.enable = true;
        scene.exitZoneVis.setFillStyle(0x00ff00, 0.6);
    }
}

function checkStatues(scene) {
    const correctAngles = DATA.statues.correctAngles;
    if (statueAngles.every((a, i) => a === correctAngles[i])) {
        const m = DATA.ui.messages.statuesAligned;
        showMsg(scene, m.text, hex(m.color));
        openDoor(scene, 'statueDoor');
    }
}

function toggleTorch(scene, i, img, litT) {
    torchLit[i] = !torchLit[i];
    if (torchLit[i]) {
        img.setTint(0xffaa00);
        litT.setText('ON').setStyle({ fill: '#ffaa00' });
        torchOrder.push(i);
    } else {
        img.setTint(0x444444);
        litT.setText('OFF').setStyle({ fill: '#888' });
        resetTorches(scene);
        return;
    }
    const correctTorchOrder = DATA.torches.correctOrder;
    for (let k = 0; k < torchOrder.length; k++) {
        if (torchOrder[k] !== correctTorchOrder[k]) {
            const m = DATA.ui.messages.torchWrongOrder;
            showMsg(scene, m.text, hex(m.color));
            scene.time.delayedCall(800, () => resetTorches(scene));
            return;
        }
    }
    if (torchOrder.length === 4) {
        const m = DATA.ui.messages.torchCorrectOrder;
        showMsg(scene, m.text, hex(m.color));
        openDoor(scene, 'torchDoor');
    }
}

function resetTorches(scene) {
    torchOrder = [];
    torchLit = [false, false, false, false];
    torchObjs.forEach(t => { t.img.setTint(0x444444); t.litT.setText('OFF').setStyle({ fill: '#888' }); });
}

function showDialogue(scene) {
    const dialogues = DATA.npc.dialogues;
    dialogueBox.setVisible(true);
    dialogueName.setText(DATA.npc.name).setVisible(true);
    dialogueText.setText(dialogues[dialogueState]).setVisible(true);
    nextBtn.setText(dialogueState === dialogues.length - 1 ? DATA.ui.dialogueBox.closeBtnLabel : DATA.ui.dialogueBox.nextBtnLabel).setVisible(true);
}

function hideDialogue() {
    [dialogueBox, dialogueName, dialogueText, nextBtn].forEach(o => o.setVisible(false));
}

function showWin(scene) {
    const MAP_W = DATA.config.map.width;
    const MAP_H = DATA.config.map.height;
    const t = DATA.ui.winScreen;

    isGameOver = true;
    player.setVelocity(0).setActive(false);
    ['left','right','up','down'].forEach(k => wasd[k].enabled = false);
    scene.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0.75).setDepth(30);
    scene.add.text(MAP_W / 2, MAP_H / 2 - 40, t.title, { fontSize: '52px', fill: '#FFD700', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(31);
    scene.add.text(MAP_W / 2, MAP_H / 2 + 45, t.subtitle, { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setDepth(31);

    const restartBtn = scene.add.rectangle(MAP_W / 2, MAP_H / 2 + 110, 220, 56, 0x228833, 1)
        .setStrokeStyle(3, 0xffffff).setDepth(31).setInteractive({ useHandCursor: true });
    scene.add.text(MAP_W / 2, MAP_H / 2 + 110, t.restartButtonLabel, { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(32);
    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x33aa44));
    restartBtn.on('pointerout',  () => restartBtn.setFillStyle(0x228833));
    restartBtn.on('pointerdown', () => {
        playPop();
        window.location.reload();
    });
}

// ── LOSE screen: shown when the player opens a trap chest, or is caught by the enemy ──
function showLose(scene, subtitleOverride) {
    if (isGameOver) return;
    const MAP_W = DATA.config.map.width;
    const MAP_H = DATA.config.map.height;
    const t = DATA.ui.loseScreen;

    isGameOver = true;
    playPop();
    player.setVelocity(0).setActive(false);
    enemies.forEach(e => e.setVelocity(0, 0));
    if (wasd) ['left','right','up','down'].forEach(k => wasd[k].enabled = false);

    scene.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0.8).setDepth(40);
    scene.add.text(MAP_W / 2, MAP_H / 2 - 50, t.title, { fontSize: '50px', fill: '#ff4444', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(41);
    scene.add.text(MAP_W / 2, MAP_H / 2 + 25, subtitleOverride || t.subtitle, { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5).setDepth(41);

    const restartBtn = scene.add.rectangle(MAP_W / 2, MAP_H / 2 + 100, 240, 58, 0xaa2222, 1)
        .setStrokeStyle(3, 0xffffff).setDepth(41).setInteractive({ useHandCursor: true });
    scene.add.text(MAP_W / 2, MAP_H / 2 + 100, t.restartButtonLabel, { fontSize: '22px', fill: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(42);
    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0xcc3333));
    restartBtn.on('pointerout',  () => restartBtn.setFillStyle(0xaa2222));
    restartBtn.on('pointerdown', () => {
        playPop();
        window.location.reload();
    });
}

// ── Start menu overlay ──
function createStartMenu(scene) {
    const MAP_W = DATA.config.map.width;
    const MAP_H = DATA.config.map.height;
    const t = DATA.ui.startMenu;
    const cx = MAP_W / 2, cy = MAP_H / 2;

    // Dim vignette backdrop
    const dim = scene.add.graphics().setDepth(99);
    dim.fillGradientStyle(0x050301, 0x050301, 0x1c0f06, 0x1c0f06, 1);
    dim.fillRect(0, 0, MAP_W, MAP_H);
    dim.setAlpha(0.92);

    // Ornate panel
    const panelW = 560, panelH = 400;
    const panel = scene.add.graphics().setDepth(100);
    panel.fillStyle(0x1a120c, 0.94);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 18);
    panel.lineStyle(3, 0xd4af37, 1);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 18);
    panel.lineStyle(1, 0xd4af37, 0.35);
    panel.strokeRoundedRect(cx - panelW / 2 + 10, cy - panelH / 2 + 10, panelW - 20, panelH - 20, 12);

    // Flanking torches + title
    const torchLeft  = scene.add.text(cx - 215, cy - 130, '🔥', { fontSize: '32px' }).setOrigin(0.5).setDepth(101);
    const torchRight = scene.add.text(cx + 215, cy - 130, '🔥', { fontSize: '32px' }).setOrigin(0.5).setDepth(101);

    const title = scene.add.text(cx, cy - 130, t.title, {
        fontSize: '38px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'bold',
        fill: '#d4af37'
    }).setOrigin(0.5).setDepth(101);
    title.setStroke('#2b1a08', 6);
    title.setShadow(0, 3, '#000000', 6, true, true);

    // Divider
    const divider = scene.add.graphics().setDepth(101);
    divider.lineStyle(2, 0xd4af37, 0.8);
    divider.lineBetween(cx - 160, cy - 90, cx + 160, cy - 90);
    const diamond = scene.add.text(cx, cy - 90, '◆', { fontSize: '14px', fill: '#d4af37' }).setOrigin(0.5).setDepth(101);

    const subtitle = scene.add.text(cx, cy - 55, t.subtitle, {
        fontSize: '15px', fontStyle: 'italic', fill: '#c9b998'
    }).setOrigin(0.5).setDepth(101);

    // START button (shadow + body + label)
    const btnW = 220, btnH = 62;
    const btnShadow = scene.add.rectangle(cx + 4, cy + 74, btnW, btnH, 0x000000, 0.4).setDepth(100);
    const btnBg = scene.add.rectangle(cx, cy + 70, btnW, btnH, 0x3d1f12, 1)
        .setStrokeStyle(3, 0xd4af37, 1).setDepth(101).setInteractive({ useHandCursor: true });
    const btnTxt = scene.add.text(cx, cy + 70, t.startButtonLabel, {
        fontSize: '26px', fontStyle: 'bold', fill: '#f5d67a'
    }).setOrigin(0.5).setDepth(102);

    const hint = scene.add.text(cx, cy + 132, t.hint, {
        fontSize: '13px', fill: '#8a7c63'
    }).setOrigin(0.5).setDepth(101);

    startMenuGroup = [dim, panel, torchLeft, torchRight, title, divider, diamond, subtitle, btnShadow, btnBg, btnTxt, hint];

    // Ambient animation: title pulse + torch flicker
    scene.tweens.add({ targets: title, scale: { from: 1, to: 1.035 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: [torchLeft, torchRight], alpha: { from: 1, to: 0.55 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x54301c);
        btnTxt.setColor('#ffe9a8');
        scene.tweens.add({ targets: [btnBg, btnTxt], scale: 1.05, duration: 150, ease: 'Power1' });
    });
    btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0x3d1f12);
        btnTxt.setColor('#f5d67a');
        scene.tweens.add({ targets: [btnBg, btnTxt], scale: 1, duration: 150, ease: 'Power1' });
    });
    btnBg.on('pointerdown', () => {
        playPop();
        scene.tweens.add({
            targets: startMenuGroup,
            alpha: 0,
            duration: 250,
            ease: 'Power1',
            onComplete: () => {
                gameStarted = true;
                startMenuGroup.forEach(o => o.destroy());
                startMenuGroup = [];
            }
        });
    });
}

// ── Pause button + pause overlay ──
function createPauseButton(scene) {
    const MAP_W = DATA.config.map.width;
    const t = DATA.ui.pauseButton;
    const btnW = 90, btnH = 50;
    const x = MAP_W - 20 - btnW / 2;
    const y = 20 + btnH / 2;

    pauseBtnBg = scene.add.rectangle(x, y, btnW, btnH, 0x222222, 0.85)
        .setStrokeStyle(2, 0xffffff, 0.9).setDepth(60).setInteractive({ useHandCursor: true });
    pauseBtnTxt = scene.add.text(x, y, t.pausedLabel, { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(61);

    pauseBtnBg.on('pointerover', () => pauseBtnBg.setFillStyle(0x333333, 0.9));
    pauseBtnBg.on('pointerout',  () => pauseBtnBg.setFillStyle(0x222222, 0.85));
    pauseBtnBg.on('pointerdown', () => {
        if (!gameStarted || isGameOver) return; // no pausing before start or after game over
        playPop();
        togglePause(scene);
    });
}

function togglePause(scene) {
    const t = DATA.ui.pauseButton;
    isPaused = !isPaused;
    if (isPaused) {
        pauseBtnTxt.setText(t.resumedLabel);
        showPauseOverlay(scene);
    } else {
        pauseBtnTxt.setText(t.pausedLabel);
        hidePauseOverlay();
    }
}

function showPauseOverlay(scene) {
    const MAP_W = DATA.config.map.width;
    const MAP_H = DATA.config.map.height;
    const t = DATA.ui.pauseOverlay;

    const bg = scene.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0.7).setDepth(70);
    const txt = scene.add.text(MAP_W / 2, MAP_H / 2 - 20, t.title, {
        fontSize: '44px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(71);
    const resumeBtn = scene.add.rectangle(MAP_W / 2, MAP_H / 2 + 55, 220, 56, 0x2266cc, 1)
        .setStrokeStyle(3, 0xffffff).setDepth(71).setInteractive({ useHandCursor: true });
    const resumeTxt = scene.add.text(MAP_W / 2, MAP_H / 2 + 55, t.resumeButtonLabel, {
        fontSize: '20px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(72);

    resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(0x3377dd));
    resumeBtn.on('pointerout',  () => resumeBtn.setFillStyle(0x2266cc));
    resumeBtn.on('pointerdown', () => {
        playPop();
        togglePause(scene);
    });

    pauseOverlayGroup = [bg, txt, resumeBtn, resumeTxt];
}

function hidePauseOverlay() {
    pauseOverlayGroup.forEach(o => o.destroy());
    pauseOverlayGroup = [];
}

// ── Enemies ──
// Spawns one orc per data/gameData.json -> "enemies.spawns" entry
// (currently: Statue Room, Torch Room, Trials End — Library has none).
function initEnemies(scene) {
    enemies = [];
    const cfg = DATA.enemies;

    cfg.spawns.forEach(spawnPt => {
        const e = scene.physics.add.sprite(spawnPt.x, spawnPt.y, 'orc', 0).setScale(2).setDepth(4);
        e.setCollideWorldBounds(true);
        e.anims.play('orcWalk');
        //e.setTint(0xff4444);

        // เล็กกว่ารูปจริง — ให้ตรงกับ hitbox ที่กำหนดใน data/gameData.json
        e.body.setSize(cfg.hitbox.hRadius * 2, cfg.hitbox.vRadius * 2);
        e.body.setOffset(
            (e.width  - cfg.hitbox.hRadius * 2) / 2,
            (e.height - cfg.hitbox.vRadius * 2) / 2
        );

        // เดินชนกำแพง/ประตูล็อกไม่ทะลุ เหมือนผู้เล่น
        scene.physics.add.collider(e, walls);
        Object.values(doorZones).forEach(d => scene.physics.add.collider(e, d));

        // โดน orc = ตาย
        scene.physics.add.overlap(player, e, () => onEnemyCatch(scene), null, scene);

        enemies.push(e);
    });
}

// ── Chase logic: moves every enemy toward the player once it's within detectRadius ──
function updateEnemies() {
    if (!enemies.length || !player) return;
    const { speed, detectRadius } = DATA.enemies;
    enemies.forEach(e => {
        if (!e.active) return;
        const dist = Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y);
        if (dist <= detectRadius) {
            const angle = Phaser.Math.Angle.Between(e.x, e.y, player.x, player.y);
            e.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            e.flipX = Math.cos(angle) < 0;
        } else {
            e.setVelocity(0, 0);
        }
    });
}

// ── Player caught by an enemy → die screen, must restart ──
function onEnemyCatch(scene) {
    if (!canInteract()) return; // already paused/game over — ignore repeat overlaps
    playPop();
    enemies.forEach(e => e.setVelocity(0, 0));
    player.setTint(0xff0000);
    scene.time.delayedCall(600, () => {
        if (player.active) player.clearTint();
        showLose(scene, DATA.ui.loseScreen.enemySubtitle);
    });
}