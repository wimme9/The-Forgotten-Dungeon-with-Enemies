const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 576,
    backgroundColor: '#1e1e1e',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, npc, chest, cursors, wasd, uiText, exitGate;
let map;
let isGameOver = false;

const gameState = {
    hasSpell: false,
    hasLighter: false,
    correctBookId: 1, 
    bookTitles: ["น้ำ", "ไฟ", "ลม", "ดิน", "ไม้"],
    statueAngles: [90, 180, 270, 90], 
    targetAngles: [0, 180, 90, 270], 
    torchSequence: [],
    correctTorchOrder: [],
    chestOpened: false,
    cutsceneStage: 0,
    gatesOpened: { library: false, statue: false, torch: false, exit: false }
};

function preload() {
    // 🚨 ระบบแจ้งเตือนไฟล์หาย/หาไม่เจอ บนหน้าจอเกม
    this.load.on('loaderror', (fileObj) => {
        console.error('หาไฟล์ไม่เจอ:', fileObj.src);
        this.add.text(20, 20, `❌ หาไฟล์ไม่เจอ: ${fileObj.key}\nPath: ${fileObj.src}`, { 
            font: "16px Arial", fill: "#ff0000", backgroundColor: "#000000" 
        }).setDepth(999);
    });

    // 🗺️ โหลด Map JSON & Tileset Image
    this.load.tilemapTiledJSON('map_json', 'dungeon.json'); // โหลด JSON ให้ Key ชื่อ 'map_json'
    this.load.image('tiles', 'map/002-5.png');               // โหลดรูป Tileset ให้ Key ชื่อ 'tiles'

    // 🎨 โหลด Assets อื่นๆ
    this.load.spritesheet('character', 'Character_image/t.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('book_img', 'map/5089832694e75c73988b8a3dd19b4855-removebg-preview.png');         
    this.load.image('statue_img', 'map/7d61c571dfac6e1a32f0672e85c842eb-removebg-preview.png');     
    this.load.image('torch_off', 'map/Screenshot_2026-07-17_124740-removebg-preview.png');   
    this.load.image('torch_on', 'map/Screenshot_2026-07-17_124657-removebg-preview.png');     
    this.load.image('npc_img', 'map/f882d67d80d2c8e9549fa31ff7a7286b-removebg-preview.png');           
    this.load.image('chest_img', 'map/445a278c0bf0fee40c5963899289126e-removebg-preview.png');       
    this.load.image('door_closed', 'map/Screenshot_2026-07-17_130415-removebg-preview.png'); 
    this.load.image('door_open', 'map/Screenshot_2026-07-17_130421-removebg-preview.png');     
}

function create() {
    // ==========================================
    // 🗺️ โหลด TILEMAP (จุดแก้ไขสำคัญ)
    // ==========================================
    // 1. เรียกใช้ Key 'map_json' ที่สั่งไว้ใน preload()
    map = this.make.tilemap({ key: 'map_json' });

    // 2. ดึงชื่อ Tileset จากใน JSON มาผูกกับรูปภาพ 'tiles' (map/002-5.png)
    const jsonTilesetName = map.tilesets[0] ? map.tilesets[0].name : '002-5';
    const tileset = map.addTilesetImage(jsonTilesetName, 'tiles');

    // --- สร้าง Player ก่อน เพื่อนำไปชนกับกำแพง ---
    player = this.physics.add.sprite(60, 180, 'character', 0).setScale(1.5).setCollideWorldBounds(true);
    player.setDepth(2);

    // 3. วนลูปวาด Layer ทั้งหมดที่มีอยู่ในไฟล์ JSON
    map.layers.forEach(layerData => {
        let layer = map.createLayer(layerData.name, tileset, 0, 0);
        
        // ถ้าชื่อ Layer มีคำว่า "wall" หรือ "black" ให้เปิดระบบการชน (Collision)
        const layerNameLower = layerData.name.toLowerCase();
        if (layerNameLower.includes('wall') || layerNameLower.includes('black')) {
            layer.setCollisionByExclusion([-1, 0]);
            this.physics.add.collider(player, layer);
        }
    });

    // ==========================================
    // 🎯 Interactive Groups & Game Setup
    // ==========================================
    const interactables = this.physics.add.staticGroup();
    const gates = this.physics.add.staticGroup();

    let numbers = [1, 2, 3, 4];
    gameState.correctTorchOrder = numbers.sort(() => Math.random() - 0.5);

    const drawDoorGraphics = (scene, x, y, w, h) => {
        let g = scene.add.graphics();
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
    };

    // --- ประตู ---
    let libraryGate = gates.create(500, 120, null).setDisplaySize(20, 100).setData('name', 'library');
    libraryGate.setData('graphics', drawDoorGraphics(this, 490, 70, 20, 100));

    let statueGate = gates.create(170, 300, null).setDisplaySize(100, 20).setData('name', 'statue');
    statueGate.setData('graphics', drawDoorGraphics(this, 120, 290, 100, 20));

    let torchGate = gates.create(500, 490, null).setDisplaySize(20, 100).setData('name', 'torch');
    torchGate.setData('graphics', drawDoorGraphics(this, 490, 440, 20, 100));

    exitGate = this.physics.add.image(965, 370, 'door_closed');
    exitGate.setDisplaySize(40, 80);
    exitGate.body.setImmovable(true);
    gates.add(exitGate); 

    // --- ROOM 1: LIBRARY ---
    this.add.text(40, 30, "ห้องที่ 1: ห้องสมุด (คำถาม: น้ำกับไฟใครจะชนะ?)", { font: "16px Arial", fill: "#88ccff" });
    for (let i = 0; i < 5; i++) {
        let bookX = 80 + (i * 80); 
        let book = this.add.image(bookX, 110, 'book_img').setInteractive();
        book.setDisplaySize(35, 45);
        this.physics.add.existing(book, true);
        book.setData('type', 'book').setData('id', i + 1);
        interactables.add(book);
        this.add.text(bookX, 145, gameState.bookTitles[i], { font: "14px Arial", fill: "#ffffff" }).setOrigin(0.5);
    }

    // --- ROOM 2: STATUE ---
    this.add.text(540, 30, "ห้องที่ 2: ห้องรูปปั้น", { font: "16px Arial", fill: "#ffcc88" });
    for (let i = 0; i < 4; i++) {
        let statue = this.add.image(580 + (i * 100), 120, 'statue_img').setInteractive();
        statue.setDisplaySize(45, 45);
        this.physics.add.existing(statue, true);
        statue.setData('type', 'statue').setData('id', i);
        statue.setAngle(gameState.statueAngles[i]);
        interactables.add(statue);
    }

    // --- ROOM 3: TORCH ---
    this.add.text(40, 330, "ห้องที่ 3: ห้องคบเพลิง", { font: "16px Arial", fill: "#ff8888" });
    for (let i = 0; i < 4; i++) {
        let torch = this.add.image(90 + (i * 90), 450, 'torch_off').setInteractive();
        torch.setDisplaySize(40, 55);
        this.physics.add.existing(torch, true);
        torch.setData('type', 'torch').setData('id', i + 1);
        interactables.add(torch);
        this.add.text(85 + (i * 90), 485, `${i+1}`, { font: "12px Arial", fill: "#ffffff" });
    }

    // --- ROOM 4: NPC & CHEST ---
    this.add.text(540, 318, "ห้องที่ 4: ห้องสมบัติ & NPC", { font: "16px Arial", fill: "#88ff88" });
    
    npc = interactables.create(700, 450, 'npc_img');
    npc.setDisplaySize(40, 40).setInteractive();
    npc.refreshBody();
    npc.setData('type', 'npc');
    this.add.text(685, 475, "NPC", { font: "12px Arial", fill: "#ffffff" });

    chest = interactables.create(850, 450, 'chest_img');
    chest.setDisplaySize(50, 45).setInteractive();
    chest.refreshBody();
    chest.setData('type', 'chest');

    // --- COLLIDERS ---
    this.physics.add.collider(player, gates, (p, g) => {
        let gateName = g.getData('name');
        if (gateName === 'library' && gameState.gatesOpened.library) g.destroy();
        if (gateName === 'statue' && gameState.gatesOpened.statue) g.destroy();
        if (gateName === 'torch' && gameState.gatesOpened.torch) g.destroy();
    }, null, this);

    uiText = this.add.text(20, 550, "ภารกิจ: ค้นหาหนังสือที่ถูกต้องในห้องสมุดเพื่อเปิดประตูสีขาวด้านบน", { font: "16px Arial", fill: "#ffffff" });

    this.physics.add.overlap(player, interactables, (p, obj) => {
        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            handleInteraction(obj, libraryGate, statueGate, torchGate);
        }
    }, null, this);

    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
    player.play('idle');
}

