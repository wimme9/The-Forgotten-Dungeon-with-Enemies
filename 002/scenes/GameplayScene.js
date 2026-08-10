export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super("GameplayScene");
    }

    preload() {
        // แก้ไข Path ให้ตรงกับโฟลเดอร์ data จริงของคุณ
        this.load.json('gameData', 'data/gameData.json');

        // โหลด Asset รูปภาพตามเดิม
        this.load.spritesheet('character', 'Character_image/t.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('book_img', 'map/5089832694e75c73988b8a3dd19b4855-removebg-preview.png');        
        this.load.image('statue_img', 'map/7d61c571dfac6e1a32f0672e85c842eb-removebg-preview.png');    
        this.load.image('torch_off', 'map/Screenshot_2026-07-17_124740-removebg-preview.png');   
        this.load.image('torch_on', 'map/Screenshot_2026-07-17_124657-removebg-preview.png');    
        this.load.image('npc_img', 'map/f882d67d80d2c8e9549fa31ff7a7286b-removebg-preview.png');         
        this.load.image('chest_img', 'map/445a278c0bf0fee40c5963899289126e-removebg-preview.png');      
        this.load.image('door_closed', 'map/Screenshot_2026-07-17_130415-removebg-preview.png'); 
        this.load.image('door_open', 'map/Screenshot_2026-07-17_130421-removebg-preview.png');    
        this.load.spritesheet('orc', 'Character_image/Orc.png', { frameWidth: 100, frameHeight: 100 });
    }

    create() {
        // ดึง Data ทั้งหมดมาจาก Cache ที่โหลดไว้ผ่าน JSON
        const rawData = this.cache.json.get('gameData');
        
        // กำหนดค่าตัวแปรเกมและ State โดยคัดลอกโครงสร้างมาจาก JSON
        this.gameConfigData = rawData.settings;
        this.enemyConfig = rawData.enemy;
        this.messagesData = rawData.messages;
        this.gameState = JSON.parse(JSON.stringify(rawData.initialState));

        this.isGameOver = false;
        this.timeLeft = this.gameConfigData.timeLeft;

        const bgGraphics = this.add.graphics();

        // พื้นหลังห้องต่างๆ (Logic การวาด UI/Graphics)
        bgGraphics.fillStyle(0x5c4033, 1).fillRect(20, 20, 470, 270);
        bgGraphics.lineStyle(2, 0x3d2b22, 0.5);
        for (let y = 20; y < 290; y += 20) { bgGraphics.lineBetween(20, y, 490, y); }

        bgGraphics.fillStyle(0x3e3e3e, 1).fillRect(510, 20, 470, 270);
        let size = 33.5;
        for (let rows = 0; rows < 8; rows++) {
            for (let cols = 0; cols < 14; cols++) {
                if ((rows + cols) % 2 === 0) {
                    bgGraphics.fillStyle(0x555555, 0.4);
                    bgGraphics.fillRect(510 + (cols * size), 20 + (rows * size), size, size);
                }
            }
        }

        bgGraphics.fillStyle(0x2b2b2b, 1).fillRect(20, 310, 470, 270);
        bgGraphics.lineStyle(3, 0x1c1c1c, 0.6);
        for (let x = 20; x < 490; x += 40) { bgGraphics.lineBetween(x, 310, x, 580); }
        for (let y = 310; y < 580; y += 30) { bgGraphics.lineBetween(20, y, 490, y); }

        bgGraphics.fillStyle(0x4a0e17, 1).fillRect(510, 310, 470, 270); 
        bgGraphics.fillStyle(0x8a1c2a, 1).fillRect(540, 340, 410, 210); 
        bgGraphics.lineStyle(4, 0xd4af37, 0.8);                                                         
        bgGraphics.strokeRect(540, 340, 410, 210);

        const walls = this.physics.add.staticGroup();
        this.interactables = this.physics.add.staticGroup(); 
        const gates = this.physics.add.staticGroup();

        const buildWall = (x, y, w, h) => {
            this.add.graphics().fillStyle(0x1a1a1a, 1).fillRect(x, y, w, h);
            let wall = walls.create(x + w/2, y + h/2, null);
            wall.setDisplaySize(w, h).setVisible(false).refreshBody();
        };

        buildWall(0, 0, 1000, 20);
        buildWall(0, 580, 1000, 20);
        buildWall(0, 0, 20, 600);
        buildWall(980, 0, 20, 330);
        buildWall(980, 410, 20, 190);
        buildWall(490, 20, 20, 50);   
        buildWall(490, 170, 20, 120);  
        buildWall(490, 290, 20, 150);  
        buildWall(490, 540, 20, 40);
        buildWall(20, 290, 100, 20);   
        buildWall(220, 290, 270, 20);  
        buildWall(490, 290, 490, 20);  

        // Doors Setup
        let libGateColor = this.drawDoorGraphics(490, 70, 20, 100);
        this.libraryGate = gates.create(500, 120);
        this.libraryGate.body.setSize(20, 100);
        this.libraryGate.body.setOffset(-10, -50);
        this.libraryGate.setData('name', 'library');
        this.libraryGate.setData('graphics', libGateColor);
        this.libraryGate.setVisible(false);

        let statueGateColor = this.drawDoorGraphics(120, 290, 100, 20);
        this.statueGate = gates.create(170, 300);
        this.statueGate.body.setSize(100, 20);
        this.statueGate.body.setOffset(-50, -10);
        this.statueGate.setData('name', 'statue');
        this.statueGate.setData('graphics', statueGateColor);
        this.statueGate.setVisible(false);

        let torchGateColor = this.drawDoorGraphics(490, 440, 20, 100);
        this.torchGate = gates.create(500, 490);
        this.torchGate.body.setSize(20, 100);
        this.torchGate.body.setOffset(-10, -50);
        this.torchGate.setData('name', 'torch');
        this.torchGate.setData('graphics', torchGateColor);
        this.torchGate.setVisible(false);

        this.exitGate = this.physics.add.image(965, 370, 'door_closed');
        this.exitGate.setDisplaySize(40, 80);
        this.exitGate.body.setImmovable(true);
        gates.add(this.exitGate); 

        // ROOM 1: Library Books
        this.add.text(40, 30, "ห้องที่ 1: ห้องสมุด (คำถาม: น้ำกับไฟใครจะชนะ?)", { font: "16px Arial", fill: "#88ccff" });
        for (let i = 0; i < 5; i++) {
            let bookX = 80 + (i * 80); 
            let book = this.add.image(bookX, 110, 'book_img').setInteractive();
            book.setDisplaySize(35, 45);
            this.physics.add.existing(book, true);
            book.body.setSize(45, 55);
            book.setData('type', 'book').setData('id', i + 1);
            this.interactables.add(book);
            this.add.text(bookX, 145, this.gameState.bookTitles[i], { font: "14px Arial", fill: "#ffffff" }).setOrigin(0.5);
        }

        // ROOM 2: Statues
        this.add.text(540, 30, "ห้องที่ 2: ห้องรูปปั้น", { font: "16px Arial", fill: "#ffcc88" });
        for (let i = 0; i < 4; i++) {
            let statue = this.add.image(580 + (i * 100), 120, 'statue_img').setInteractive();
            statue.setDisplaySize(45, 45);
            this.physics.add.existing(statue, true);
            statue.body.setSize(55, 55);
            statue.setData('type', 'statue').setData('id', i);
            statue.setAngle(this.gameState.statueAngles[i]);
            this.interactables.add(statue);
        }

        // ROOM 3: Torches
        this.add.text(40, 330, "ห้องที่ 3: ห้องคบเพลิง", { font: "16px Arial", fill: "#ff8888" });
        for (let i = 0; i < 4; i++) {
            let torch = this.add.image(90 + (i * 90), 450, 'torch_off').setInteractive();
            torch.setDisplaySize(40, 55);
            this.physics.add.existing(torch, true);
            torch.body.setSize(50, 65);
            torch.setData('type', 'torch').setData('id', i + 1);
            this.interactables.add(torch);
            this.add.text(85 + (i * 90), 485, `${i+1}`, { font: "12px Arial", fill: "#ffffff" });
        }

        // ROOM 4: NPC & Chest
        this.add.text(540, 318, "ห้องที่ 4: ห้องสมบัติ & NPC", { font: "16px Arial", fill: "#88ff88" });
        
        this.npc = this.interactables.create(700, 450, 'npc_img');
        this.npc.setDisplaySize(40, 40).setInteractive();
        this.npc.body.setSize(50, 50);
        this.npc.refreshBody();
        this.npc.setData('type', 'npc');
        this.add.text(685, 475, "NPC", { font: "12px Arial", fill: "#ffffff" });

        this.chest = this.interactables.create(850, 450, 'chest_img');
        this.chest.setDisplaySize(50, 45).setInteractive();
        this.chest.body.setSize(60, 55);
        this.chest.refreshBody();
        this.chest.setData('type', 'chest');

        // PLAYER Setup
        this.player = this.physics.add.sprite(60, 180, 'character', 0).setScale(1.5).setCollideWorldBounds(true);
        this.player.setDepth(2);
        this.initEnemies();
        this.physics.add.collider(this.player, walls);
        this.physics.add.collider(this.enemies, walls);
        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
            if (!enemy.isAttacking && !enemy.isStunned && !this.isGameOver && dist <= enemy.attackRange) {
                this.startEnemyAttack(enemy);
            }
        });
        
        this.physics.add.collider(this.player, gates, (p, g) => {
            let gateName = g.getData('name');
            if (gateName === 'library' && this.gameState.gatesOpened.library) g.destroy();
            if (gateName === 'statue' && this.gameState.gatesOpened.statue) g.destroy();
            if (gateName === 'torch' && this.gameState.gatesOpened.torch) g.destroy();
        }, null, this);

        this.uiText = this.add.text(20, 550, this.messagesData.mission, { font: "16px Arial", fill: "#ffffff" });

        // TIMER UI
        this.timerText = this.add.text(960, 65, `⌛ ${this.timeLeft}s`, {
            fontSize: "20px", fill: "#ff4444", fontStyle: "bold", backgroundColor: "#222222", padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0).setDepth(100);

        this.timerEvent = this.time.addEvent({
            delay: 1000, callback: this.onSecondTick, callbackScope: this, loop: true
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Keyboard Interaction Logic
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isGameOver || this.gameState.cutsceneStage > 0) return;

            let closestObj = null;
            let minDistance = this.gameConfigData.interactDistance;

            this.interactables.getChildren().forEach(obj => {
                let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestObj = obj;
                }
            });

            if (closestObj) {
                this.handleInteraction(closestObj);
            }
        });

        // Animations Setup
        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        }
        if (!this.anims.exists('walk')) {
            this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
        }
        this.player.play('idle');

        // Pause Button
        let pauseButton = this.add.text(960, 25, "||", {
            fontSize: "24px", color: "#ff0000", backgroundColor: "#333333", padding: { x: 12, y: 6 }
        }).setOrigin(0.5, 0).setDepth(100).setInteractive({ useHandCursor: true });

        pauseButton.on("pointerdown", () => {
            this.scene.pause();
            this.scene.launch("PauseScene");
        });
    }

    createSparkles(x, y, color = 0x00ffff) {
        for (let i = 0; i < 8; i++) {
            let spark = this.add.circle(x, y, 4, color);
            let angle = Math.random() * Math.PI * 2;
            let speed = 40 + Math.random() * 40;

            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0, scale: 0.1, duration: 500,
                onComplete: () => spark.destroy()
            });
        }
    }

    initEnemies() {
        if (!this.enemyConfig) return;

        this.enemies = this.physics.add.group();
        this.setupOrcAnimations();
        this.createOrc(this.enemyConfig.spawnX, this.enemyConfig.spawnY);
        this.createOrc(820, 430);
    }

    setupOrcAnimations() {
        if (!this.anims.exists('orc_idle')) {
            this.anims.create({ key: 'orc_idle', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
        }
        if (!this.anims.exists('orc_walk')) {
            this.anims.create({ key: 'orc_walk', frames: this.anims.generateFrameNumbers('orc', { start: 9, end: 16 }), frameRate: 8, repeat: -1 });
        }
        if (!this.anims.exists('orc_attack')) {
            this.anims.create({ key: 'orc_attack', frames: this.anims.generateFrameNumbers('orc', { start: 17, end: 24 }), frameRate: 10, repeat: 0 });
        }
    }

    createOrc(x, y) {
        const { speed, detectRadius, hitbox } = this.enemyConfig;
        const orc = this.physics.add.sprite(x, y, 'orc').setScale(2).setDepth(1);
        orc.body.setSize(hitbox.hRadius * 2, hitbox.vRadius * 2);
        orc.body.setOffset(40, 40);
        orc.speed = speed * 60;
        orc.detectRadius = detectRadius;
        orc.isAttacking = false;
        orc.isStunned = false;
        orc.attackRange = 50;
        orc.play('orc_idle');
        orc.on('animationcomplete', (animation) => {
            if (animation.key === 'orc_attack') {
                orc.isAttacking = false;
                if (this.isGameOver) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, orc.x, orc.y);
                if (dist <= orc.attackRange) {
                    this.uiText.setText('Orc โจมตีถูกต้อง! คุณพ่ายแพ้');
                    this.triggerGameOver();
                } else {
                    this.handleEnemyMiss(orc);
                }
            }
        });
        this.enemies.add(orc);
        return orc;
    }

    startEnemyAttack(enemy) {
        if (!enemy || enemy.isAttacking || enemy.isStunned || this.isGameOver) return;
        enemy.isAttacking = true;
        enemy.setVelocity(0);
        enemy.play('orc_attack');
        this.uiText.setText('Orc กำลังโจมตี...');
    }

    handleEnemyMiss(enemy) {
        if (!enemy) return;
        enemy.isStunned = true;
        enemy.setVelocity(0);
        enemy.setTint(0xff9999);
        this.uiText.setText('คุณหลบได้! Orc ถูกมึนงงและไม่สามารถโจมตีได้ 5 วินาที');

        this.tweens.killTweensOf(enemy);
        this.tweens.add({
            targets: enemy,
            alpha: 0.25,
            duration: 150,
            yoyo: true,
            repeat: 16,
            onComplete: () => {
                enemy.clearTint();
                enemy.alpha = 1;
            }
        });

        this.time.delayedCall(5000, () => {
            enemy.isStunned = false;
            if (!enemy.isAttacking && !this.isGameOver) {
                enemy.play('orc_idle');
            }
        });
    }

    onSecondTick() {
        if (this.isGameOver) return;
        this.timeLeft--;
        this.timerText.setText(`⌛ ${this.timeLeft}s`);
        if (this.timeLeft <= 0) this.triggerGameOver();
    }

    triggerGameOver() {
        this.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove();
        this.player.setVelocity(0, 0);
        this.player.play('idle');

        let overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75).fillRect(0, 0, 1000, 600).setDepth(200);

        this.add.text(500, 200, "⏰ เวลาหมดแล้ว!", { font: "bold 36px Arial", fill: "#ff4444" }).setOrigin(0.5).setDepth(201);
        this.add.text(500, 250, "คุณไม่สามารถหนีออกจากเขาวงกตได้ทันเวลา", { font: "18px Arial", fill: "#ffffff" }).setOrigin(0.5).setDepth(201);

        let restartBtn = this.add.text(500, 320, "🔄 เล่นใหม่อีกครั้ง", {
            font: "bold 20px Arial", fill: "#ffffff", backgroundColor: "#27ae60", padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => this.scene.restart());

        let menuBtn = this.add.text(500, 385, "🏠 กลับหน้าหลัก", {
            font: "bold 20px Arial", fill: "#ffffff", backgroundColor: "#c0392b", padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: "true" });
        menuBtn.on('pointerdown', () => this.scene.start("MenuScene"));
    }

    drawDoorGraphics(x, y, w, h) {
        let g = this.add.graphics();
        g.fillStyle(0x5a2d0c, 1).fillRect(x, y, w, h);
        g.lineStyle(2, 0x3d1f08, 1);
        if (w > h) {
            g.lineBetween(x, y + h/2, x + w, y + h/2);
            g.fillStyle(0x7f8c8d, 1).fillRect(x, y, 6, h);
            g.fillStyle(0x7f8c8d, 1).fillRect(x + w - 6, y, 6, h);
        } else {
            g.lineBetween(x + w/2, y, x + w/2, y + h);
            g.fillStyle(0x7f8c8d, 1).fillRect(x, y, w, 6);
            g.fillStyle(0x7f8c8d, 1).fillRect(x, y + h - 6, w, 6);
        }
        return g;
    }

    handleInteraction(obj) {
        if (this.isGameOver || this.gameState.cutsceneStage > 0) return;
        const type = obj.getData('type');

        if (type === 'book') {
            let clickedId = obj.getData('id');
            let title = this.gameState.bookTitles[clickedId - 1]; 
            if (clickedId === this.gameState.correctBookId) {
                this.createSparkles(obj.x, obj.y, 0x00ffff);
                this.gameState.hasSpell = true;
                this.gameState.gatesOpened.library = true;
                if(this.libraryGate.getData('graphics')) this.libraryGate.getData('graphics').destroy();
                this.libraryGate.destroy(); 
                this.uiText.setText(`คุณเลือกคำตอบ: "${title}" -> ถูกต้อง! ประตูเปิดแล้ว!`);
            } else {
                this.uiText.setText(`คุณเลือกคำตอบ: "${title}" -> ยังไม่ถูก ลองเล่มอื่นดูนะ`);
            }
        }

        if (type === 'statue') {
            if (!this.gameState.hasSpell) { 
                this.uiText.setText(this.messagesData.statueLocked); 
                return; 
            }
            
            if (this.gameState.hasLighter) { 
                this.uiText.setText(`รหัสลับคบเพลิงห้องถัดไปคือ: [ ${this.gameState.correctTorchOrder.join(" -> ")} ]`); 
                return; 
            }

            let id = obj.getData('id');
            this.gameState.statueAngles[id] = (this.gameState.statueAngles[id] + 90) % 360;
            obj.setAngle(this.gameState.statueAngles[id]);

            // แปลงมุมองศาปัจจุบันเป็นทิศทางลูกศรสำหรับแสดงผล
            let currentDir = "";
            if (this.gameState.statueAngles[id] === 0) currentDir = "ขึ้น (↑)";
            else if (this.gameState.statueAngles[id] === 90) currentDir = "ขวา (→)";
            else if (this.gameState.statueAngles[id] === 180) currentDir = "ลง (↓)";
            else if (this.gameState.statueAngles[id] === 270) currentDir = "ซ้าย (←)";

            // ดึงคำใบ้เป้าหมายจาก array ของ arrowClues ใน JSON
            let targetDir = this.gameState.arrowClues ? this.gameState.arrowClues[id] : "";

            let isCorrect = this.gameState.statueAngles.every((angle, index) => angle === this.gameState.targetAngles[index]);
            if (isCorrect) {
                this.createSparkles(this.statueGate.x, this.statueGate.y, 0x00ffff);
                this.gameState.hasLighter = true;
                this.gameState.gatesOpened.statue = true;
                if(this.statueGate.getData('graphics')) this.statueGate.getData('graphics').destroy();
                this.statueGate.destroy(); 
                this.uiText.setText(`รูปปั้นถูกต้อง! ได้รับ "ไฟแช็กโบราณ" รหัสคบเพลิง: [ ${this.gameState.correctTorchOrder.join(" -> ")} ]`);
            } else {
                this.uiText.setText(`รูปปั้นที่ ${id + 1} (คำใบ้เป้าหมาย: ${targetDir}) -> ปัจจุบัน: ${currentDir}`);
            }
        }

        if (type === 'torch') {
            if (!this.gameState.hasLighter) {
                this.uiText.setText(this.messagesData.darkRoom);
                return;
            }
            let id = obj.getData('id');
            if (this.gameState.torchSequence.includes(id)) return;

            this.createSparkles(obj.x, obj.y, 0xffaa00);
            this.gameState.torchSequence.push(id);
            obj.setTexture('torch_on'); 

            let step = this.gameState.torchSequence.length - 1;
            if (this.gameState.torchSequence[step] !== this.gameState.correctTorchOrder[step]) {
                this.gameState.torchSequence = [];
                this.children.list.forEach(child => {
                    if (child.getData && child.getData('type') === 'torch') child.setTexture('torch_off');
                });
                this.uiText.setText(`รหัสผิดพลาด! คบเพลิงดับลงทั้งหมด รหัสที่ถูกต้องคือ: [ ${this.gameState.correctTorchOrder.join(" -> ")} ]`);
            } else if (this.gameState.torchSequence.length === 4) {
                this.createSparkles(this.torchGate.x, this.torchGate.y, 0x00ffff);
                this.gameState.gatesOpened.torch = true;
                if(this.torchGate.getData('graphics')) this.torchGate.getData('graphics').destroy();
                this.torchGate.destroy(); 
                this.uiText.setText("รหัสถูกต้อง! ประตูห้องที่ 4 เปิดออกแล้ว ลองเข้าไปคุยกับ NPC ดูสิ!");
            } else {
                this.uiText.setText(`กำลังป้อนรหัสคบเพลิง... (${this.gameState.torchSequence.join(" -> ")})`);
            }
        }

        if (type === 'npc') {
            if (this.gameState.torchSequence.length < 4) {
                this.uiText.setText(this.messagesData.npcIgnored);
            } else {
                if (!this.gameState.chestOpened) {
                    this.uiText.setText("NPC: 'ยินดีต้อนรับผู้กล้า! ประตูหนีออกอยู่ขวาโน่น แต่มันล็อกอยู่ เดินไปเปิดหีบสมบัตินั่นเพื่อเอาของออกมาก่อน!'");
                } else {
                    this.uiText.setText("NPC: 'ยอดเยี่ยม! สมบัติโบราณเปิดแล้ว ข้าจะร่ายมนต์เปิดประตูทางออกให้ ณ บัดนี้!'");
                    this.gameState.cutsceneStage = 2;
                }
            }
        }

        if (type === 'chest') {
            if (this.gameState.torchSequence.length < 4) {
                this.uiText.setText(this.messagesData.chestLocked);
                return;
            }
            if (!this.gameState.chestOpened) {
                this.gameState.cutsceneStage = 1;
            } else {
                this.uiText.setText(this.messagesData.chestOpenedReminder);
            }
        }
    }

    triggerVictory() {
        this.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove(); 
        this.player.setVelocity(0, 0);
        this.player.play('idle');
        this.scene.start("VictoryScene");
    }

    update() {
        if (this.isGameOver) return;

        if (this.gameState.cutsceneStage === 1) {
            if (this.player.x < this.chest.x - 45) {
                this.player.setVelocityX(150); this.player.setVelocityY(0);
                this.player.setFlipX(false); this.player.play('walk', true);
            } else {
                this.createSparkles(this.chest.x, this.chest.y, 0xffff00);
                this.player.setVelocityX(0); this.player.play('idle');
                this.gameState.chestOpened = true;
                this.uiText.setText("🏆 คุณเปิดหีบสำเร็จแล้ว! กลับไปคุยกับ NPC อีกครั้ง");
                this.gameState.cutsceneStage = 0; 
            }
            return;
        }

        if (this.gameState.cutsceneStage === 2) {
            this.player.setVelocity(0); this.player.play('idle');
            if (this.npc.x < 930) {
                this.npc.x += 2.5;
            } else {
                this.gameState.cutsceneStage = 2.5; 
                this.createSparkles(this.exitGate.x, this.exitGate.y, 0x00ffff);
                this.exitGate.setTexture('door_open'); 
                this.exitGate.body.enable = false;      
                this.uiText.setText("NPC: 'ประตูเปิดแล้ว! รีบหนีออกไปเร็วผู้กล้า!'");
                this.time.delayedCall(1000, () => { this.gameState.cutsceneStage = 3; });
            }
            return;
        }

        if (this.gameState.cutsceneStage === 2.5) return;

        if (this.gameState.cutsceneStage === 3) {
            if (this.player.y > 375) {
                this.player.setVelocityX(50); this.player.setVelocityY(-150);
                this.player.setFlipX(false); this.player.play('walk', true);
            } else {
                this.player.setVelocityX(150); this.player.setVelocityY(0);
                this.player.setFlipX(false); this.player.play('walk', true);
                if (this.player.x >= 975) {
                    this.player.setVelocityX(0);
                    this.gameState.cutsceneStage = 0;
                    this.triggerVictory();
                }
            }
            return;
        }

        if (this.enemies && !this.gameState.cutsceneStage) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.isAttacking || this.isGameOver) {
                    return;
                }
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist <= enemy.detectRadius) {
                    if (dist <= enemy.attackRange) {
                        this.startEnemyAttack(enemy);
                    } else {
                        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                        enemy.play('orc_walk', true);
                        enemy.setFlipX(this.player.x < enemy.x);
                    }
                } else {
                    enemy.setVelocity(0);
                    enemy.play('orc_idle', true);
                }
            });
        }

        const speed = this.gameConfigData.playerSpeed;
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
            if (this.player.anims.currentAnim.key !== 'walk') this.player.play('walk');
        } else {
            if (this.player.anims.currentAnim.key !== 'idle') this.player.play('idle');
        }
    }
}