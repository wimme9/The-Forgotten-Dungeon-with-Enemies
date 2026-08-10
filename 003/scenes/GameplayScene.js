import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");
    }

    init() {
        this.isGameOver = false;
        this.questStage = 0;
        this.hasKey = false;
        this.enemiesGroup = null;
        this.dangerGraphics = null;
    }

    preload() {
        this.load.audio('win', 'win.mp3');
        this.load.audio('gameover', 'gameover.mp3');
        this.load.audio('ston', 'ston.mp3');
        this.load.audio('fale', 'fale.mp3');
        this.load.audio('ture', 'true.mp3');
        this.load.audio('heepopen', 'heepopen.mp3');
        
        this.load.image('book1', 'book1.png');
        this.load.image('book2', 'book2.png');
        this.load.image('book3', 'book3.png');
        this.load.image('book4', 'book4.png');
        this.load.image('book5', 'book5.png');
        this.load.image('fire', 'fire.png');
        this.load.image('ground', 'tile.jpg');
        this.load.image('ston', 'ston.png');
        this.load.image('heepopen', 'heepopen.png');
        this.load.image('heep', 'heep.png');
        this.load.image('npc', 'npc.png');
        this.load.image('door', 'door.png');
        this.load.image('dooropen', 'dooropen.png');
        this.load.image('backg', 'backg.png');

        // ตั้งค่าขนาดเฟรม 100x100
        this.load.spritesheet('orc', 'orc.png', { frameWidth: 100, frameHeight: 100 });

        this.load.image('tiles', 'world_tileset.png');
        this.load.tilemapTiledJSON('map', 'DungeonMap.tmj');
        
        this.load.spritesheet('player', 'sprites/AnimationSheet_Character.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        const scene = this;

        this.map = this.make.tilemap({ key: 'map' });
        const tileset = this.map.addTilesetImage('world_tileset', 'tiles');

        const floorLayer = this.map.createLayer('Floor Layer', tileset, 0, 0);
        this.wallsLayer = this.map.createLayer('Wall Layer', tileset, 0, 0);

        if (this.wallsLayer) {
            this.wallsLayer.setCollisionByExclusion([-1]);
        }

        this.alertText = this.add.text(768, 512, '', {
            font: '22px Arial', fill: '#ff4444', backgroundColor: '#000000', padding: { x: 15, y: 10 }, align: 'center'
        }).setOrigin(0.5).setDepth(100).setVisible(false);
        
        this.input.mouse.disableContextMenu();
        this.isGameOver = false;
        this.questStage = 0;
        this.hasKey = false;

        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.wallGate2 = this.physics.add.staticImage(768, 400, 'ground').setDisplaySize(20, 200).refreshBody();
        this.wallGate2.setTint(0xff0000);
        this.wallGate2.setAlpha(0.4);

        this.wallGate3 = this.physics.add.staticImage(655, 512, 'ground').setDisplaySize(200, 20).refreshBody();
        this.wallGate3.setTint(0xff0000);
        this.wallGate3.setAlpha(0.4);

        this.wallGate4 = this.physics.add.staticImage(768, 600, 'ground').setDisplaySize(20, 200).refreshBody();
        this.wallGate4.setTint(0xff0000);
        this.wallGate4.setAlpha(0.4);

        this.exitDoor = this.physics.add.staticImage(1400, 870, 'door').setScale(0.3).refreshBody();
        this.targetExitZone = this.physics.add.staticImage(1400, 870, 'ground').setDisplaySize(15, 60).refreshBody().setVisible(false);

        this.questText = this.add.text(20, 25, 'เควส: ตามหาหนังสือที่ถูกต้อง', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#00000088', padding: { x: 10, y: 10 } }).setScrollFactor(0).setDepth(100);
        this.hintText = this.add.text(768, 512, '', { fontSize: '24px', fill: '#ff3333', fontWeight: 'bold', backgroundColor: '#000000aa', padding: { x: 15, y: 15 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

        // สร้างอนิเมชันสำหรับ Orc
        this.anims.create({
            key: 'orc-anim',
            frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }), 
            frameRate: 5,
            repeat: -1
        });

        // สร้าง Player ก่อน (ห้องเกิด)
        this.player = this.physics.add.sprite(1020, 320, 'player', 0).setScale(1.6).setCollideWorldBounds(true);

        // สร้าง Enemies จากไฟล์ JSON Config
        this.initEnemies();

        let pauseButton = this.add.text(1450, 40, "||", {
            fontSize: "30px",
            color: "#ff0000",
            backgroundColor: "#333333",
            padding: { x: 15, y: 10 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200)
        .setInteractive();

        pauseButton.on("pointerover", () => pauseButton.setScale(1.1));
        pauseButton.on("pointerout", () => pauseButton.setScale(1));
        pauseButton.on("pointerdown", () => {
            this.scene.pause();
            this.scene.launch("PauseScene");
        });

        let showHint = (msg, isWarning = true) => {
            scene.hintText.setText(msg);
            scene.hintText.setStyle({ fill: isWarning ? '#ff3333' : '#ffff33' });
            scene.hintText.setVisible(true).setAlpha(1);
            scene.tweens.killTweensOf(scene.hintText);
            scene.tweens.add({ targets: scene.hintText, alpha: 0, delay: 2000, duration: 500, onComplete: () => scene.hintText.setVisible(false) });
        };

        this.books = this.physics.add.staticGroup();
        let bookIds = [1, 2, 3, 4, 5];
        Phaser.Utils.Array.Shuffle(bookIds);
        this.correctBookIndex = bookIds[Phaser.Math.Between(0, 4)];
        for (let i = 0; i < 5; i++) {
            let book = this.books.create(960 + (i * 90), 230, `book${bookIds[i]}`).setScale(0.12).refreshBody().setInteractive();
            book.setData('id', bookIds[i]);
            book.on('pointerdown', () => {
                if (scene.isGameOver || Phaser.Math.Distance.Between(scene.player.x, scene.player.y, book.x, book.y) > 100) return;
                if (scene.questStage === undefined) scene.questStage = 0;
                if (scene.questStage === 0) {
                    if (book.getData('id') === scene.correctBookIndex) {
                        scene.questStage = 1; 
                        scene.wallGate2.destroy(); 
                        scene.sound.play('ture');
                        scene.questText.setText('เควส: หากองไฟที่ถูกต้อง'); 
                        showHint("ไขปริศนาหนังสือสำเร็จ! เปิดทางไปห้องถัดไปแล้ว", false);
                    } else {
                        scene.sound.play('fale');
                        showHint("หนังสือเล่มนี้ไม่ใช่! ลองเล่มอื่นดูนะ");
                    }
                }
            });
        }

        this.fires = this.physics.add.staticGroup();
        this.correctFireIndex = Phaser.Math.Between(0, 4);
        for (let i = 0; i < 5; i++) {
            let fire = this.fires.create(200 + (i * 95), 230, 'fire').setScale(0.07).refreshBody().setInteractive();
            fire.setData('id', i);
            fire.on('pointerdown', () => {
                if (scene.isGameOver || Phaser.Math.Distance.Between(scene.player.x, scene.player.y, fire.x, fire.y) > 100) return;
                if (scene.questStage === 1) {
                    if (fire.getData('id') === scene.correctFireIndex) {
                        scene.questStage = 2; 
                        scene.wallGate3.destroy(); 
                        scene.sound.play('ture');
                        scene.questText.setText('เควส: หมุนหินให้ตั้งตรง'); 
                        showHint("ไขปริศนากองไฟสำเร็จ! เปิดทางลงโซนล่างแล้ว", false);
                    } else {
                        scene.sound.play('fale');
                        showHint("กองไฟดวงนี้ไม่ใช่!");
                    }
                }
            });
        }

        this.stones = this.physics.add.staticGroup();
        [{ x: 230, y: 700 }, { x: 480, y: 700 }, { x: 230, y: 900 }, { x: 480, y: 900 }].forEach(pos => {
            let stone = this.stones.create(pos.x, pos.y, 'ston').setScale(0.12).refreshBody().setInteractive();
            stone.setAngle(Phaser.Math.RND.pick([90, 180, 270]));
            stone.on('pointerdown', () => {
                if (scene.isGameOver || scene.questStage !== 2 || Phaser.Math.Distance.Between(scene.player.x, scene.player.y, stone.x, stone.y) > 100) return;
                stone.angle += 90;
                scene.sound.play('ston');
                let allCorrect = true;
                scene.stones.children.iterate(s => { if (Math.abs(s.angle) % 360 !== 0) allCorrect = false; });
                if (allCorrect) { 
                    scene.questStage = 3; 
                    scene.wallGate4.destroy(); 
                    scene.questText.setText('เควส: คุยกับ NPC'); 
                    showHint("กลไกหินปลดล็อกแล้ว! เปิดทางไปหา NPC", false); 
                }
            });
        });

        this.npc = this.physics.add.staticImage(1150, 750, 'npc').setScale(1.5).refreshBody().setInteractive();
        
        this.dialogueBubble = this.add.graphics().setDepth(150).setVisible(false);
        this.dialogueText = this.add.text(0, 0, '', { 
            fontSize: '20px', fill: '#000000', align: 'center', wordWrap: { width: 440 }, 
            padding: { top: 20, bottom: 20, left: 10, right: 10 } 
        }).setDepth(151).setVisible(false);
        
        this.npc.on('pointerdown', () => {
            if (scene.isGameOver || Phaser.Math.Distance.Between(scene.player.x, scene.player.y, scene.npc.x, scene.npc.y) > 100) return;
            scene.sound.play('ture');

            if (scene.questStage === 3) {
                scene.dialoguePages = ["ขอบคุณที่ช่วยแก้กลไกหินนะ!", "ฉันปลดล็อกหีบสมบัติให้แล้วในห้องตรงกลาง", "เลือกให้ดีล่ะ มีแค่ใบเดียวที่มีกุญแจ!"];
                scene.currentPage = 0;
                scene.showDialogue(scene.npc.x, scene.npc.y - 80);
                scene.questStage = 4; 
                scene.questText.setText('เควส: เปิดหีบสมบัติห้องตรงกลาง (ระวังกับดัก!)');
            } else if (scene.questStage < 3) {
                scene.dialoguePages = ["เธอต้องเคลียร์ปริศนาห้องอื่นก่อนนะ"];
                scene.currentPage = 0;
                scene.showDialogue(scene.npc.x, scene.npc.y - 80);
            }
        });

        this.chestGroup = this.physics.add.staticGroup();
        let correctChestIndex = Phaser.Math.Between(0, 2);
        [{x: 920, y: 700}, {x: 1080, y: 700}, {x: 1240, y: 700}].forEach((pos, index) => {
            let chest = this.chestGroup.create(pos.x, pos.y, 'heep').setScale(1.2).refreshBody().setInteractive();
            chest.on('pointerdown', () => {
                if (scene.isGameOver || scene.questStage !== 4 || Phaser.Math.Distance.Between(scene.player.x, scene.player.y, chest.x, chest.y) > 100) return;
                chest.setTexture('heepopen');
                scene.sound.play('heepopen');
                if (index === correctChestIndex) { 
                    scene.questStage = 5; 
                    scene.hasKey = true; 
                    scene.questText.setText('เควส: ไขประตูออกไป!'); 
                    showHint("ได้รับกุญแจแล้ว รีบไปที่ประตู!", false); 
                } else { 
                    scene.isGameOver = true; 
                    scene.showGameOverScreen(); 
                }
            });
        });

        if (this.wallsLayer) {
            this.physics.add.collider(this.player, this.wallsLayer);
            this.physics.add.collider(this.enemiesGroup, this.wallsLayer);
        }

        this.physics.add.collider(this.player, this.wallGate2);
        this.physics.add.collider(this.player, this.wallGate3);
        this.physics.add.collider(this.player, this.wallGate4);

        // ชนกับศัตรูตัวใดก็ได้แล้ว Game Over
        this.physics.add.overlap(this.player, this.enemiesGroup, () => {
            if (!this.isGameOver) {
                this.isGameOver = true;
                this.showGameOverScreen();
            }
        });

        this.physics.add.collider(this.player, this.exitDoor, () => {
            if (scene.hasKey) { 
                scene.exitDoor.setTexture('dooropen'); 
                scene.exitDoor.body.enable = false; 
                showHint("ไขกุญแจเปิดประตูสำเร็จ! เดินออกไปเลย!", false); 
            } else {
                showHint("ประตูถูกล็อกแน่นหนา! ต้องใช้กุญแจจากหีบสมบัติมาไข");
            }
        });
        
        this.physics.add.overlap(this.player, this.targetExitZone, () => { 
            if (scene.hasKey && !scene.isGameOver) { 
                scene.isGameOver = true; 
                scene.scene.stop("GameplayScene");
                scene.scene.start("VictoryScene"); 
            } 
        });

        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
    }

    initEnemies() {
        this.enemiesGroup = this.physics.add.group();

        let configData = this.cache.json.get('gameConfig');
        let enemiesInfo = configData && configData.enemies && configData.enemies.objects ? configData.enemies.objects : [
            { "x": 350, "y": 300 },
            { "x": 350, "y": 800 },
            { "x": 1200, "y": 850 }
        ];

        enemiesInfo.forEach(obj => {
            let enemy = this.physics.add.sprite(obj.x, obj.y, 'orc', 0).setScale(2.3);
            enemy.setOrigin(0.5, 0.5);
            enemy.setCollideWorldBounds(true);
            
            // ขนาด Hitbox และ Offset ของ Orc
            enemy.body.setSize(28, 32); 
            enemy.body.setOffset(36, 40);

            enemy.anims.play('orc-anim', true);
            this.enemiesGroup.add(enemy);
        });
    }

    showDialogue(x, y) {
        let boxWidth = 480;
        let boxHeight = 120;
        let boxY = y - 130; 

        this.dialogueBubble.clear()
            .fillStyle(0xffffff, 1)
            .fillRoundedRect(x - boxWidth / 2, boxY, boxWidth, boxHeight, 10)
            .lineStyle(2, 0x000000, 1)
            .strokeRoundedRect(x - boxWidth / 2, boxY, boxWidth, boxHeight, 10)
            .setVisible(true).setAlpha(1);
        
        this.dialogueText.setText(this.dialoguePages[this.currentPage])
            .setPosition(x, boxY + 20) 
            .setOrigin(0.5, 0)
            .setVisible(true)
            .setAlpha(1);
        
        let advanceDialogue = (pointer) => {
            pointer.event.stopPropagation();

            if (this.currentPage < this.dialoguePages.length - 1) {
                this.currentPage++;
                this.dialogueText.setText(this.dialoguePages[this.currentPage]);
            } else {
                this.dialogueBubble.setVisible(false);
                this.dialogueText.setVisible(false);
                this.input.off('pointerdown', advanceDialogue);
            }
        };

        this.input.off('pointerdown', advanceDialogue);
        this.input.on('pointerdown', advanceDialogue);
    }

    showGameOverScreen() {
        this.sound.play('gameover');
        this.scene.stop("GameplayScene");
        this.scene.start("GameOverScene");
    }

    update() {
        if (this.isGameOver) { 
            this.player.setVelocity(0); 
            if (this.enemiesGroup) {
                this.enemiesGroup.children.iterate(enemy => {
                    if (enemy) enemy.setVelocity(0);
                });
            }
            if (this.dangerGraphics) {
                this.dangerGraphics.clear();
            }
            return; 
        }

        // ควบคุมผู้เล่น
        this.player.setVelocity(0);
        let moving = false;
        if (this.keyA.isDown) { this.player.setVelocityX(-250); this.player.setFlipX(true); moving = true; }
        else if (this.keyD.isDown) { this.player.setVelocityX(250); this.player.setFlipX(false); moving = true; }
        if (this.keyW.isDown) { this.player.setVelocityY(-250); moving = true; }
        else if (this.keyS.isDown) { this.player.setVelocityY(250); moving = true; }
        this.player.anims.play(moving ? 'walk' : 'idle', true);

        // สร้างหรือเคลียร์กราฟิกวงกลมระยะอันตราย
        if (!this.dangerGraphics) {
            this.dangerGraphics = this.add.graphics();
        }
        this.dangerGraphics.clear();

        // ระบบเดินตาม (AI Enemy) และวาดวงกลมระยะอันตราย
        if (this.enemiesGroup && this.player) {
            let detectionRange = 180; // ระยะการมองเห็นของศัตรู

            this.enemiesGroup.children.iterate(enemy => {
                if (!enemy) return;

                // วาดวงกลมสีแดงจางๆ แสดงระยะอันตราย
                this.dangerGraphics.fillStyle(0xff0000, 0.15);
                this.dangerGraphics.fillCircle(enemy.x, enemy.y, detectionRange);
                
                // วาดเส้นขอบวงกลม
                this.dangerGraphics.lineStyle(1.5, 0xff0000, 0.4);
                this.dangerGraphics.strokeCircle(enemy.x, enemy.y, detectionRange);

                let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

                if (distance < detectionRange) {
                    this.physics.moveToObject(enemy, this.player, 120);

                    if (this.player.x < enemy.x) {
                        enemy.setFlipX(true);
                    } else {
                        enemy.setFlipX(false);
                    }
                } else {
                    enemy.setVelocity(0);
                }
            });
        }
    }
}