function handleInteraction(obj, libraryGate, statueGate, torchGate) {
    if (isGameOver || gameState.cutsceneStage > 0) return;
    const type = obj.getData('type');

    if (type === 'book') {
        let clickedId = obj.getData('id');
        let title = gameState.bookTitles[clickedId - 1]; 
        if (clickedId === gameState.correctBookId) {
            gameState.hasSpell = true;
            gameState.gatesOpened.library = true;
            if(libraryGate.getData('graphics')) libraryGate.getData('graphics').destroy();
            libraryGate.destroy(); 
            uiText.setText(`คุณเลือกคำตอบ: "${title}" -> ถูกต้อง! ประตูเปิดแล้ว!`);
        } else {
            uiText.setText(`คุณเลือกคำตอบ: "${title}" -> ยังไม่ถูก ลองเล่มอื่นดูนะ`);
        }
    }

    if (type === 'statue') {
        if (!gameState.hasSpell) { uiText.setText("รูปปั้นถูกผนึกแน่น!"); return; }
        if (gameState.hasLighter) { 
            uiText.setText(`รหัสลับคบเพลิงห้องถัดไปคือ: [ ${gameState.correctTorchOrder.join(" -> ")} ]`); 
            return; 
        }

        let id = obj.getData('id');
        gameState.statueAngles[id] = (gameState.statueAngles[id] + 90) % 360;
        obj.setAngle(gameState.statueAngles[id]);

        let isCorrect = gameState.statueAngles.every((angle, index) => angle === gameState.targetAngles[index]);
        if (isCorrect) {
            gameState.hasLighter = true;
            gameState.gatesOpened.statue = true;
            if(statueGate.getData('graphics')) statueGate.getData('graphics').destroy();
            statueGate.destroy(); 
            uiText.setText(`รูปปั้นชี้ทิศถูกต้องทั้งหมดแล้ว! ประตูห้อง 3 เปิดออก และคุณได้รับ "ไฟแช็กโบราณ"`);
        } else {
            uiText.setText(`หมุนรูปปั้นเรียบร้อย...`);
        }
    }

    if (type === 'torch') {
        if (!gameState.hasLighter) {
            uiText.setText("ห้องนี้มืดสนิทและคุณไม่มีอะไรจุดไฟเลย ลองไปแก้ปริศนาห้องรูปปั้นดูก่อนนะ");
            return;
        }
        let id = obj.getData('id');
        if (gameState.torchSequence.includes(id)) return;

        gameState.torchSequence.push(id);
        obj.setTexture('torch_on'); 

        let step = gameState.torchSequence.length - 1;
        if (gameState.torchSequence[step] !== gameState.correctTorchOrder[step]) {
            gameState.torchSequence = [];
            obj.scene.children.list.forEach(child => {
                if (child.getData && child.getData('type') === 'torch') child.setTexture('torch_off');
            });
            uiText.setText(`รหัสผิดพลาด! คบเพลิงดับลงทั้งหมด`);
        } else if (gameState.torchSequence.length === 4) {
            gameState.gatesOpened.torch = true;
            if(torchGate.getData('graphics')) torchGate.getData('graphics').destroy();
            torchGate.destroy(); 
            uiText.setText("รหัสถูกต้อง! ประตูห้องที่ 4 เปิดออกแล้ว!");
        } else {
            uiText.setText(`กำลังป้อนรหัสคบเพลิง... (${gameState.torchSequence.join(" -> ")})`);
        }
    }

    if (type === 'npc') {
        if (gameState.torchSequence.length < 4) {
            uiText.setText("NPC: ... (ลองแก้ปริศนาห้องคบเพลิงให้ผ่านก่อนนะ)");
        } else {
            if (!gameState.chestOpened) {
                uiText.setText("NPC: 'เดินไปเปิดหีบสมบัตินั่นเพื่อเอาของออกมาก่อน!'");
            } else {
                uiText.setText("NPC: 'ยอดเยี่ยม! ข้าจะร่ายมนต์เปิดประตูทางออกให้ ณ บัดนี้!'");
                gameState.cutsceneStage = 2;
            }
        }
    }

    if (type === 'chest') {
        if (gameState.torchSequence.length < 4) {
            uiText.setText("หีบสมบัติถูกลงอาคมเวทมนตร์ล็อกไว้");
        } else if (!gameState.chestOpened) {
            gameState.cutsceneStage = 1;
        }
    }
}

