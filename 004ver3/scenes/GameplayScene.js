export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameplayScene' });
    }

    preload() {
        // === โหลด Tilemap และ Asset ===
        this.load.tilemapTiledJSON('map', 'asset/map.tmj'); 
        this.load.image('dungeon_tiles', 'asset/Dungeon Tile Set.png');

        // === โหลด Asset รูปภาพ ===
        this.load.image('book', 'asset/book.png'); 
        this.load.image('statue', 'asset/rubpun.png');
        this.load.image('torch', 'asset/kobfire.png');
        this.load.image('heep', 'asset/heep.png');        
        this.load.image('heepopen', 'asset/heepopen.png'); 
        this.load.image('npc', 'asset/npc.png');          
        this.load.image('door', 'asset/door.png');        
        this.load.image('opendoor', 'asset/open door.png'); 
        this.load.image('pause_btn', 'asset/pausebutton.png'); 

        // โหลด JSON ข้อมูลเกม
        this.load.json('gamedata', 'data/gamedata.json');

        // โหลด Spritesheet ตัวละครหลัก
        this.load.spritesheet('player', 'asset/AnimationSheet_Character.png', {
            frameWidth: 32,
            frameHeight: 32 
        });

        // โหลด Spritesheet ของ Orc
        this.load.spritesheet('orc', 'asset/orc.png', {
            frameWidth: 100,
            frameHeight: 100
        });

        // === โหลดไฟล์เสียง ===
        this.load.audio('bgm', 'asset/game sound.mp3');
        this.load.audio('correct', 'asset/correct_answer.mp3');
        this.load.audio('win', 'asset/winning.mp3');
    }

    create() {
        // --- โหลด Data จาก JSON ---
        this.gameData = this.cache.json.get('gamedata');
        
        if (!this.gameData) {
            console.error("ไม่พบข้อมูล JSON!");
            return;
        }

        // --- ตัวแปรสถานะเกม ---
        this.isGameOver = false;
        this.isBookSolved = false;
        this.isStatueSolved = false;
        this.isTorchSolved = false; 

        // --- ตัวแปรห้องขวาล่าง ---
        this.openedChestsCount = 0; 
        this.isDoorOpened = false;

        // --- ตัวแปรระบบ Cutscene ---
        this.isCutsceneActive = false;
        this.cutsceneStep = 0; 
        this.targetX = 0;
        this.targetY = 0;

        // --- ตัวแปรนับจำนวนคุยกับ NPC ---
        this.npcClickCount = 0; 

        // --- ตัวแปรแสดงข้อความ ---
        this.dialogueTimer = null;
        this.isShowingImportantMessage = false; 

        // === 1. เล่นเพลง BGM วนลูป ===
        this.bgMusic = this.sound.add('bgm', { volume: 0.3, loop: true });
        this.bgMusic.play();

        this.correctSound = this.sound.add('correct', { volume: 0.7 });
        this.winSound = this.sound.add('win', { volume: 0.8 });

        // === 2. สร้าง Tilemap ===
        this.map = this.make.tilemap({ key: 'map' });
        const tileset = this.map.addTilesetImage('Dungeon Tile Set', 'dungeon_tiles');

        // คำนวณ Scale ของแมพให้พอดีหน้าจอ 1280x720
        const scaleX = 1280 / this.map.widthInPixels;
        const scaleY = 720 / this.map.heightInPixels;

        this.bgLayer = this.map.createLayer('Floor layer', tileset, 0, 0); 
        if (this.bgLayer) this.bgLayer.setScale(scaleX, scaleY);

        this.wallLayer = this.map.createLayer('Wall layer', tileset, 0, 0); 
        if (this.wallLayer) {
            this.wallLayer.setScale(scaleX, scaleY);
            this.wallLayer.setCollisionByProperty({ collides: true });
            if (!this.wallLayer.collides) {
                this.wallLayer.setCollisionByExclusion([-1]);
            }
        }

        // ตั้งค่าขอบเขตของโลกฟิสิกส์ให้ครอบคลุมหน้าจอ
        this.physics.world.setBounds(0, 0, 1280, 720);

        // === 3. ประตูกั้นทางผ่าน (ข้อมูลจาก JSON) ===
        const gates = this.gameData.gates;
        this.statueGate = this.physics.add.staticSprite(gates.statue.x, gates.statue.y, null).setSize(gates.statue.width, gates.statue.height).setVisible(false);
        this.torchGate  = this.physics.add.staticSprite(gates.torch.x, gates.torch.y, null).setSize(gates.torch.width, gates.torch.height).setVisible(false);
        this.bossGate   = this.physics.add.staticSprite(gates.boss.x, gates.boss.y, null).setSize(gates.boss.width, gates.boss.height).setVisible(false);

        // === 4. สิ่งของในเกม ===
        
        // 4.1 ห้องซ้ายบน: สมุด
        this.books = this.physics.add.group();
        this.gameData.books.forEach(data => {
            let b = this.books.create(data.x, data.y, 'book');
            b.setDisplaySize(50, 50);
            b.setData('popupText', data.text);
            b.setData('isCorrect', data.isCorrect);
        });

        // 4.2 ห้องขวาบน: รูปปั้น
        this.statues = this.physics.add.group();
        this.gameData.statues.forEach((pos, index) => {
            let s = this.statues.create(pos.x, pos.y, 'statue');
            s.setDisplaySize(45, 65);
            s.setInteractive(); 
            s.setData('targetAngle', pos.targetAngle);
            s.setData('currentAngle', 0); 
            s.body.setSize(45, 65);

            s.on('pointerdown', () => {
                if (this.isCutsceneActive || this.isGameOver) return; 
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
                if (distance > 80) return; 

                if (!this.isBookSolved) {
                    this.showDialogue(this.gameData.messages.statueLocked);
                    return;
                }
                if (this.isStatueSolved) return; 

                let nextAngle = (s.getData('currentAngle') + 90) % 360;
                s.setData('currentAngle', nextAngle);
                s.setAngle(nextAngle); 

                this.showDialogue(`รูปปั้นที่ ${index + 1} ถูกหมุนไปที่ ${nextAngle} องศา`);
                this.checkStatuePuzzle();
            });
        });

        // 4.3 ห้องซ้ายล่าง: คบเพลิง
        this.torches = this.physics.add.group();
        this.gameData.torches.forEach((pos, index) => {
            let t = this.torches.create(pos.x, pos.y, 'torch');
            t.setDisplaySize(30, 58);
            t.setInteractive();
            t.setData('lit', true); 
            t.body.setSize(30, 58);

            t.on('pointerdown', () => {
                if (this.isCutsceneActive || this.isGameOver) return;
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
                if (distance > 100) return; 

                if (!this.isStatueSolved) {
                    this.showTimedDialogue(this.gameData.messages.torchLocked, 2000);
                    return;
                }
                if (this.isTorchSolved) return; 

                let isLit = !t.getData('lit');
                t.setData('lit', isLit);

                let remainingLit = 0;
                this.torches.children.iterate(torch => {
                    if (torch && torch.getData('lit')) remainingLit++;
                });

                if (isLit) {
                    t.setAlpha(1.0); 
                    this.showTimedDialogue(`คุณจุดไฟคบเพลิงอันที่ ${index + 1} (เหลือไฟอีก ${remainingLit} ดวง)`, 2000);
                } else {
                    t.setAlpha(0.4); 
                    this.showTimedDialogue(`คุณดับไฟคบเพลิงอันที่ ${index + 1} แล้ว (เหลือไฟอีก ${remainingLit} ดวง)`, 2000);
                }

                this.checkTorchPuzzle(); 
            });
        });

        // 4.4 ห้องขวาล่าง: NPC, หีบสมบัติ และประตูทางออก
        const npcData = this.gameData.npc;
        this.npc = this.physics.add.staticSprite(npcData.x, npcData.y, 'npc'); 
        this.npc.setDisplaySize(45, 75);
        this.npc.setInteractive();
        this.npc.body.setSize(45, 75);

        this.chests = this.physics.add.staticGroup();
        this.gameData.chests.forEach(pos => {
            let c = this.chests.create(pos.x, pos.y, 'heep');
            c.setDisplaySize(60, 50);
            c.setInteractive();
            c.body.setSize(60, 50);
            c.setData('id', pos.id);
            c.setData('opened', false);

            c.on('pointerdown', () => {
                if (this.isCutsceneActive || this.isGameOver) return;
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
                if (distance > 80) return; 

                if (this.openedChestsCount < 3) {
                    this.showDialogue(this.gameData.messages.chestLocked);
                } else {
                    this.showDialogue(this.gameData.messages.chestOpened);
                }
            });
        });

        const exitData = this.gameData.exitDoor;
        this.exitDoor = this.physics.add.staticSprite(exitData.x, exitData.y, 'door');
        this.exitDoor.setDisplaySize(70, 95);
        this.exitDoor.body.setSize(45, 95);

        this.npc.on('pointerdown', () => {
            if (this.isCutsceneActive || this.isGameOver) return;
            let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
            if (distance > 80) return; 

            if (this.openedChestsCount < 3) {
                this.npcClickCount++;

                if (this.npcClickCount === 1) {
                    this.showDialogue(npcData.dialogues[0]);
                } 
                else if (this.npcClickCount === 2) {
                    this.showDialogue(npcData.dialogues[1]);
                } 
                else if (this.npcClickCount === 3) {
                    this.showTimedDialogue(npcData.dialogues[2], 3500);
                    
                    this.isCutsceneActive = true; 
                    this.cutsceneStep = 1; 
                    this.npcClickCount = 0; 
                }
            }
        });

        // === 5. สร้างตัวละครผู้เล่น ===
        const pData = this.gameData.player;
        this.player = this.physics.add.sprite(pData.startX || 240, pData.startY || 180, 'player', 0).setScale(pData.scale || 1.5);
        
        this.player.setBodySize(16, 16); 
        this.player.setOffset(8, 16); 
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10); 

        // === 6. สร้างแอนิเมชัน ===
        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
        }
        if (!this.anims.exists('walk')) {
            this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists('orc_walk')) {
            this.anims.create({ key: 'orc_walk', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        }

        // === 7. สร้างศัตรู ===
        this.initEnemy();

        // === 8. ระบบ Collision และ Overlap ===
        if (this.wallLayer) {
            this.physics.add.collider(this.player, this.wallLayer); 
        }
        this.physics.add.collider(this.player, this.statueGate); 
        this.physics.add.collider(this.player, this.torchGate);  
        this.physics.add.collider(this.player, this.bossGate);   
        this.physics.add.collider(this.player, this.npc);
        this.physics.add.collider(this.player, this.chests); 

        if (this.enemies && this.enemies.getLength() > 0) {
            if (this.wallLayer) {
                this.physics.add.collider(this.enemies, this.wallLayer);
            }
            this.physics.add.overlap(this.player, this.enemies, this.handleEnemyContact, null, this);
        }

        this.exitDoorCollider = this.physics.add.collider(this.player, this.exitDoor);

        // === 9. ปุ่มกดควบคุม ===
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        // === 10. กล่องข้อความ UI ===
        this.popupBg = this.add.graphics();
        this.popupBg.fillStyle(0x000000, 0.8);
        this.popupBg.fillRect(150, 560, 980, 120);
        this.popupBg.lineStyle(4, 0xffffff, 1);
        this.popupBg.strokeRect(150, 560, 980, 120);
        this.popupBg.setDepth(20);
        this.popupBg.setVisible(false);

        this.popupText = this.add.text(180, 590, '', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold',
            wordWrap: { width: 920, useAdvancedWrap: true },
            padding: { top: 4, bottom: 4 }
        });
        this.popupText.setDepth(21);
        this.popupText.setVisible(false);

        // === 11. UI ฉากจบเกม (Victory / Game Over ใช้ตัวแปรนี้ร่วมกันได้) ===
        this.endScreenBg = this.add.graphics();
        this.endScreenBg.fillStyle(0x000000, 0.9); 
        this.endScreenBg.fillRect(0, 0, 1280, 720);
        this.endScreenBg.setVisible(false);
        this.endScreenBg.setDepth(100); 

        this.endScreenText = this.add.text(640, 360, '', {
            fontSize: '32px',
            fill: '#ffd700', 
            align: 'center',
            fontStyle: 'bold',
            wordWrap: { width: 900, useAdvancedWrap: true }
        });
        this.endScreenText.setOrigin(0.5); 
        this.endScreenText.setVisible(false);
        this.endScreenText.setDepth(101);

        // === 12. UI คำใบ้ ===
        this.hintBg = this.add.graphics();
        this.hintBg.fillStyle(0x000000, 0.7);
        this.hintBg.fillRect(20, 20, 480, 65);
        this.hintBg.lineStyle(2, 0xffd700, 1);
        this.hintBg.strokeRect(20, 20, 480, 65);
        this.hintBg.setDepth(20);

        this.hintText = this.add.text(30, 30, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold',
            wordWrap: { width: 460 }
        });
        this.hintText.setDepth(21);

        this.updateHintUI();

        // === 13. ปุ่ม Pause ===
        this.pauseBtn = this.add.image(1230, 45, 'pause_btn').setInteractive({ useHandCursor: true });
        this.pauseBtn.setDisplaySize(50, 50);
        this.pauseBtn.setDepth(50);

        this.pauseBtn.on('pointerdown', () => {
            this.openPauseScene();
        });
    }

    initEnemy() {
        const enemyDataList = this.gameData.enemies;
        if (!enemyDataList || enemyDataList.length === 0) return;

        this.enemies = this.physics.add.group();

        enemyDataList.forEach(data => {
            let enemy = this.physics.add.sprite(data.spawnX, data.spawnY, 'orc', 0);
            
            enemy.setDepth(999); 
            enemy.setScale(3.5); 

            if (enemy.texture) {
                enemy.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }

            enemy.setBodySize(16, 16);
            enemy.setCollideWorldBounds(true);
            
            enemy.setData('speed', data.speed || 60);
            
            if (this.anims.exists('orc_walk')) {
                enemy.play('orc_walk', true);
            }

            this.enemies.add(enemy);
        });
    }

    handleEnemyContact(player, enemy) {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // ลบศัตรูทั้งหมดออกจากหน้าจอ
        if (this.enemies) {
            this.enemies.clear(true, true);
        }
        
        // ซ่อนตัวละครผู้เล่นด้วย (ถ้าต้องการให้หายไปตอน Game Over)
        player.setVisible(false);
        player.setVelocity(0, 0);

        // หยุดเพลงฉากหลัง
        if (this.bgMusic) this.bgMusic.stop();

        // แสดงหน้าจอ Game Over ทันที
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        this.endScreenBg.setVisible(true);

        this.endScreenText.setText('💀 GAME OVER 💀\n\nคุณถูกออร์คกำจัดคาดันเจี้ยน!');
        this.endScreenText.setPosition(640, 280);
        this.endScreenText.setVisible(true);

        const restartBtn = this.add.text(500, 480, '🔄 Play Again', {
            fontSize: '24px',
            fill: '#ff4444',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(102)
        .setInteractive({ useHandCursor: true });

        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#ff4444' }));
        restartBtn.on('pointerdown', () => {
            this.scene.restart(); 
        });

        const menuBtn = this.add.text(780, 480, '🏠 Main Menu', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(102)
        .setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffff00' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#ffffff' }));
        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene'); 
        });
    }

    openPauseScene() {
        if (this.isGameOver) return;
        if (this.bgMusic) this.bgMusic.pause();
        this.scene.pause('GameplayScene'); 
        this.scene.launch('PauseScene');   
    }

    updateHintUI() {
        const hints = this.gameData.hints;
        if (!this.isBookSolved) {
            this.hintText.setText(hints.stage1);
        } else if (!this.isStatueSolved) {
            this.hintText.setText(hints.stage2);
        } else if (!this.isTorchSolved) {
            this.hintText.setText(hints.stage3);
        } else if (this.openedChestsCount < 3) {
            this.hintText.setText(hints.stage4);
        } else {
            this.hintText.setText(hints.escaped);
        }
    }

    update() {
        if (this.isGameOver) return;

        if (Phaser.Input.Keyboard.JustDown(this.keyESC) || Phaser.Input.Keyboard.JustDown(this.keyP)) {
            this.openPauseScene();
            return;
        }

        // --- อัปเดตการเคลื่อนที่ของศัตรู ---
        if (this.enemies) {
            this.enemies.children.iterate(enemy => {
                if (!enemy) return;

                const speed = enemy.getData('speed');

                if (!this.isCutsceneActive) {
                    this.physics.moveToObject(enemy, this.player, speed);
                    
                    if (enemy.body.velocity.x !== 0) {
                        enemy.flipX = (enemy.body.velocity.x < 0);
                    }
                } else {
                    enemy.setVelocity(0, 0);
                }
            });
        }

        const speed = 200;

        // === ระบบ Cutscene ===
        if (this.isCutsceneActive) {
            let chest0 = this.chests.getChildren()[0];
            let chest1 = this.chests.getChildren()[1];
            let chest2 = this.chests.getChildren()[2];

            if (this.cutsceneStep === 1) {
                if (!this.isShowingImportantMessage) {
                    this.cutsceneStep = 2; 
                    this.targetX = chest0.x; 
                    this.targetY = chest0.y - 50; 
                }
                this.player.setVelocity(0, 0);
                this.player.play('idle', true);
            } 
            else if (this.cutsceneStep === 2) {
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetX, this.targetY);

                if (distance > 5) {
                    this.physics.moveTo(this.player, this.targetX, this.targetY, 150);
                    this.player.play('walk', true);
                    this.player.flipX = (this.player.body.velocity.x < 0);
                } else {
                    this.player.setVelocity(0, 0);
                    this.player.play('idle', true);
                    
                    chest0.setTexture('heepopen');
                    this.openedChestsCount = 1;
                    this.showTimedDialogue(this.gameData.messages.chest1Unlocked, 1200);

                    this.cutsceneStep = 3;
                    this.targetX = chest1.x;
                    this.targetY = chest1.y - 50;
                }
            }
            else if (this.cutsceneStep === 3) {
                if (!this.isShowingImportantMessage) {
                    this.cutsceneStep = 4;
                }
            }
            else if (this.cutsceneStep === 4) {
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetX, this.targetY);

                if (distance > 5) {
                    this.physics.moveTo(this.player, this.targetX, this.targetY, 150);
                    this.player.play('walk', true);
                    this.player.flipX = (this.player.body.velocity.x < 0);
                } else {
                    this.player.setVelocity(0, 0);
                    this.player.play('idle', true);

                    chest1.setTexture('heepopen');
                    this.openedChestsCount = 2;
                    this.showTimedDialogue(this.gameData.messages.chest2Unlocked, 1200);

                    this.cutsceneStep = 5;
                    this.targetX = chest2.x;
                    this.targetY = chest2.y - 50;
                }
            }
            else if (this.cutsceneStep === 5) {
                if (!this.isShowingImportantMessage) {
                    this.cutsceneStep = 6;
                }
            }
            else if (this.cutsceneStep === 6) {
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetX, this.targetY);

                if (distance > 5) {
                    this.physics.moveTo(this.player, this.targetX, this.targetY, 150);
                    this.player.play('walk', true);
                    this.player.flipX = (this.player.body.velocity.x < 0);
                } else {
                    this.player.setVelocity(0, 0);
                    this.player.play('idle', true);

                    chest2.setTexture('heepopen');
                    this.openedChestsCount = 3;

                    this.isDoorOpened = true;
                    this.exitDoor.setTexture('opendoor');
                    if (this.exitDoorCollider) {
                        this.exitDoorCollider.destroy(); 
                    }

                    this.showTimedDialogue(this.gameData.messages.chest3Unlocked, 1800);
                    this.updateHintUI();

                    this.cutsceneStep = 7;
                    this.targetX = this.exitDoor.x;
                    this.targetY = this.exitDoor.y;
                }
            }
            else if (this.cutsceneStep === 7) {
                if (!this.isShowingImportantMessage) {
                    this.cutsceneStep = 8;
                }
            }
            else if (this.cutsceneStep === 8) {
                let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetX, this.targetY);

                if (distance > 5) {
                    this.physics.moveTo(this.player, this.targetX, this.targetY, 150);
                    this.player.play('walk', true);
                    this.player.flipX = (this.player.body.velocity.x < 0);

                    if (distance < 50) {
                        this.player.setAlpha(distance / 50);
                    }
                } else {
                    this.player.setVelocity(0, 0);
                    this.player.setVisible(false); 
                    
                    this.hideDialogue();
                    this.showVictoryScreen(); 
                    
                    this.cutsceneStep = 9; 
                }
            }
            else if (this.cutsceneStep === 9) {
                this.player.setVelocity(0, 0);
            }
            return; 
        }

        // --- ระบบควบคุมการเคลื่อนที่ของผู้เล่น ---
        let vx = 0;
        let vy = 0;

        if (this.cursors.right.isDown || this.keyD.isDown) {
            vx = speed;
            this.player.flipX = false;
        } else if (this.cursors.left.isDown || this.keyA.isDown) {
            vx = -speed;
            this.player.flipX = true;
        }

        if (this.cursors.down.isDown || this.keyS.isDown) {
            vy = speed;
        } else if (this.cursors.up.isDown || this.keyW.isDown) {
            vy = -speed;
        }

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.player.setVelocity(vx, vy);

        if (vx !== 0 || vy !== 0) {
            this.player.play('walk', true); 
        } else {
            this.player.play('idle', true); 
        }

        // === ตรวจจับระยะห่างวัตถุเพื่อซ่อนกล่องข้อความ ===
        let isTouchingSomething = false;

        this.physics.overlap(this.player, this.books, (p, book) => {
            isTouchingSomething = true;
            this.readBook(p, book);
        });

        this.physics.overlap(this.player, this.statues, () => { isTouchingSomething = true; });

        this.torches.children.iterate(t => {
            if (t && Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) < 100) {
                isTouchingSomething = true;
            }
        });

        let distToNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
        let distToDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitDoor.x, this.exitDoor.y);
        
        let distToChests = false;
        this.chests.children.iterate(c => {
            if (c && Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 80) {
                distToChests = true;
            }
        });

        if (distToNpc < 80 || distToChests || distToDoor < 80) {
            isTouchingSomething = true;
        }

        if (!isTouchingSomething && this.popupText.visible && !this.isShowingImportantMessage) {
            this.hideDialogue();
        }
    }

    showVictoryScreen() {
        if (this.bgMusic) this.bgMusic.stop();
        this.winSound.play();

        this.endScreenBg.setVisible(true);

        const victoryMsg = this.gameData.messages.victory;

        this.endScreenText.setText(victoryMsg);
        this.endScreenText.setPosition(640, 280); 
        this.endScreenText.setVisible(true);

        const restartBtn = this.add.text(500, 480, '🔄 Play Again', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(102)
        .setInteractive({ useHandCursor: true });

        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#00ff00' }));
        restartBtn.on('pointerdown', () => {
            this.scene.restart(); 
        });

        const menuBtn = this.add.text(780, 480, '🏠 Main Menu', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(102)
        .setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffff00' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#ffffff' }));
        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene'); 
        });
    }

    showDialogue(message) {
        this.popupBg.setVisible(true);
        this.popupText.setText(message);
        this.popupText.setVisible(true);
    }

    showTimedDialogue(message, duration = 3000) {
        this.isShowingImportantMessage = true; 
        this.showDialogue(message);
        
        if (this.dialogueTimer) this.dialogueTimer.destroy();
        
        this.dialogueTimer = this.time.delayedCall(duration, () => {
            this.hideDialogue();
        }, [], this);
    }

    hideDialogue() {
        this.popupBg.setVisible(false);
        this.popupText.setVisible(false);
        this.popupText.setText('');
        this.isShowingImportantMessage = false; 
    }

    readBook(player, book) {
        let msg = book.getData('popupText');

        if (book.getData('isCorrect') && !this.isBookSolved) {
            this.isBookSolved = true;
            this.statueGate.destroy(); 
            
            this.correctSound.play();

            this.showTimedDialogue(msg, 3000); 
            this.updateHintUI();
        } else {
            this.showDialogue(msg);
        }
    }

    checkStatuePuzzle() {
        let correctCount = 0;
        
        this.statues.children.iterate(s => {
            if (s && s.getData('currentAngle') === s.getData('targetAngle')) {
                correctCount++;
            }
        });

        if (correctCount === 4 && !this.isStatueSolved) {
            this.isStatueSolved = true;
            this.torchGate.destroy(); 

            this.correctSound.play();

            this.showTimedDialogue(this.gameData.messages.statueSolved, 3000); 
            this.updateHintUI();
        }
    }

    checkTorchPuzzle() {
        let activeTorches = 0;

        this.torches.children.iterate(t => {
            if (t && t.getData('lit') === true) {
                activeTorches++;
            }
        });

        if (activeTorches === 0 && !this.isTorchSolved) {
            this.isTorchSolved = true;
            this.bossGate.destroy(); 

            this.correctSound.play();

            this.showTimedDialogue(this.gameData.messages.torchSolved, 3000); 
            this.updateHintUI();
        }
    }
}