export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");
    }

    preload(){
        this.load.image('Asset 1', 'img/map/1x/Asset 1.png');
        this.load.image('Asset 2', 'img/map/1x/Asset 2.png');
        this.load.image('Asset 3', 'img/map/1x/Asset 3.png');
        this.load.image('Asset 4', 'img/map/1x/Asset 4.png');
        this.load.image('Asset 5', 'img/map/1x/Asset 5.png');
        this.load.image('Asset 6', 'img/map/1x/Asset 6.png');
        this.load.image('Asset 7', 'img/map/1x/Asset 7.png');
        this.load.image('Asset 8', 'img/map/1x/Asset 8.png');
        this.load.image('Asset 9', 'img/map/1x/Asset 9.png');
        this.load.image('Asset 10', 'img/map/1x/Asset 10.png');
        this.load.image('Asset 11', 'img/map/1x/Asset 11.png');
        this.load.image('Asset 13', 'img/map/1x/Asset 13.png');
        this.load.image('Asset 14', 'img/map/1x/Asset 14.png');
        this.load.image('Asset 15', 'img/map/1x/Asset 15.png');
        this.load.image('Asset 16', 'img/map/1x/Asset 16.png');
        this.load.image('Asset 17', 'img/map/1x/Asset 17.png');
        this.load.image('Asset 18', 'img/Statue/Statue4.png');
        this.load.image('Asset 19', 'img/Statue/Asset 19.png');
        this.load.image('Asset 20', 'img/Statue/Asset 20.png');
        this.load.image('Asset 21', 'img/Statue/Asset 21.png');
        this.load.image('Asset 22', 'img/Statue/Asset 22.png');
        this.load.image('Asset 23', 'img/Statue/Asset 23.png');
        this.load.image('Asset 24', 'img/Statue/Asset 24.png');
        this.load.image('Asset 25', 'img/Statue/Asset 25.png');
        this.load.image('Asset 26', 'img/Statue/Asset 26.png');
        this.load.image('Asset 27', 'img/Statue/Asset 27.png');
        this.load.image('Asset 28', 'img/Statue/Asset 28.png');
        this.load.image('Asset 29', 'img/Statue/Asset 29.png');
        this.load.image('Asset 30', 'img/Statue/Asset 30.png');
        this.load.image('Asset 31', 'img/Statue/Asset 31.png');
        this.load.image('Asset 32', 'img/Statue/Asset 32.png');
        this.load.image('Asset 33', 'img/Statue/Asset 33.png');
        this.load.image('Asset 34', 'img/Statue/Asset 34.png');
        this.load.image('Asset 35', 'img/Statue/Asset 35.png');
        this.load.image('Asset 36', 'img/Statue/Asset 36.png');
        this.load.image('Asset 37', 'img/Statue/Asset 37.png');
        this.load.image('Asset 40', 'img/Statue/Asset 40.png');
        this.load.image('Asset 41', 'img/Statue/Asset 41.png');
        this.load.image('Asset 42', 'img/Statue/Asset 42.png');
        this.load.image('Asset 43', 'img/Statue/Asset 43.png');
        this.load.image('Asset 46', 'img/Statue/Asset 46.png');
        this.load.image('Asset 47', 'img/Statue/Asset 47.png');
        this.load.image('book1', 'img/book/book1.png');
        this.load.image('book2', 'img/book/book2.png');
        this.load.image('book3', 'img/book/book3.png');
        this.load.image('book4', 'img/book/book4.png');
        this.load.image('stone', 'img/map/wall.png');
        
        // โหลด Tileset
        this.load.tilemapTiledJSON('map', 'img/untitled.tmj');
        this.load.image('tiles', 'img/Statue/mainlevbuild.png');
        this.load.image('mainlevbuild', 'img/Statue/mainlevbuild.png');
        this.load.spritesheet('player', 'img/AnimationSheet_Character.png', { frameWidth: 32, frameHeight: 32 });

        // โหลดเสียงและ Data
        this.load.audio('bgm', 'audio/cusi_sound-sci-fi-synth-3-233553.mp3');         
        this.load.audio('keySound', 'audio/humordome-fairy-sparkle-long-451416.mp3');    
        this.load.audio('winSound', 'audio/pw23check-winning-218995.mp3');    
        this.load.spritesheet('orc', 'scene/img/sprites/Orc.png', { 
            frameWidth: 100, 
            frameHeight: 100 
        });
        
        // ✅ โหลดไฟล์ JSON ที่ใช้เก็บ Data เกม
        this.load.json('gameData', 'data/gameData.json');
    }
    
    create(){
        console.log("GameplayScene Loaded");

        // --- ตัวแปรเกมเพลย์ ---
        this.books = [];
        this.statueGroups = [];
        this.questStates = [];
        this.rewardIcons = [];
        this.fireObjects = [];
        this.exitDoorParts = [];
        
        this.extinguishedFireCount = 0;
        this.fireQuestCompleted = false;
        this.fireQuestRewardClaimed = false;
        this.chestOpened = false;
        this.exitDoorOpened = false;
        
        this.fullKeyIcon = null;
        this.chestRewardIcon = null;
        this.npcDialogueState = 'idle';
        this.npcQuestStage = 'statue';
        this.lastDamageTime = 0;

        // ✅ ดึงข้อมูลระดับจาก JSON (แยกลอจิกกับข้อมูล)
        const levelData = this.cache.json.get('gameData').level1;

        // ==========================================
        // 🎵 เปิดเพลงพื้นหลัง 
        // ==========================================
        this.bgm = this.sound.add('bgm', { volume: 1.0, loop: true });
        this.bgm.play();

        // ==========================================
        // 🌍 1. สร้างระบบ TILEMAP
        // ==========================================
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('mainlevbuild', 'mainlevbuild');

        const backgroundLayer = map.createLayer('floor', tileset, 0, 0).setDepth(-10);
        this.wallsLayer = map.createLayer('wall', tileset, 0, 0).setDepth(-9);
        this.wallsLayer.setCollisionByExclusion([-1]);

        // ==========================================
        // 🗿 2. สร้างวัตถุต่างๆ โดยใช้ข้อมูลจาก JSON
        // ==========================================
        
        // รูปปั้น (Statues)
        this.statueGroups = levelData.statueGroups.map((group, groupIndex) => {
            const sprites = group.keys.map((key, index) => {
                const statue = this.add.image(group.x, group.y, key).setScale(0.2).setDepth(-4);
                statue.setData('kind', 'statue');
                statue.setData('groupIndex', groupIndex);
                statue.setData('index', index);
                statue.setData('correctIndex', group.correctIndex);
                statue.setData('solved', false);
                statue.setVisible(index === 0);
                return statue;
            });
            return sprites;
        });
        this.questStates = levelData.statueGroups.map(() => ({ solved: false, rewarded: false }));

        // ตัวละคร NPC
        this.npc = this.add.image(levelData.npc.x, levelData.npc.y, levelData.npc.key).setScale(levelData.npc.scale).setDepth(10);
        this.npc.setData('kind', 'npc');
        this.npc.setData('range', levelData.npc.range);

        // กล่องสมบัติ (Chest)
        this.chest = this.add.image(levelData.chest.x, levelData.chest.y, levelData.chest.keyClosed).setScale(levelData.chest.scale).setDepth(-4);
        this.chest.setData('kind', 'chest');
        this.chest.setData('range', levelData.chest.range);
        this.chest.setData('keyOpen', levelData.chest.keyOpen); 
        this.add.image(levelData.chest.x, levelData.chest.y, levelData.chest.keyOpen).setScale(levelData.chest.scale).setDepth(-4).setVisible(false);

        // หนังสือ (Books)
        this.books = levelData.books.map(def => {
            const book = this.add.image(def.x, def.y, def.key).setScale(def.scale).setDepth(-4);
            book.setData('kind', 'book'); 
            book.setData('message', def.message);
            book.setData('range', def.range);
            return book;
        });

        // ประตูทางออก (Door)
        this.exitDoorParts = [
            this.add.image(levelData.door.x, levelData.door.y, levelData.door.keyClosed)
                .setScale(levelData.door.scaleX, levelData.door.scaleY)
                .setDepth(16)
        ];
        
        this.exitDoorParts.forEach((doorPart) => {
            doorPart.setData('kind', 'door');
            doorPart.setData('range', levelData.door.range);
            doorPart.setData('opened', false);
            doorPart.setData('keyOpen', levelData.door.keyOpen); 
        });
        
        // คบเพลิง (Fires)
        this.fireObjects = levelData.fires.map(def => {
            const flame = this.add.image(def.x, def.y, def.key).setScale(def.scale).setDepth(12);
            flame.setData('kind', 'fire');
            flame.setData('range', def.range);
            flame.setData('extinguished', false);
            flame.setTint(0xffbb33);
            return flame;
        });

        // ==========================================
        // 🧍‍♂️ 3. สร้าง Player และระบบฟิสิกส์
        // ==========================================
        this.player = this.physics.add.sprite(levelData.player.startX, levelData.player.startY, 'player', 0).setScale(levelData.player.scale).setDepth(10);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        this.player.body.allowGravity = false;
        this.physics.add.collider(this.player, this.wallsLayer);

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
            frameRate: 8,
            repeat: -1
        });

        // ✅ เรียกใช้งานศัตรู
        this.initEnemy(levelData);
        
        // ==========================================
        // 💬 4. UI และระบบจับเวลา
        // ==========================================
        this.alertText = this.add.text(600, 337, '', {
            font: '22px Arial', fill: '#ff4444', backgroundColor: '#000000', padding: { x: 15, y: 10 }, align: 'center'
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        this.interactText = this.add.text(0, 0, 'กด E เพื่ออ่าน', {
            fontSize: '12px', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(30).setVisible(false);

        this.dialogText = this.add.text(this.player.x, this.player.y - 60, '', {
            fontSize: '14px', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 6, y: 4 }, wordWrap: { width: 200 }
        }).setOrigin(0.5).setDepth(30).setVisible(false);

        // ดึงเวลาจาก JSON ถ้าไม่มีให้ใช้ 60
        this.timeLeft = levelData.timeLimit || 60;
        
        this.timerText = this.add.text(20, 20, 'เวลา: 01:00', {
            font: '20px Arial', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 12, y: 8 }
        }).setScrollFactor(0).setDepth(100);

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.exitDoorOpened) {
                    this.timerEvent.remove();
                    return;
                }

                this.timeLeft -= 1;
                const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
                const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
                this.timerText.setText(`เวลา: ${minutes}:${seconds}`);

                if (this.timeLeft <= 0) {
                    this.timerEvent.remove();
                    this.scene.start('LoseScene');
                }
            },
            loop: true
        });
        
        // ==========================================
        // 🎮 5. ระบบปุ่มควบคุม (Inputs)
        // ==========================================
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // ปุ่ม Pause
        let pauseButton = this.add.text(700, 50, "||", {
            fontSize: "30px", color: "#ff0000", backgroundColor: "#333333", padding: { x: 15, y: 10 }
        });

        pauseButton.setInteractive();
        pauseButton.on("pointerdown", () => {
            console.log("Pause");
            this.scene.pause();
            this.scene.launch("PauseScene");
        });
    }    

    // ==========================================
    // 👹 ฟังก์ชันสร้างศัตรู
    // ==========================================
    initEnemy(levelData) {
        this.enemiesGroup = this.physics.add.group();

        // สร้างแอนิเมชันแค่ครั้งเดียว
        if (!this.anims.exists('orc_idle')) {
            this.anims.create({ key: 'orc_idle', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'orc_walk', frames: this.anims.generateFrameNumbers('orc', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
            this.anims.create({ key: 'orc_attack', frames: this.anims.generateFrameNumbers('orc', { start: 16, end: 21 }), frameRate: 12, repeat: -1 });
        }

        // วนลูปอ่านค่าจาก enemies
        if (levelData.enemies) {
            levelData.enemies.forEach(data => {
                let enemy = this.physics.add.sprite(data.spawnX, data.spawnY, 'orc', 0).setScale(2);
                
                // ดึงค่า Hitbox จาก JSON
                enemy.body.setSize(data.hitbox.hRadius, data.hitbox.vRadius); 
                enemy.body.setOffset(42, 45); 
                enemy.setCollideWorldBounds(true);
                
                // ฝังค่าต่างๆ ไว้ในตัวศัตรูแต่ละตัว
                enemy.setData('speed', data.speed);
                enemy.setData('detectRadius', data.detectRadius);
                
                enemy.play('orc_idle', true);
                this.enemiesGroup.add(enemy); 
            });
        }

        // เปิดระบบฟิสิกส์การชน
        this.physics.add.collider(this.enemiesGroup, this.wallsLayer); 
        this.physics.add.collider(this.player, this.enemiesGroup);     
        this.physics.add.collider(this.enemiesGroup, this.enemiesGroup); // ให้ออร์คชนกันเอง
    }
    
    update(){
        if (this.exitDoorOpened) {
            this.player.setVelocity(0, 0);
            return;
        }

        const baseSpeed = 160;
        const runSpeed = 250;
        const shiftPressed = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown;
        const speed = shiftPressed ? runSpeed : baseSpeed;

        const left = this.cursors.left.isDown || this.keys.left.isDown;
        const right = this.cursors.right.isDown || this.keys.right.isDown;
        const up = this.cursors.up.isDown || this.keys.up.isDown;
        const down = this.cursors.down.isDown || this.keys.down.isDown;

        let vx = 0;
        let vy = 0;

        if (left) vx = -speed;
        if (right) vx = speed;
        if (up) vy = -speed;
        if (down) vy = speed;
        
        this.player.setVelocity(vx, vy);

        if (vx < 0) {
            this.player.flipX = true;
        } else if (vx > 0) {
            this.player.flipX = false;
        }

        if (vx !== 0 || vy !== 0) {
            this.player.play('walk', true);
        } else {
            this.player.play('idle', true);
        }

        // ==========================================
        // 🧠 ระบบ AI ศัตรู (เดินตามผู้เล่น)
        // ==========================================
        if (this.enemiesGroup) {
            this.enemiesGroup.getChildren().forEach(enemy => {
                
                if (enemy.active) {
                    const distanceToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    
                    // ดึงค่ามาจาก JSON ที่ฝังไว้
                    const detectionRange = enemy.getData('detectRadius') || 200; 
                    const enemySpeed = enemy.getData('speed') || 90;
                    const attackRange = 55;     

                    if (distanceToPlayer < detectionRange) {
                        
                        if (distanceToPlayer <= attackRange) {
                            // โจมตี
                            enemy.setVelocity(0, 0);
                            enemy.play('orc_attack', true);

                            if (this.player.x < enemy.x) {
                                enemy.flipX = true; 
                            } else {
                                enemy.flipX = false; 
                            }

                            // ==========================================
                            // 🩸 ระบบโดนโจมตีแล้วเวลาลด
                            // ==========================================
                            // เช็คว่าเวลาปัจจุบัน มากกว่าเวลาที่โดนตีครั้งล่าสุด + 1000 มิลลิวินาที (1 วินาที) หรือยัง
                            // เพื่อกั้นไม่ให้เลือดลดรัวเกินไป (โดนตีได้สูงสุดวิละ 1 ครั้ง)
                            if (this.time.now > this.lastDamageTime) {
                                
                                this.timeLeft -= 2; // ลดเวลาลง 2 วินาที
                                if (this.timeLeft < 0) this.timeLeft = 0; // ป้องกันเวลาติดลบ

                                // อัปเดตข้อความเวลาบนหน้าจอทันที
                                const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
                                const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
                                this.timerText.setText(`เวลา: ${minutes}:${seconds}`);

                                // ทำให้ตัวผู้เล่นกะพริบเป็นสีแดง 0.2 วินาที เพื่อให้รู้ว่าโดนฟัน
                                this.player.setTint(0xff0000);
                                this.time.delayedCall(200, () => {
                                    this.player.clearTint();
                                });

                                // บันทึกเวลาที่โดนตีครั้งล่าสุดเอาไว้บวกไปอีก 1000ms (1 วินาที)
                                this.lastDamageTime = this.time.now + 1000;
                            }
                            // ==========================================

                        } 
                        else {
                            // วิ่งตาม
                            this.physics.moveToObject(enemy, this.player, speed);}}}
            });
        }
        // ==========================================

        this.nearbyTarget = null;
        this.nearestDistance = Infinity;
        const interactables = [...this.books, ...this.statueGroups.flat(), ...this.fireObjects, this.npc, this.chest, ...this.exitDoorParts];
        
        for (const target of interactables) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
            const range = target.getData('range') ?? 70;
            if (distance < range && distance < this.nearestDistance) {
                this.nearestDistance = distance;
                this.nearbyTarget = target;
            }
        }

        if (this.nearbyTarget) {
            if (this.nearbyTarget.getData('kind') === 'fire') {
                const flame = this.nearbyTarget;
                if (this.npcQuestStage !== 'fire') {
                    this.interactText.setText('ต้องทำเควสรูปปั้นและรับกุญแจก่อน');
                    this.interactText.setVisible(true);
                    this.interactText.setPosition(flame.x, flame.y - 35);
                } else {
                    const promptText = flame.getData('extinguished') ? 'ดับแล้ว' : 'กด E เพื่อดับคบเพลิง';
                    this.interactText.setText(promptText);
                    this.interactText.setVisible(true);
                    this.interactText.setPosition(flame.x, flame.y - 35);

                    if (Phaser.Input.Keyboard.JustDown(this.keyE) && !flame.getData('extinguished')) {
                        flame.setData('extinguished', true);
                        flame.setTint(0x3a2a1a);
                        flame.setAlpha(0.7);
                        this.extinguishedFireCount += 1;
                        this.dialogText.setText(`ดับคบเพลิงแล้ว ${this.extinguishedFireCount}/5`);
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                        this.time.delayedCall(1000, () => {
                            this.dialogText.setVisible(false);
                        });

                        if (this.extinguishedFireCount >= 5 && !this.fireQuestCompleted) {
                            this.fireQuestCompleted = true;
                            this.dialogText.setText('ดับคบเพลิงครบ 5 อันแล้ว');
                            this.dialogText.setPosition(this.player.x, this.player.y - 60);
                            this.dialogText.setVisible(true);
                            this.time.delayedCall(1200, () => {
                                this.dialogText.setVisible(false);
                            });
                        }
                    }
                }
            } else if (this.nearbyTarget.getData('kind') === 'chest') {
                if (!this.chestOpened) {
                    this.interactText.setText(this.fullKeyIcon ? 'กด E เพื่อเปิดกล่อง' : 'ต้องมีกุญแจแบบเต็มก่อน');
                    this.interactText.setVisible(true);
                    this.interactText.setPosition(this.chest.x, this.chest.y - 35);

                    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.fullKeyIcon) {
                        this.chestOpened = true;
                        
                        this.chest.setTexture(this.chest.getData('keyOpen'));
                        this.chest.setScale(0.1);
                        
                        this.dialogText.setText('เปิดกล่องแล้ว');
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                        if (this.fullKeyIcon) {
                            this.fullKeyIcon.destroy();
                            this.fullKeyIcon = null;
                        }
                        if (!this.chestRewardIcon) {
                            this.chestRewardIcon = this.add.image(760, 70, 'Asset 43').setScale(0.12).setDepth(40).setScrollFactor(0);
                        }
                        this.time.delayedCall(1200, () => {
                            this.dialogText.setVisible(false);
                        });
                    }
                }
            } else if (this.nearbyTarget.getData('kind') === 'door') {
                const canOpenDoor = this.chestOpened;
                this.interactText.setText(this.exitDoorOpened ? 'ประตูเปิดแล้ว' : canOpenDoor ? 'กด E เพื่อเปิดประตู' : 'ต้องเปิดกล่องรับกุญแจก่อน');
                this.interactText.setVisible(true);
                this.interactText.setPosition(this.nearbyTarget.x, this.nearbyTarget.y - 45);

                if (Phaser.Input.Keyboard.JustDown(this.keyE) && canOpenDoor && !this.exitDoorOpened) {
                    this.exitDoorOpened = true;
                    
                    this.sound.play('winSound', { volume: 1.0 });
                    this.player.setVelocity(0, 0);

                    this.exitDoorParts.forEach((doorPart) => {
                        const previousX = doorPart.x;
                        const previousY = doorPart.y;
                        const previousOriginX = doorPart.originX;
                        const previousOriginY = doorPart.originY;

                        doorPart.setTexture(doorPart.getData('keyOpen'));
                        doorPart.setPosition(previousX, previousY);
                        doorPart.setOrigin(previousOriginX, previousOriginY);
                        doorPart.setScale(0.35, 0.3);
                    });

                    this.scene.pause();
                    this.scene.launch("VictoryScene");
                    this.dialogText.setText('คุณชนะแล้ว! หลบหนีสำเร็จ');
                    this.dialogText.setPosition(this.player.x, this.player.y - 60);
                    this.dialogText.setVisible(true);
                }
            } else if (this.nearbyTarget.getData('kind') === 'statue') {
                const groupIndex = this.nearbyTarget.getData('groupIndex');
                const groupState = this.questStates[groupIndex];
                const group = this.statueGroups[groupIndex];
                const currentIndex = group.findIndex(statue => statue.visible);
                const promptText = groupState.solved ? 'เควสนี้เสร็จแล้ว' : 'กด E เพื่อสลับรูปปั้น';
                this.interactText.setText(promptText);
                this.interactText.setVisible(true);
                this.interactText.setPosition(this.nearbyTarget.x, this.nearbyTarget.y - 35);

                if (Phaser.Input.Keyboard.JustDown(this.keyE) && !groupState.solved) {
                    const nextIndex = (currentIndex + 1) % group.length;
                    group.forEach((statue, index) => {
                        const shouldShow = index === nextIndex;
                        statue.setVisible(shouldShow);
                        statue.setData('index', index);
                    });

                    if (nextIndex === this.nearbyTarget.getData('correctIndex')) {
                        groupState.solved = true;
                        this.nearbyTarget.setData('solved', true);
                        this.dialogText.setText('เควสนี้สำเร็จแล้ว');
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                        this.time.delayedCall(1200, () => {
                            this.dialogText.setVisible(false);
                        });
                    }
                }
            } else if (this.nearbyTarget.getData('kind') === 'npc') {
                this.interactText.setText(this.npcDialogueState === 'idle' ? 'กด E เพื่อคุย' : 'กด Eต่อ / Q เพื่อยกเลิก');
                this.interactText.setVisible(true);
                this.interactText.setPosition(this.npc.x, this.npc.y - 55);

                const justPressedE = Phaser.Input.Keyboard.JustDown(this.keyE);
                const justPressedQ = Phaser.Input.Keyboard.JustDown(this.keyQ);

                if (this.npcDialogueState === 'idle') {
                    if (justPressedE) {
                        if (this.npcQuestStage === 'statue') {
                            this.npcDialogueState = 'greeting';
                            this.dialogText.setText('สวัสดี มีไรให้เราช่วยไหม');
                        } else if (this.npcQuestStage === 'fire' && !this.fireQuestCompleted) {
                            this.dialogText.setText('ดับคบเพลิง 5 อันให้ครบก่อน');
                        } else if (this.npcQuestStage === 'fire' && this.fireQuestCompleted && !this.fireQuestRewardClaimed) {
                            const rewardIcon = this.add.image(760, 40 + this.rewardIcons.length * 28, 'Asset 36')
                                .setScale(0.12)
                                .setDepth(40)
                                .setScrollFactor(0);
                            this.rewardIcons.push(rewardIcon);
                            const mergedIcon = this.playRewardMergeAnimation(this, this.rewardIcons);
                            this.rewardIcons.length = 0;
                            this.rewardIcons.push(mergedIcon);
                            this.fullKeyIcon = mergedIcon;
                            this.fireQuestRewardClaimed = true;
                            this.dialogText.setText('รับกุญแจอีกครึ่งแล้ว');
                        } else {
                            this.dialogText.setText('รับกุญแจครบแล้ว');
                        }
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                    }
                } else if (this.npcDialogueState === 'greeting') {
                    if (justPressedE) {
                        this.npcDialogueState = 'choice1';
                        this.dialogText.setText('ฉันอยากถามเรื่องจะออกไปยัง\nE = ฉันอยากถามเรื่องจะออกไปยัง\nQ = ไม่มี');
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                    } else if (justPressedQ) {
                        this.npcDialogueState = 'idle';
                        this.dialogText.setVisible(false);
                    }
                } else if (this.npcDialogueState === 'choice1') {
                    if (justPressedE) {
                        this.npcDialogueState = 'choice2';
                        this.dialogText.setText('คุณจะออกไปได้คุณต้องช่วยฉันหน่อย\nE = ช่วยอะไร\nQ = ไม่ช่วย');
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                    } else if (justPressedQ) {
                        this.npcDialogueState = 'idle';
                        this.dialogText.setVisible(false);
                    }
                } else if (this.npcDialogueState === 'choice2') {
                    if (justPressedE) {
                        this.npcDialogueState = 'choice3';
                        this.dialogText.setText('ช่วยทำรูปปั้นให้ตรงตามที่หนังสือบอกได้ไหมลุงแก่แล้ว\nE = ได้\nQ = ไม่');
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                    } else if (justPressedQ) {
                        this.npcDialogueState = 'idle';
                        this.dialogText.setVisible(false);
                    }
                } else if (this.npcDialogueState === 'choice3') {
                    if (justPressedE) {
                        const allStatueQuestsSolved = this.questStates.every(state => state.solved);
                        const firstUnrewardedIndex = this.questStates.findIndex(state => !state.rewarded);

                        if (!allStatueQuestsSolved) {
                            this.dialogText.setText('ต้องทำเควสรูปปั้นให้ครบทุกอันก่อน');
                        } else if (firstUnrewardedIndex === -1) {
                            this.dialogText.setText('รับกุญแจแล้ว');
                        } else {
                            const rewardKey = 'Asset 35';
                            const rewardIcon = this.add.image(760, 40 + this.rewardIcons.length * 28, rewardKey)
                                .setScale(0.12)
                                .setDepth(40)
                                .setScrollFactor(0);
                            this.rewardIcons.push(rewardIcon);
                            this.questStates[firstUnrewardedIndex].rewarded = true;
                            this.npcQuestStage = 'fire';
                            
                            this.sound.play('keySound', { volume: 1.0 });

                            this.dialogText.setText('รับกุญแจครึ่งหนึ่งแล้ว ตอนนี้เควสรูปปั้นจบแล้ว');
                        }
                        this.dialogText.setPosition(this.player.x, this.player.y - 60);
                        this.dialogText.setVisible(true);
                        this.npcDialogueState = 'done';
                        this.time.delayedCall(1200, () => {
                            this.npcDialogueState = 'idle';
                            this.dialogText.setVisible(false);
                            this.interactText.setText('กด E เพื่อคุย');
                        });
                    } else if (justPressedQ) {
                        this.npcDialogueState = 'idle';
                        this.dialogText.setVisible(false);
                    }
                }
            } else if (this.nearbyTarget.getData('kind') === 'book') {
                this.interactText.setText('กด E เพื่ออ่าน');
                this.interactText.setVisible(true);
                this.interactText.setPosition(this.nearbyTarget.x, this.nearbyTarget.y - 35);

                if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                    this.dialogText.setText(this.nearbyTarget.getData('message'));
                    this.dialogText.setPosition(this.player.x, this.player.y - 60);
                    this.dialogText.setVisible(true);
                    this.time.delayedCall(5000, () => {
                        this.dialogText.setVisible(false);
                    });
                }
            }
        } else {
            this.interactText.setVisible(false);
        }

        if (this.dialogText.visible) {
            this.dialogText.setPosition(this.player.x, this.player.y - 60);
        }
        
    }
    
    playRewardMergeAnimation(scene, iconsToReplace) {
        const centerX = 400;
        const centerY = 300;
        const merged = scene.add.image(centerX, centerY, 'Asset 40').setScale(0.01).setDepth(45).setScrollFactor(0);

        scene.sound.play('keySound', { volume: 1.0 });

        iconsToReplace.forEach((icon, index) => {
            const targetX = centerX + (index === 0 ? -45 : 45);
            const targetY = centerY;
            scene.tweens.add({
                targets: icon,
                x: targetX,
                y: targetY,
                scale: 0.08,
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    icon.destroy();
                    if (index === iconsToReplace.length - 1) {
                        scene.tweens.add({
                            targets: merged,
                            scale: 0.18,
                            duration: 450,
                            ease: 'Back.easeOut',
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: merged,
                                    x: 730,
                                    y: 50,
                                    scale: 0.12,
                                    duration: 700,
                                    ease: 'Power2'
                                });
                            }
                        });
                    }
                }
            });
        });

        return merged;
    }
}