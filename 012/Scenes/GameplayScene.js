import { Theme } from "./Theme.js";

// ที่อยู่ไฟล์ข้อมูลเกม (ห้ามมี logic ใดๆ ในไฟล์นี้ มีแต่ data ล้วนๆ)
const GAME_DATA_KEY = "gameData";
const GAME_DATA_URL = "data/gameplay-data.json";

// ================= คอนฟิกสไปรต์ชีต Orc (ดูจากภาพจริง: 800x600, กริด 8 คอลัมน์ x 6 แถว) =================
// แถวที่ 1 (index 1) คือท่าเดิน มีครบ 8 เฟรม จึงใช้แถวนี้ทำวงจรอนิเมชันเดิน
// ถ้าไฟล์รูป Orc จริงมีขนาด/เลย์เอาต์ต่างจากนี้ แก้แค่ค่าคงที่ 4 ตัวนี้พอ
const ENEMY_FRAME_SIZE = 100;      // ขนาดแต่ละเฟรม (px) ทั้งกว้างและสูง
const ENEMY_WALK_ROW = 1;          // แถวที่ใช้เป็นท่าเดิน (นับจาก 0)
const ENEMY_WALK_FRAME_COUNT = 8;  // จำนวนเฟรมในแถวเดิน
const ENEMY_ANIM_FRAME_DELAY = 8;  // ยิ่งเลขมาก ยิ่งสลับเฟรมช้าลง (หน่วยเป็นเฟรมของเกม)

// ================= คอนฟิกระบบโจมตีของ Orc =================
// แถว 2 (index 2) ในสไปรต์ชีตเป็นท่าฟันอาวุธ ใช้เป็นอนิเมชันตอนโจมตี
// ถ้าดูแล้วไม่ตรงท่า ปรับ ENEMY_ATTACK_ROW ตัวเดียวได้เลย (เหมือนตอนปรับ ENEMY_WALK_ROW)
const ENEMY_ATTACK_ROW = 2;
const ENEMY_ATTACK_FRAME_COUNT = 6;
const ENEMY_ATTACK_FRAME_DELAY = 6;
const ENEMY_ATTACK_RANGE_DEFAULT = 40;    // px จากศูนย์กลาง Orc ถึงศูนย์กลางผู้เล่น ก่อนเข้าโหมดโจมตี
const ENEMY_ATTACK_INTERVAL_FRAMES = 90;  // จำนวนเฟรมเกมระหว่างการโจมตีแต่ละครั้ง (กันโจมตีรัวเกินไป)
const ENEMY_RETURN_SNAP_DISTANCE = 4;     // px ระยะที่ถือว่า "ถึงจุดเกิดแล้ว" ตอนเดินกลับ