function triggerVictory(scene) {
    isGameOver = true;
    player.setVelocity(0, 0);
    player.play('idle');

    let overlay = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 1000, 600);
    overlay.setDepth(10);

    scene.add.text(500, 220, "🏆 VICTORY 🏆", { font: "bold 48px Arial", fill: "#ffd700" }).setOrigin(0.5).setDepth(11);
    scene.add.text(500, 300, "คุณได้หลบหนีออกจากเขาวงกตสำเร็จแล้ว!", { font: "24px Arial", fill: "#ffffff" }).setOrigin(0.5).setDepth(11);
    
    uiText.setText("ยินดีด้วยกับชัยชนะ!");
}

function update() {
    if (isGameOver) return;

    if (gameState.cutsceneStage === 1) {
        if (player.x < chest.x - 45) {
            player.setVelocityX(150); player.setVelocityY(0); player.setFlipX(false); player.play('walk', true);
        } else {
            player.setVelocityX(0); player.play('idle'); gameState.chestOpened = true;
            uiText.setText("🏆 เปิดหีบสำเร็จ! เดินกลับไปคุยกับ NPC เพื่อเปิดประตู");
            gameState.cutsceneStage = 0; 
        }
        return;
    }

    if (gameState.cutsceneStage === 2) {
        player.setVelocity(0); player.play('idle');
        if (npc.x < 930) {
            npc.x += 2.5;
        } else {
            exitGate.setTexture('door_open'); exitGate.body.enable = false;      
            uiText.setText("NPC: 'ประตูเปิดแล้ว! รีบหนีออกไปเร็ว!'");
            this.time.delayedCall(1000, () => { gameState.cutsceneStage = 3; });
        }
        return;
    }

    if (gameState.cutsceneStage === 3) {
        if (player.y > 375) {
            player.setVelocityX(50); player.setVelocityY(-150); player.setFlipX(false); player.play('walk', true);
        } else {
            player.setVelocityX(150); player.setVelocityY(0); player.setFlipX(false); player.play('walk', true);
            if (player.x >= 975) {
                player.setVelocityX(0); gameState.cutsceneStage = 0; triggerVictory(this);
            }
        }
        return;
    }

    const speed = 180;
    player.setVelocity(0);
    let moving = false;

    if (cursors.left.isDown || wasd.left.isDown) { player.setVelocityX(-speed); player.setFlipX(true); moving = true; }
    else if (cursors.right.isDown || wasd.right.isDown) { player.setVelocityX(speed); player.setFlipX(false); moving = true; }

    if (cursors.up.isDown || wasd.up.isDown) { player.setVelocityY(-speed); moving = true; }
    else if (cursors.down.isDown || wasd.down.isDown) { player.setVelocityY(speed); moving = true; }

    if (moving) { if (player.anims.currentAnim.key !== 'walk') player.play('walk'); }
    else { if (player.anims.currentAnim.key !== 'idle') player.play('idle'); }
}