export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");

        // ================= ผูก this ให้ event handler ล่วงหน้า =================
        // ต้องสร้าง reference ที่ "คงที่" ตัวเดียวสำหรับแต่ละ handler
        // (bind ใน constructor ครั้งเดียว ไม่ใช่สร้างฟังก์ชันใหม่ทุกครั้งใน create())
        // เพื่อให้ removeEventListener ใน shutdown() ถอดตัวเดิมออกได้ถูกต้อง
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);
        this.onPostRender = this.onPostRender.bind(this);
    }

    // ================= PRELOAD: โหลด "ข้อมูลเกม" ผ่าน Phaser loader =================
    // ใช้ this.load.json() แทน fetch() ตรงๆ เพื่อให้ Phaser รอโหลดเสร็จก่อน
    // create() จะถูกเรียก (Phaser รับประกันลำดับให้เอง)
    preload() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // ถ้าโหลดไฟล์ข้อมูล (หรือไฟล์ใดๆ ที่ประกาศไว้) ไม่สำเร็จ (404/พาธผิด)
        // ให้ log ให้เห็นชัดๆ แทนที่จะเงียบแล้วไป error ทีหลังใน create()
        this.load.on("loaderror", (file) => {
            console.error(`โหลดไฟล์ไม่สำเร็จ: "${file.key}" จาก "${file.src}"`);
        });

        this.load.json(GAME_DATA_KEY, GAME_DATA_URL);
    }

    // ================= CREATE: ผูก event ก่อนเสมอ -> โหลดข้อมูล -> ตั้งค่า state =================
    create() {
        this.enemies = [];
        this.keys = { w: false, a: false, s: false, d: false };
        this.activeMessage = null;
        this.currentDialogueIndex = -1;
        this.gameOverTriggered = false;
        this.dataLoadError = null;

        // ================= ผูก Event Listener (ครั้งเดียวต่อการเข้า scene) =================
        // สำคัญ: ต้องผูกปุ่มควบคุม (WASD) เป็นสิ่งแรกสุดใน create() เสมอ ก่อนโค้ด
        // ส่วนอื่นที่อาจโยน error (เช่น อ่านข้อมูลจาก JSON ไม่สำเร็จ) เพราะถ้า error
        // เกิดขึ้นก่อนบรรทัด addEventListener จะทำให้ create() หยุดกลางคัน และ
        // ปุ่มกดจะไม่ถูกผูกเลยทั้ง scene (กด WASD แล้วไม่ตอบสนองอะไรเลย)
        //
        // ใช้ named/bound method (this.onKeyDown ฯลฯ ที่ bind ไว้ใน constructor)
        // แทน arrow function inline แบบเดิม เพื่อให้ removeEventListener ใน shutdown()
        // ถอด listener ตัวเดิมออกได้จริง ไม่งั้นทุกครั้งที่ restart scene จะมี
        // listener ใหม่มาผูกซ้อนทับของเก่าเรื่อยๆ ทำให้กดปุ่มครั้งเดียวแต่ผลลัพธ์
        // เกิดขึ้นหลายครั้ง (input เพี้ยน)
        // ย้ายปุ่มควบคุมมาดักจับที่ window เพื่อป้องกันบัค Canvas ไม่ Focus
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        this.canvas.addEventListener("click", this.onCanvasClick);

        // สำคัญ: Phaser จะ clear canvas เป็นสีดำทุกเฟรมหลังจาก update() ทำงานเสร็จ
        // (เพราะ scene ไม่มี game object ของ Phaser เลย เราวาดเองผ่าน ctx ทั้งหมด)
        // เลยต้องย้ายการวาด (this.draw()) มาทำงาน "หลัง" Phaser render เสร็จแล้วแทน
        // โดยฟังอีเวนต์ postrender ของเกม ไม่งั้นภาพที่วาดจะโดนลบทิ้งทุกเฟรม จอเลยดำ
        this.game.events.on(Phaser.Core.Events.POST_RENDER, this.onPostRender);

        // ================= ถอด Listener ทั้งหมดตอนออกจาก/รีสตาร์ต scene =================
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

        // ================= อ่านข้อมูลเกมทั้งหมดจาก cache (มาจาก gameplay-data.json) =================
        // ห่อด้วย try/catch: ถ้าโหลด/parse ไฟล์ข้อมูลไม่สำเร็จ (เช่น วางไฟล์ผิด path,
        // ชื่อไฟล์ไม่ตรงกับ GAME_DATA_URL ด้านบน) จะไม่ทำให้ scene พังทั้งหมดแบบเงียบๆ
        // แต่จะเห็น error ชัดเจนใน console และบนจอแทน ส่วนปุ่มกดยังใช้งานได้ปกติ
        try {
            this.gameData = this.cache.json.get(GAME_DATA_KEY);
            if (!this.gameData) {
                throw new Error(
                    `ไม่พบข้อมูลเกม (key: "${GAME_DATA_KEY}") — ตรวจสอบว่ามีไฟล์ที่ "${GAME_DATA_URL}" ` +
                    `จริง และเปิดผ่าน Live Server (ไม่ใช่เปิดไฟล์ตรงๆ แบบ file://)`
                );
            }

            this.loadAssets(this.gameData.assets);
            this.initTileConfig(this.gameData.tile);
            this.initWorld(this.gameData.world);
            this.initMissions(this.gameData.missions);
            this.initGameRules(this.gameData.gameRules);
            this.initPlayer(this.gameData.player);
            this.initEnemies(this.gameData.enemies);
            this.lookups = this.gameData.lookups;
            this.messages = this.gameData.messages;

            // ----- ปุ่ม Pause (หยุดเกมชั่วคราว) -----
            // หมายเหตุ: เดิมสร้างด้วย this.add.text() ซึ่งเป็น Phaser GameObject
            // แต่ scene นี้เรียก ctx.clearRect() ล้างทั้ง canvas ทุกเฟรมใน draw()
            // (ผูกกับ POST_RENDER) แล้ววาดใหม่เฉพาะสิ่งที่วาดด้วย ctx เท่านั้น
            // ปุ่มที่เป็น Phaser GameObject เลยโดนล้างทิ้งทุกเฟรมและไม่เคยเห็น
            // แก้โดยเก็บเป็นข้อมูลตำแหน่ง แล้วไปวาดเองด้วย ctx ใน drawUI() แทน
            this.pauseButton = { ...this.gameData.ui.pauseButton };
        } catch (err) {
            this.dataLoadError = err.message;
            console.error("โหลดข้อมูลเกมไม่สำเร็จ:", err);
        }
    }

    // ================= โหลดรูปภาพ/เสียงตามรายการที่ระบุใน gameData.assets =================
    loadAssets(assets) {
        this.images = {};
        for (const [key, path] of Object.entries(assets.images)) {
            const img = new Image();
            img.src = path;
            this.images[key] = img;
        }

        this.sounds = {};
        for (const [key, cfg] of Object.entries(assets.sounds)) {
            const audio = new Audio(cfg.src);
            audio.volume = cfg.volume;
            this.sounds[key] = audio;
        }
    }

    // ================= ศัตรู (ถ้ามีข้อมูล "enemy" ใน gameplay-data.json) =================
    // หมายเหตุ: ห้ามใช้ this.add.sprite() ที่นี่ เพราะ scene นี้เรียก ctx.clearRect()
    // ล้างทั้ง canvas ทุกเฟรมใน draw() (ผูกกับ POST_RENDER) แล้ววาดใหม่เฉพาะสิ่งที่
    // วาดด้วย ctx เท่านั้น — Phaser GameObject จะโดนล้างทิ้งทุกเฟรมเหมือนที่เคยเกิด
    // กับปุ่ม Pause มาก่อน จึงต้องเก็บเป็นข้อมูลตำแหน่ง แล้วไปวาดเองด้วย ctx แทน
    // (ดู drawEnemy()) เรียกจาก create() หลังจาก this.gameData โหลดเสร็จแล้วเท่านั้น
    // รับอาร์เรย์ enemiesData จาก gameData.enemies (ห้องละ 1 ตัวหรือกี่ตัวก็ได้)
    // แต่ละตัวมี state อิสระของตัวเอง (ตำแหน่ง, ทิศ, เฟรมอนิเมชัน) จึงเดิน/สลับเฟรม
    // ไม่พร้อมกันเป๊ะๆ ทำให้ดูเป็นธรรมชาติกว่าตัวเดียวซ้ำ
    initEnemies(enemiesData) {
        if (!enemiesData || enemiesData.length === 0) {
            this.enemies = [];
            return;
        }
        this.enemies = enemiesData.map(enemyData => ({
            x: enemyData.spawnX,
            y: enemyData.spawnY,
            spawnX: enemyData.spawnX,  // จุดเกิด ใช้เป็นศูนย์กลาง patrol และจุดที่ต้องเดินกลับ
            spawnY: enemyData.spawnY,
            speed: enemyData.speed,
            detectRadius: enemyData.detectRadius,   // ระยะที่เริ่มไล่ตามผู้เล่น
            attackRange: enemyData.attackRange ?? ENEMY_ATTACK_RANGE_DEFAULT, // ระยะที่หยุดเดินแล้วโจมตี
            hitbox: { ...enemyData.hitbox },
            direction: 1,       // 1 = หันขวา, -1 = หันซ้าย (ใช้พลิกภาพ)
            frame: 0,           // เฟรมอนิเมชันปัจจุบัน
            frameTimer: 0,      // นับเฟรมเกมเพื่อหน่วงเวลาก่อนเปลี่ยนเฟรมอนิเมชัน
            patrolRange: enemyData.patrolRange ?? 60, // ระยะห่างจาก spawnX สูงสุดตอน patrol (px)
            mode: "patrol",     // "patrol" | "chase" | "attack" | "return"
            prevMode: "patrol", // ใช้เช็คว่าโหมดเพิ่งเปลี่ยนหรือไม่ เพื่อรีเซ็ตเฟรมอนิเมชัน
            attackCooldown: 0   // นับเฟรมระหว่างการโจมตีแต่ละครั้ง
        }));
    }

    // ================= ตั้งค่าการวาดไทล์จากข้อมูล =================
    initTileConfig(tile) {
        this.TILE_SIZE = tile.size;
        this.FLOOR_TILE = { ...tile.floorTile };
        this.WALL_TILE = { ...tile.wallTile };
        this.WALL_FLIP = JSON.parse(JSON.stringify(tile.wallFlip));
    }

    // ================= ห้อง / ทางเดิน / ประตู (deep-clone เพราะ door.locked ถูกแก้ระหว่างเล่น) =================
    initWorld(world) {
        this.rooms = JSON.parse(JSON.stringify(world.rooms));
        this.corridors = JSON.parse(JSON.stringify(world.corridors));
        this.door1 = { ...world.doors.door1 };
        this.door2 = { ...world.doors.door2 };
        this.door3 = { ...world.doors.door3 };
    }

    // ================= มิชชันทั้ง 5 (deep-clone ทุกอาเรย์ เพราะ state ของแต่ละไอเทมถูกแก้ระหว่างเล่น) =================
    initMissions(missions) {
        // MISSION 1
        this.books = JSON.parse(JSON.stringify(missions.books.items));
        this.bookSize = missions.books.size;
        this.hasMagicScroll = false;

        // MISSION 2
        this.statues = JSON.parse(JSON.stringify(missions.statues.items));
        this.statueSize = missions.statues.size;
        this.statuesSolved = false;

        // MISSION 3
        this.torches = JSON.parse(JSON.stringify(missions.torches.items));
        this.torchSize = missions.torches.size;
        this.correctSequence = [...missions.torches.correctSequence];
        this.currentStep = 0;
        this.torchesSolved = false;

        // MISSION 4
        this.npc = {
            x: missions.npc.x,
            y: missions.npc.y,
            size: missions.npc.size,
            name: missions.npc.name
        };
        this.npcDialogues = [...missions.npc.dialogues];
        this.npcTalked = false;

        // MISSION 5
        this.chests = JSON.parse(JSON.stringify(missions.chests.items));
        this.chestSize = missions.chests.size;
        this.gameCleared = false;
        this.isTrapped = false;
    }

    // ================= กติกาเกม (จำนวนครั้งที่พลาดได้ / ระยะโต้ตอบ ฯลฯ) =================
    initGameRules(rules) {
        this.mistakes = 0;
        this.maxMistakes = rules.maxMistakes;
        this.interactRadius = rules.interactRadius;
        this.trapSpeedPenalty = rules.trapSpeedPenalty;
        this.victoryDelayMs = rules.victoryDelayMs;
        this.gameOverDelayMs = rules.gameOverDelayMs;
    }

    // ================= ตัวละครผู้เล่น =================
    initPlayer(playerData) {
        this.player = {
            x: playerData.start.x,
            y: playerData.start.y,
            width: playerData.width,
            height: playerData.height,
            speed: playerData.speed,
            direction: playerData.direction,
            frame: 0,
            frameTimer: 0
        };
        this.baseSpeed = playerData.speed;
        this.collisionSize = { ...playerData.collisionSize };

        const sheet = playerData.spriteSheet;
        this.spriteWidth = sheet.sourceWidth / sheet.cols;
        this.spriteHeight = sheet.sourceHeight / sheet.rows;
        this.spriteCols = sheet.cols;

        this.animations = playerData.animations;
        this.animFrameDelay = playerData.animFrameDelay;
    }

    // ================= ถอด Event Listener ทั้งหมด (เรียกตอน scene shutdown/destroy) =================
    shutdown() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        if (this.canvas) {
            this.canvas.removeEventListener("click", this.onCanvasClick);
        }
        if (this.game && this.game.events) {
            this.game.events.off(Phaser.Core.Events.POST_RENDER, this.onPostRender);
        }
    }

    // ================= Handler: กดปุ่มคีย์บอร์ดลง =================
    onKeyDown(e) {
        let key = e.key.toLowerCase();
        const isMovementKey = (
            key === "w" || key === "a" || key === "s" || key === "d" ||
            key === "arrowup" || key === "arrowleft" || key === "arrowdown" || key === "arrowright"
        );

        // สำคัญ: ถ้ามีกล่องข้อความ "เดี่ยวๆ" ค้างอยู่ (ไม่ใช่บทสนทนา NPC หลายหน้า
        // ซึ่งต้องคลิกเพื่ออ่านทีละประโยคโดยตั้งใจ) ให้กดปุ่มเดินปิดข้อความนั้น
        // ให้เองทันที แล้วเริ่มเดินต่อได้เลย ไม่งั้นผู้เล่นจะรู้สึกว่า "กด WASD
        // แล้วไม่ขยับ" ทั้งที่จริงๆ คือ updatePlayer() บล็อกไว้เพราะยังมีข้อความ
        // ค้างอยู่ (แทบทุก action ในเกมจะเซ็ตข้อความขึ้นมาโชว์)
        if (isMovementKey && this.activeMessage && this.currentDialogueIndex === -1 && !this.gameOverTriggered) {
            this.activeMessage = null;
        }

        if (key === "w" || key === "arrowup") this.keys.w = true;
        if (key === "a" || key === "arrowleft") this.keys.a = true;
        if (key === "s" || key === "arrowdown") this.keys.s = true;
        if (key === "d" || key === "arrowright") this.keys.d = true;
    }

    // ================= Handler: ปล่อยปุ่มคีย์บอร์ด =================
    onKeyUp(e) {
        let key = e.key.toLowerCase();
        if (key === "w" || key === "arrowup") this.keys.w = false;
        if (key === "a" || key === "arrowleft") this.keys.a = false;
        if (key === "s" || key === "arrowdown") this.keys.s = false;
        if (key === "d" || key === "arrowright") this.keys.d = false;
    }

    // ================= Handler: คลิกบน canvas (ส่งต่อให้ handleClick) =================
    onCanvasClick(e) {
        this.handleClick(e);
    }

    // ================= Handler: วาดฉากหลัง Phaser render เสร็จในแต่ละเฟรม =================
    onPostRender() {
        // สำคัญ: ถ้า scene นี้ถูก pause อยู่ (เช่นตอนเปิด PauseScene ทับ)
        // ต้อง "ไม่" วาดซ้ำ ไม่งั้นภาพจาก ctx จะไปทับฉาก PauseScene ทุกเฟรม
        if (this.scene.isActive()) {
            this.draw();
        }
    }

    // ================= แทนค่าตัวแปรใน template ข้อความ (เช่น "{name}") ด้วยค่าจริง =================
    formatMessage(template, vars = {}) {
        return template.replace(/\{(\w+)\}/g, (match, key) =>
            Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
        );
    }

    // ================= จัดการคลิกเมาส์ (แยกจาก create เพื่อความอ่านง่าย) =================
    handleClick(e) {
        const canvas = this.canvas;

        if (this.gameOverTriggered) return;

        // --- คลิกปุ่ม Pause (เช็คก่อนเงื่อนไขอื่นเสมอ ให้กด pause ได้ทุกเมื่อ) ---
        {
            let rect = canvas.getBoundingClientRect();
            let scaleX = canvas.width / rect.width;
            let scaleY = canvas.height / rect.height;
            let clickX = (e.clientX - rect.left) * scaleX;
            let clickY = (e.clientY - rect.top) * scaleY;
            let pb = this.pauseButton;
            if (clickX >= pb.x - pb.w / 2 && clickX <= pb.x + pb.w / 2 &&
                clickY >= pb.y - pb.h / 2 && clickY <= pb.y + pb.h / 2) {
                this.scene.pause();
                this.scene.launch("PauseScene");
                return;
            }
        }

        if (this.currentDialogueIndex !== -1) {
            this.currentDialogueIndex++;
            if (this.currentDialogueIndex < this.npcDialogues.length) {
                this.activeMessage = this.npcDialogues[this.currentDialogueIndex];
            } else {
                this.currentDialogueIndex = -1;
                this.activeMessage = null;
                if (!this.npcTalked) {
                    this.npcTalked = true;
                    this.playStageClearSound();
                }
            }
            return;
        }

        if (this.activeMessage) {
            this.activeMessage = null;
            return;
        }

        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        let clickX = (e.clientX - rect.left) * scaleX;
        let clickY = (e.clientY - rect.top) * scaleY;

        // --- คลิกหนังสือ ---
        for (let i = 0; i < this.books.length; i++) {
            let b = this.books[i];
            if (clickX >= b.x - this.bookSize / 2 && clickX <= b.x + this.bookSize / 2 && clickY >= b.y - this.bookSize / 2 && clickY <= b.y + this.bookSize / 2) {
                if (!this.isNear(this.player.x, this.player.y, b.x, b.y)) {
                    this.activeMessage = this.messages.tooFar;
                    return;
                }
                this.activeMessage = b.message;
                this.playSfx(this.sounds.bookSound);
                if (b.correct && !this.hasMagicScroll) {
                    this.hasMagicScroll = true;
                    this.door1.locked = false;
                    this.playStageClearSound();
                } else if (!b.correct && !this.hasMagicScroll) {
                    this.registerMistake(this.formatMessage(this.messages.bookWrong, { title: b.title }));
                }
                return;
            }
        }

        // --- คลิกรูปปั้น ---
        for (let i = 0; i < this.statues.length; i++) {
            let s = this.statues[i];
            if (clickX >= s.x - this.statueSize / 2 && clickX <= s.x + this.statueSize / 2 && clickY >= s.y - this.statueSize / 2 && clickY <= s.y + this.statueSize / 2) {
                if (!this.isNear(this.player.x, this.player.y, s.x, s.y)) {
                    this.activeMessage = this.messages.tooFar;
                    return;
                }
                s.angle = (s.angle + 90) % 360;
                this.playSfx(this.sounds.stoneSound);
                let isCorrect = s.angle === s.targetAngle;
                let correctCount = this.statues.filter(st => st.angle === st.targetAngle).length;
                if (isCorrect) {
                    this.activeMessage = this.formatMessage(this.messages.statueCorrect, { name: s.name, count: correctCount });
                } else {
                    this.activeMessage = this.formatMessage(this.messages.statueWrong, {
                        name: s.name,
                        direction: this.getDirectionName(s.angle),
                        count: correctCount
                    });
                }
                this.checkStatuesPuzzle();
                return;
            }
        }

        // --- คลิกคบเพลิง ---
        for (let i = 0; i < this.torches.length; i++) {
            let t = this.torches[i];
            if (clickX >= t.x - this.torchSize / 2 && clickX <= t.x + this.torchSize / 2 && clickY >= t.y - this.torchSize / 2 && clickY <= t.y + this.torchSize / 2) {
                if (this.torchesSolved) return;
                if (!this.isNear(this.player.x, this.player.y, t.x, t.y)) {
                    this.activeMessage = this.messages.tooFar;
                    return;
                }
                if (t.id === this.correctSequence[this.currentStep]) {
                    t.isOn = true;
                    this.currentStep++;
                    this.activeMessage = this.formatMessage(this.messages.torchLit, { name: t.name });
                    this.playSfx(this.sounds.fireSound);
                    if (this.currentStep === this.correctSequence.length) {
                        this.torchesSolved = true;
                        this.door3.locked = false;
                        this.activeMessage = this.messages.torchesSolved;
                        this.playStageClearSound();
                    }
                } else {
                    this.torches.forEach(torch => torch.isOn = false);
                    this.currentStep = 0;
                    this.door3.locked = true;
                    this.registerMistake(this.messages.torchWrongOrder);
                }
                return;
            }
        }

        // --- คลิก NPC ---
        const npc = this.npc;
        if (clickX >= npc.x - npc.size / 2 && clickX <= npc.x + npc.size / 2 && clickY >= npc.y - npc.size / 2 && clickY <= npc.y + npc.size / 2) {
            if (!this.isNear(this.player.x, this.player.y, npc.x, npc.y)) {
                this.activeMessage = this.messages.tooFar;
                return;
            }
            if (!this.npcTalked) {
                this.currentDialogueIndex = 0;
                this.activeMessage = this.npcDialogues[this.currentDialogueIndex];
            } else {
                this.activeMessage = this.messages.npcAfterTalked;
            }
            return;
        }

        // --- คลิกหีบสมบัติ ---
        for (let i = 0; i < this.chests.length; i++) {
            let c = this.chests[i];
            if (clickX >= c.x - this.chestSize / 2 && clickX <= c.x + this.chestSize / 2 && clickY >= c.y - this.chestSize / 2 && clickY <= c.y + this.chestSize / 2) {
                if (c.isOpened || this.gameCleared) return;
                if (!this.isNear(this.player.x, this.player.y, c.x, c.y)) {
                    this.activeMessage = this.messages.tooFar;
                    return;
                }
                c.isOpened = true;
                this.playSfx(this.sounds.chestSound);
                if (c.isCorrect) {
                    this.gameCleared = true;
                    this.isTrapped = false;
                    this.player.speed = this.baseSpeed;
                    this.activeMessage = this.formatMessage(this.messages.chestCorrect, { name: c.name });
                    this.playSfx(this.sounds.winSound);

                    // ================= เงื่อนไขชนะเกม =================
                    // เมื่อเปิดหีบถูกใบแล้ว รอสักครู่ (ให้ผู้เล่นอ่านข้อความ/ฟังเสียงจบก่อน)
                    // แล้วค่อยไปหน้า VictoryScene
                    this.time.delayedCall(this.victoryDelayMs, () => {
                        this.scene.start("VictoryScene");
                    });
                } else {
                    this.isTrapped = true;
                    this.player.speed = this.trapSpeedPenalty;
                    this.registerMistake(this.formatMessage(this.messages.chestTrap, { name: c.name }));
                }
                return;
            }
        }
    }

    // ================= ฟังก์ชันเสียง =================
    playSfx(audio) {
        try {
            audio.currentTime = 0;
            audio.play().catch(() => {
                // เบราว์เซอร์บางตัวบล็อกการเล่นเสียงอัตโนมัติก่อนมี user interaction
            });
        } catch (err) {
            console.error("เล่นเสียงไม่ได้:", err);
        }
    }

    playStageClearSound() {
        this.playSfx(this.sounds.stageClearSound);
    }

    // ================= นับความพลาด / เช็คแพ้เกม =================
    registerMistake(reasonText) {
        if (this.gameOverTriggered || this.gameCleared) return;

        this.mistakes++;
        let remaining = this.maxMistakes - this.mistakes;

        if (this.mistakes >= this.maxMistakes) {
            this.gameOverTriggered = true;
            this.activeMessage = `💀 ${reasonText} ${this.formatMessage(this.messages.gameOverSuffix, { max: this.maxMistakes })}`;
            this.playSfx(this.sounds.loseSound);
            // รอสักครู่ให้ผู้เล่นอ่านข้อความก่อนเด้งไปหน้า Game Over
            this.time.delayedCall(this.gameOverDelayMs, () => {
                this.scene.start("GameOverScene");
            });
        } else {
            this.activeMessage = `${reasonText} ${this.formatMessage(this.messages.mistakeWarning, { mistakes: this.mistakes, max: this.maxMistakes, remaining })}`;
        }
    }

    // ================= ฟังก์ชันช่วยเหลือทั่วไป =================
    isNear(px, py, ox, oy, radius = this.interactRadius) {
        let dx = px - ox;
        let dy = py - oy;
        return (dx * dx + dy * dy) <= radius * radius;
    }

    getDirectionName(angle) {
        return this.lookups.directionNames[angle] ?? `${angle}°`;
    }

    getArrowSymbol(angle) {
        return this.lookups.arrowSymbols[angle] ?? "?";
    }

    checkStatuesPuzzle() {
        let allCorrect = this.statues.every(s => s.angle === s.targetAngle);
        if (allCorrect) {
            if (!this.statuesSolved) {
                this.statuesSolved = true;
                this.door2.locked = false;
                this.activeMessage = this.messages.statuesSolved;
                this.playStageClearSound();
            }
        } else {
            this.statuesSolved = false;
            this.door2.locked = true;
        }
    }

    // ================= ระบบคำนวณการชน =================
    isWalkable(cx, cy, w, h) {
        let left = cx - w / 2;
        let right = cx + w / 2;
        let top = cy - h / 2;
        let bottom = cy + h / 2;

        if (left < 0 || right > this.canvas.width || top < 0 || bottom > this.canvas.height) return false;

        if (this.door1.locked && left < this.door1.x + this.door1.w && right > this.door1.x && top < this.door1.y + this.door1.h && bottom > this.door1.y) return false;
        if (this.door2.locked && left < this.door2.x + this.door2.w && right > this.door2.x && top < this.door2.y + this.door2.h && bottom > this.door2.y) return false;
        if (this.door3.locked && left < this.door3.x + this.door3.w && right > this.door3.x && top < this.door3.y + this.door3.h && bottom > this.door3.y) return false;

        for (let i = 0; i < this.rooms.length; i++) {
            let r = this.rooms[i];
            if (left >= r.x && right <= r.x + r.w && top >= r.y && bottom <= r.y + r.h) {
                return true;
            }
        }
        for (let i = 0; i < this.corridors.length; i++) {
            let c = this.corridors[i];
            if (left >= c.x && right <= c.x + c.w && top >= c.y && bottom <= c.y + c.h) {
                return true;
            }
        }
        let centerInRoom = this.rooms.some(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
        let centerInCorridor = this.corridors.some(c => cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h);

        return (centerInRoom || centerInCorridor);
    }

    // ================= เดิน =================
    updatePlayer() {
        if (this.activeMessage) return;

        const player = this.player;
        let newX = player.x;
        let newY = player.y;
        let moving = false;

        if (this.keys.w) { newY -= player.speed; player.direction = "back"; moving = true; }
        if (this.keys.s) { newY += player.speed; player.direction = "front"; moving = true; }
        if (this.keys.a) { newX -= player.speed; player.direction = "left"; moving = true; }
        if (this.keys.d) { newX += player.speed; player.direction = "right"; moving = true; }

        // แยกเช็ก X และ Y อิสระ เพื่อให้สามารถสไลด์ไปตามกำแพงได้ ไม่ติดขัด
        if (this.isWalkable(newX, player.y, this.collisionSize.w, this.collisionSize.h)) {
            player.x = newX;
        }
        if (this.isWalkable(player.x, newY, this.collisionSize.w, this.collisionSize.h)) {
            player.y = newY;
        }

        if (moving) {
            player.frameTimer++;
            if (player.frameTimer > this.animFrameDelay) {
                player.frame++;
                if (player.frame >= 4) player.frame = 0;
                player.frameTimer = 0;
            }
        } else {
            player.frame = 0;
        }
    }

    // ================= พฤติกรรม Orc ทุกตัว: patrol -> chase -> attack -> return =================
    // patrol: เดินไป-กลับรอบจุดเกิดตามเดิม (เหมือนก่อนหน้านี้)
    // chase:  เมื่อผู้เล่นเข้าระยะ detectRadius -> เดินตรงเข้าหาผู้เล่น
    // attack: เมื่อเข้าใกล้ผู้เล่นถึงระยะ attackRange -> หยุดเดิน หันหน้าเข้าหา แล้วโจมตี
    //         เป็นช่วงๆ (ทำให้ผู้เล่นเสีย "พลาด" ผ่าน registerMistake() ที่มีอยู่แล้ว)
    // return: เมื่อผู้เล่นหนีออกนอกระยะ detectRadius -> เดินกลับจุดเกิดก่อน แล้วค่อยกลับเป็น patrol
    //
    // หมายเหตุ: หยุดพฤติกรรมทั้งหมดระหว่างมีข้อความ (activeMessage) ค้างอยู่ เหมือนที่
    // updatePlayer() บล็อกการเดินของผู้เล่นไว้เช่นกัน กันไม่ให้โดนโจมตีระหว่างอ่านข้อความ
    updateEnemies() {
        if (!this.enemies || this.enemies.length === 0) return;
        if (this.activeMessage) return;

        const player = this.player;

        this.enemies.forEach(e => {
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const distToPlayer = Math.hypot(dx, dy);

            // --- ตัดสินใจเปลี่ยนโหมดพฤติกรรมตามระยะห่างจากผู้เล่น ---
            if (distToPlayer <= e.attackRange) {
                e.mode = "attack";
            } else if (distToPlayer <= e.detectRadius) {
                e.mode = "chase";
            } else if (e.mode === "chase" || e.mode === "attack") {
                e.mode = "return"; // เพิ่งหลุดระยะตรวจจับ ให้เดินกลับจุดเกิดก่อน
            }

            // โหมดเพิ่งเปลี่ยน -> รีเซ็ตเฟรมอนิเมชัน กันภาพเพี้ยนตอนสลับท่า
            if (e.mode !== e.prevMode) {
                e.frame = 0;
                e.frameTimer = 0;
                e.prevMode = e.mode;
            }

            if (e.mode === "attack") {
                e.direction = dx >= 0 ? 1 : -1; // หันหน้าเข้าหาผู้เล่นแม้จะไม่ขยับตำแหน่ง

                e.frameTimer++;
                if (e.frameTimer > ENEMY_ATTACK_FRAME_DELAY) {
                    e.frame = (e.frame + 1) % ENEMY_ATTACK_FRAME_COUNT;
                    e.frameTimer = 0;
                }

                e.attackCooldown++;
                if (e.attackCooldown >= ENEMY_ATTACK_INTERVAL_FRAMES) {
                    e.attackCooldown = 0;
                    this.registerMistake(this.messages.orcAttack);
                }
                return; // อยู่กับที่ตอนโจมตี ไม่ต้องเดินต่อด้านล่าง
            }

            // โหมดอื่นที่ไม่ใช่ attack -> รีเซ็ตตัวจับเวลาโจมตี กันโจมตีทันทีที่กลับเข้าระยะอีกครั้ง
            e.attackCooldown = 0;

            if (e.mode === "chase") {
                if (distToPlayer > 0) {
                    e.x += (dx / distToPlayer) * e.speed;
                    e.y += (dy / distToPlayer) * e.speed;
                    e.direction = dx >= 0 ? 1 : -1;
                }
            } else if (e.mode === "return") {
                const rdx = e.spawnX - e.x;
                const rdy = e.spawnY - e.y;
                const distToSpawn = Math.hypot(rdx, rdy);
                if (distToSpawn < ENEMY_RETURN_SNAP_DISTANCE) {
                    e.x = e.spawnX;
                    e.y = e.spawnY;
                    e.mode = "patrol";
                    e.direction = 1;
                } else {
                    e.x += (rdx / distToSpawn) * e.speed;
                    e.y += (rdy / distToSpawn) * e.speed;
                    e.direction = rdx >= 0 ? 1 : -1;
                }
            } else {
                // patrol: เดินไป-กลับรอบจุดเกิดตามเดิม
                e.x += e.speed * e.direction;
                if (e.x > e.spawnX + e.patrolRange) {
                    e.x = e.spawnX + e.patrolRange;
                    e.direction = -1;
                } else if (e.x < e.spawnX - e.patrolRange) {
                    e.x = e.spawnX - e.patrolRange;
                    e.direction = 1;
                }
            }

            // อนิเมชันเดิน ใช้ร่วมกันทั้ง patrol / chase / return
            e.frameTimer++;
            if (e.frameTimer > ENEMY_ANIM_FRAME_DELAY) {
                e.frame = (e.frame + 1) % ENEMY_WALK_FRAME_COUNT;
                e.frameTimer = 0;
            }
        });
    }

    // ================= วาดพื้นด้วย Tileset =================
    drawTiledFloor(area) {
        const ctx = this.ctx;
        const TILE_SIZE = this.TILE_SIZE;
        const floorTileset = this.images.floorTileset;

        if (!floorTileset.complete || floorTileset.naturalWidth === 0) {
            ctx.fillStyle = "#22252a";
            ctx.fillRect(area.x, area.y, area.w, area.h);
            return;
        }

        const sx = this.FLOOR_TILE.col * TILE_SIZE;
        const sy = this.FLOOR_TILE.row * TILE_SIZE;

        const startX = Math.floor(area.x / TILE_SIZE) * TILE_SIZE;
        const startY = Math.floor(area.y / TILE_SIZE) * TILE_SIZE;

        ctx.save();
        ctx.beginPath();
        ctx.rect(area.x, area.y, area.w, area.h);
        ctx.clip();

        for (let ty = startY; ty < area.y + area.h; ty += TILE_SIZE) {
            for (let tx = startX; tx < area.x + area.w; tx += TILE_SIZE) {
                ctx.drawImage(floorTileset, sx, sy, TILE_SIZE, TILE_SIZE, tx, ty, TILE_SIZE, TILE_SIZE);
            }
        }
        ctx.restore();
    }

    // ================= วาดกำแพงล้อมรอบห้องด้วย Tileset =================
    drawWallBorder(area) {
        const ctx = this.ctx;
        const TILE_SIZE = this.TILE_SIZE;
        const wallTop = this.images.wallTilesetTopBottom;
        const wallSide = this.images.wallTilesetSide;
        const topReady = wallTop.complete && wallTop.naturalWidth > 0;
        const sideReady = wallSide.complete && wallSide.naturalWidth > 0;

        if (!topReady && !sideReady) {
            ctx.strokeStyle = "#e07a5f";
            ctx.lineWidth = 4;
            ctx.strokeRect(area.x, area.y, area.w, area.h);
            return;
        }

        const sx = this.WALL_TILE.col * TILE_SIZE;
        const sy = this.WALL_TILE.row * TILE_SIZE;
        const half = TILE_SIZE / 2;

        const drawWallTile = (img, dx, dy, flip) => {
            const cx = dx + half;
            const cy = dy + half;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(flip.flipX ? -1 : 1, flip.flipY ? -1 : 1);
            ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, -half, -half, TILE_SIZE, TILE_SIZE);
            ctx.restore();
        };

        if (topReady) {
            for (let tx = area.x; tx < area.x + area.w; tx += TILE_SIZE) {
                drawWallTile(wallTop, tx, area.y - half, this.WALL_FLIP.top);
                drawWallTile(wallTop, tx, area.y + area.h - half, this.WALL_FLIP.bottom);
            }
        }
        if (sideReady) {
            for (let ty = area.y; ty < area.y + area.h; ty += TILE_SIZE) {
                drawWallTile(wallSide, area.x - half, ty, this.WALL_FLIP.left);
                drawWallTile(wallSide, area.x + area.w - half, ty, this.WALL_FLIP.right);
            }
        }
    }

    // ================= วาดองค์ประกอบต่าง ๆ =================
    drawBooks() {
        const ctx = this.ctx;
        const bookImg = this.images.bookImg;
        this.books.forEach(b => {
            if (bookImg.complete && bookImg.naturalWidth > 0) {
                ctx.drawImage(bookImg, b.x - this.bookSize / 2, b.y - this.bookSize / 2, this.bookSize, this.bookSize);
            } else {
                ctx.fillStyle = "#8b5e3c"; ctx.fillRect(b.x - this.bookSize / 2, b.y - this.bookSize / 2, this.bookSize, this.bookSize);
            }
        });
    }

    drawStatues() {
        const ctx = this.ctx;
        const statueImg = this.images.statueImg;
        this.statues.forEach(s => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate((s.angle * Math.PI) / 180);
            if (statueImg.complete && statueImg.naturalWidth > 0) {
                ctx.drawImage(statueImg, -this.statueSize / 2, -this.statueSize / 2, this.statueSize, this.statueSize);
            } else {
                ctx.fillStyle = "#7f8c8d"; ctx.fillRect(-this.statueSize / 2, -this.statueSize / 2, this.statueSize, this.statueSize);
                ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.moveTo(0, -this.statueSize / 2 + 5);
                ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
            }
            ctx.restore();

            if (s.angle === s.targetAngle) {
                ctx.fillStyle = "#2ecc71";
                ctx.font = `bold 14px ${Theme.font.body}`;
                ctx.fillText("✔", s.x + this.statueSize / 2 - 4, s.y - this.statueSize / 2 + 4);
            }
        });
    }

    drawStatueHintNearPlayer() {
        const ctx = this.ctx;
        for (let i = 0; i < this.statues.length; i++) {
            let s = this.statues[i];
            if (s.angle === s.targetAngle) continue;
            if (this.isNear(this.player.x, this.player.y, s.x, s.y)) {
                ctx.textAlign = "center";
                ctx.font = `bold 22px ${Theme.font.body}`;
                ctx.fillStyle = "#f1c40f";
                ctx.fillText(this.getArrowSymbol(s.targetAngle), this.player.x + this.player.width / 2 + 20, this.player.y - 10);
                ctx.textAlign = "left";
                break;
            }
        }
    }

    drawTorches() {
        const ctx = this.ctx;
        const torchImg = this.images.torchImg;
        this.torches.forEach(t => {
            if (torchImg.complete && torchImg.naturalWidth > 0) {
                ctx.save();
                if (!t.isOn) ctx.globalAlpha = 0.4;
                ctx.drawImage(torchImg, t.x - this.torchSize / 2, t.y - this.torchSize / 2, this.torchSize, this.torchSize);
                ctx.restore();
            } else {
                ctx.fillStyle = t.isOn ? "#f1c40f" : "#34495e"; ctx.fillRect(t.x - this.torchSize / 2, t.y - this.torchSize / 2, this.torchSize, this.torchSize);
            }
        });
    }

    drawNPC() {
        const ctx = this.ctx;
        const npc = this.npc;
        const npcImg = this.images.npcImg;
        if (npcImg.complete && npcImg.naturalWidth > 0) {
            ctx.drawImage(npcImg, npc.x - npc.size / 2, npc.y - npc.size / 2, npc.size, npc.size);
        } else {
            ctx.fillStyle = "#9b59b6"; ctx.fillRect(npc.x - npc.size / 2, npc.y - npc.size / 2, npc.size, npc.size);
        }
    }

    drawChests() {
        const ctx = this.ctx;
        const chestImg = this.images.chestImg;
        this.chests.forEach(c => {
            ctx.save();
            if (c.isOpened) ctx.globalAlpha = 0.5;
            if (chestImg.complete && chestImg.naturalWidth > 0) {
                ctx.drawImage(chestImg, c.x - this.chestSize / 2, c.y - this.chestSize / 2, this.chestSize, this.chestSize);
            } else {
                ctx.fillStyle = c.isOpened ? "#7f8c8d" : "#e67e22"; ctx.fillRect(c.x - this.chestSize / 2, c.y - this.chestSize / 2, this.chestSize, this.chestSize);
            }
            ctx.restore();
        });
    }

    // ================= วาดศัตรู (Orc ทุกตัวในอาร์เรย์ พร้อมอนิเมชันเดิน/โจมตี) =================
    // ขนาดที่วาด: แยกออกจาก hitbox โดยคูณด้วย ENEMY_DISPLAY_SCALE
    // (เทียบเท่ากับตอนใช้ this.add.sprite(...).setScale(2) ในเวอร์ชัน Phaser sprite)
    // hitbox ยังคงค่าดิบไว้เหมือนเดิม ไม่กระทบ logic การตรวจจับ/ชนใดๆ
    //
    // อนิเมชัน: เลือกแถว/จำนวนเฟรมตาม e.mode (โจมตี ใช้ ENEMY_ATTACK_ROW, อื่นๆ ใช้
    // ENEMY_WALK_ROW) แล้วพลิกภาพซ้าย-ขวาด้วย ctx.scale(e.direction, 1) ตามทิศที่หันอยู่
    // (ภาพต้นฉบับในสไปรต์ชีตหันหน้าไปทางขวาเป็นค่าเริ่มต้น)
    drawEnemies() {
        if (!this.enemies || this.enemies.length === 0) return;
        const ctx = this.ctx;
        const enemyImg = this.images.enemyImg;
        const ENEMY_DISPLAY_SCALE = 5; // ปรับตัวเลขนี้ได้ตามชอบเพื่อเพิ่ม/ลดขนาดตัวศัตรูทุกตัว

        this.enemies.forEach(e => {
            const size = (e.hitbox.hRadius + e.hitbox.vRadius) * ENEMY_DISPLAY_SCALE;

            if (enemyImg && enemyImg.complete && enemyImg.naturalWidth > 0) {
                const isAttacking = e.mode === "attack";
                const row = isAttacking ? ENEMY_ATTACK_ROW : ENEMY_WALK_ROW;
                const frameCount = isAttacking ? ENEMY_ATTACK_FRAME_COUNT : ENEMY_WALK_FRAME_COUNT;
                const frame = e.frame % frameCount; // กันเหนียวกรณีเฟรมค้างเกินขอบตอนสลับโหมด

                const sx = frame * ENEMY_FRAME_SIZE;
                const sy = row * ENEMY_FRAME_SIZE;

                ctx.save();
                ctx.translate(e.x, e.y);
                ctx.scale(e.direction, 1);
                ctx.drawImage(
                    enemyImg,
                    sx, sy, ENEMY_FRAME_SIZE, ENEMY_FRAME_SIZE,
                    -size, -size, size * 2, size * 2
                );
                ctx.restore();
            } else {
                ctx.fillStyle = e.mode === "attack" ? "#e74c3c" : "#c0392b";
                ctx.beginPath();
                ctx.ellipse(e.x, e.y, size, size, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    drawDoors() {
        const ctx = this.ctx;
        ctx.lineWidth = 2; ctx.strokeStyle = "#000000";
        let allDoors = [this.door1, this.door2, this.door3];
        allDoors.forEach(d => {
            ctx.fillStyle = d.locked ? "#c0392b" : "#2ecc71";
            ctx.fillRect(d.x, d.y, d.w, d.h);
            ctx.strokeRect(d.x, d.y, d.w, d.h);
        });
    }

    drawMessageBox() {
        const ctx = this.ctx;
        if (!this.activeMessage) return;

        let boxW = 800; let boxH = 140;
        let boxX = (this.canvas.width - boxW) / 2;
        let boxY = this.canvas.height - boxH - 40;

        ctx.fillStyle = "rgba(26, 16, 10, 0.95)"; ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = Theme.color.gold; ctx.lineWidth = 3; ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = Theme.color.parchment; ctx.font = `20px ${Theme.font.body}`;
        this.wrapText(this.activeMessage, boxX + 30, boxY + 40, boxW - 60, 28);

        ctx.fillStyle = Theme.color.torch; ctx.font = `16px ${Theme.font.body}`;
        let tipText = (this.currentDialogueIndex !== -1)
            ? this.messages.nextDialogueTip
            : `${this.messages.closeMessageTip} หรือกด WASD เพื่อเดินต่อได้เลย`;
        ctx.fillText(tipText, boxX + 30, boxY + boxH - 20);
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        const ctx = this.ctx;
        let words = text.split(" ");
        let line = ""; let currentY = y;
        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + " ";
            let testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + " "; currentY += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x, currentY);
    }

    drawUI() {
        const ctx = this.ctx;

        // --- ปุ่ม Pause มุมขวาบน ---
        {
            let pb = this.pauseButton;
            ctx.fillStyle = "#1f140d";
            ctx.fillRect(pb.x - pb.w / 2, pb.y - pb.h / 2, pb.w, pb.h);
            ctx.strokeStyle = Theme.color.gold;
            ctx.lineWidth = 2;
            ctx.strokeRect(pb.x - pb.w / 2, pb.y - pb.h / 2, pb.w, pb.h);
            ctx.fillStyle = Theme.color.goldBright;
            ctx.font = `24px ${Theme.font.title}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("||", pb.x, pb.y + 1);
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
        }

        ctx.fillStyle = Theme.color.parchment; ctx.font = `13px ${Theme.font.body}`;
        ctx.fillStyle = this.hasMagicScroll ? Theme.color.goldBright : Theme.color.parchment;
        ctx.fillText("M1: " + (this.hasMagicScroll ? "✔️" : "🔒"), 20, 30);
        ctx.fillStyle = this.statuesSolved ? Theme.color.emerald : Theme.color.parchment;
        ctx.fillText("M2: " + (this.statuesSolved ? "✔️" : "🔒"), 90, 30);
        ctx.fillStyle = this.torchesSolved ? Theme.color.torch : Theme.color.parchment;
        ctx.fillText("M3: " + (this.torchesSolved ? "✔️" : "🔒"), 160, 30);
        ctx.fillStyle = this.npcTalked ? "#c48ce0" : Theme.color.parchment;
        ctx.fillText("M4 NPC: " + (this.npcTalked ? "✔️" : "🔒"), 230, 30);

        ctx.fillStyle = this.mistakes > 0 ? Theme.color.bloodBright : Theme.color.parchment;
        ctx.fillText(`❌ พลาด: ${this.mistakes}/${this.maxMistakes}`, 320, 30);

        if (this.gameCleared) {
            ctx.fillStyle = Theme.color.emerald; ctx.font = `bold 16px ${Theme.font.body}`;
            ctx.fillText("🎉 GAME CLEAR!! คุณได้กุญแจทองคำแล้ว!", 450, 30);
        } else if (this.isTrapped) {
            ctx.fillStyle = Theme.color.bloodBright; ctx.fillText("⚠️ ติดกับดัก! ตัวช้าลง (หาหีบใบใหม่)", 450, 30);
        } else {
            ctx.fillStyle = Theme.color.parchment; ctx.fillText("M5: ตามหาหีบกุญแจจริงในห้องขวาล่าง", 450, 30);
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.dataLoadError) {
            ctx.fillStyle = "#000"; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = "#f00"; ctx.font = "16px monospace";
            ctx.fillText("โหลดข้อมูลเกมไม่สำเร็จ:", 20, 40);
            this.wrapText(this.dataLoadError, 20, 70, this.canvas.width - 40, 22);
            return;
        }

        // ปูพื้นเฉพาะรูปทรงของห้อง + ทางเดินจริงๆ เท่านั้น
        this.corridors.forEach(c => this.drawTiledFloor(c));

        this.rooms.forEach(r => {
            this.drawTiledFloor(r);
            this.drawWallBorder(r);

            ctx.fillStyle = "rgba(232, 220, 192, 0.45)";
            ctx.font = `12px ${Theme.font.body}`;
            ctx.fillText(r.quest, r.x + 10, r.y + 20);
        });

        this.drawDoors();
        this.drawBooks();
        this.drawStatues();
        this.drawTorches();
        this.drawNPC();
        this.drawChests();
        this.drawEnemies();

        const player = this.player;
        const playerImg = this.images.playerImg;
        if (playerImg.complete && playerImg.naturalWidth > 0) {
            let frameIndex = this.animations[player.direction][player.frame];
            let frameX = frameIndex % this.spriteCols; let frameY = Math.floor(frameIndex / this.spriteCols);
            ctx.drawImage(playerImg, frameX * this.spriteWidth, frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
        } else {
            ctx.fillStyle = "#e63946"; ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
        }

        this.drawStatueHintNearPlayer();

        this.drawUI();
        this.drawMessageBox();
    }

    // ================= UPDATE: เรียกทุกเฟรมโดย Phaser เอง (ก่อน render) =================
    // หมายเหตุ: ที่นี่อัปเดตแค่ logic การเดิน ส่วนการวาด (this.draw()) ย้ายไปทำใน
    // อีเวนต์ postrender แทน (ดูใน create()) เพราะ Phaser จะ clear canvas ทีหลัง update() เสมอ
    update() {
        if (this.dataLoadError) return;
        try {
            this.updatePlayer();
            this.updateEnemies();
        } catch (err) {
            const ctx = this.ctx;
            ctx.fillStyle = "#000"; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = "#f00"; ctx.font = "16px monospace";
            ctx.fillText("ERROR: " + err.message, 20, 40);
            console.error(err);
        }
    }
}