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
let isGameOver = false;

const gameState = {
    hasSpell: false,
    hasLighter: false,
    correctBookId: 1, 
    bookTitles: ["น้ำ", "ไฟ", "ลม", "ดิน", "ไม้"],
    statueAngles: [90, 180, 270, 90], 
    targetAngles: [0, 180, 90, 270], // ปรับมุมเป้าหมาย: 0 (ขึ้น), 180 (ลง), 90 (ขวา), 270 (ซ้าย)
    torchSequence: [],
    correctTorchOrder: [],
    chestOpened: false,
    
    // --- ระบบควบคุม Stage ของคัตซีน ---
    // 0 = ปกติ, 1 = ตัวละครเดินไปหาหีบเอง, 2 = NPC เดินไปเปิดประตู, 3 = ตัวละครเดินออกประตู
    cutsceneStage: 0, 
    
    gatesOpened: {
        library: false,
        statue: false,
        torch: false,
        exit: false
    }
};

function preload() {
    this.load.spritesheet('character', 'Character_image/t.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('book_img', 'map/5089832694e75c73988b8a3dd19b4855-removebg-preview.png');         
    this.load.image('statue_img', 'map/7d61c571dfac6e1a32f0672e85c842eb-removebg-preview.png');     
    this.load.image('torch_off', 'map/Screenshot_2026-07-17_124740-removebg-preview.png');   
    this.load.image('torch_on', 'map/Screenshot_2026-07-17_124657-removebg-preview.png');     
    this.load.image('npc_img', 'map/f882d67d80d2c8e9549fa31ff7a7286b-removebg-preview.png');           
    this.load.image('chest_img', 'map/445a278c0bf0fee40c5963899289126e-removebg-preview.png');       
    
    // รูปภาพประตูแยกไฟล์ของคุณ
    this.load.image('door_closed', 'map/Screenshot_2026-07-17_130415-removebg-preview.png'); 
    this.load.image('door_open', 'map/Screenshot_2026-07-17_130421-removebg-preview.png');     
}

function create() {
    const bgGraphics = this.add.graphics();

    // วาดพื้นหลังห้องต่าง ๆ
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
    const interactables = this.physics.add.staticGroup();
    const gates = this.physics.add.staticGroup();

    // สุ่มลำดับการกดคบไฟของห้องที่ 3
    let numbers = [1, 2, 3, 4];
    gameState.correctTorchOrder = numbers.sort(() => Math.random() - 0.5);

    const buildWall = (x, y, w, h) => {
        let g = this.add.graphics().fillStyle(0x1a1a1a, 1).fillRect(x, y, w, h);
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

    // 🎨 ฟังก์ชันช่วยวาดดีไซน์ประตูลายไม้สีน้ำตาลเข้ม พร้อมขอบเหล็กสีเทาให้เห็นได้เด่นชัดและดูเข้าธีม
    const drawDoorGraphics = (scene, x, y, w, h) => {
        let g = scene.add.graphics();
        // พื้นบานประตูสีน้ำตาลไม้เข้ม
        g.fillStyle(0x5a2d0c, 1).fillRect(x, y, w, h);
        // ลายเส้นไม้แนวตั้ง
        g.lineStyle(2, 0x3d1f08, 1);
        if (w > h) {
            // ประตูแนวนอน (ห้อง 2)
            g.lineBetween(x, y + h/2, x + w, y + h/2);
            // ขอบเหล็กปิดหัวท้าย
            g.fillStyle(0x7f8c8d, 1).fillRect(x, y, 6, h);
            g.fillStyle(0x7f8c8d, 1).fillRect(x + w - 6, y, 6, h);
        } else {
            // ประตูแนวตั้ง (ห้อง 1 และ 3)
            g.lineBetween(x + w/2, y, x + w/2, y + h);
            // ขอบเหล็กปิดหัวท้าย
            g.fillStyle(0x7f8c8d, 1).fillRect(x, y, w, 6);
            g.fillStyle(0x7f8c8d, 1).fillRect(x, y + h - 6, w, 6);
        }
        return g;
    };

    // --- ประตูห้องที่ 1 (Library Gate) ---
    let libraryGate = gates.create(500, 120, null).setDisplaySize(20, 100).setData('name', 'library');
    let libGateColor = drawDoorGraphics(this, 490, 70, 20, 100);
    libraryGate.setData('graphics', libGateColor);

    // --- ประตูห้องที่ 2 (Statue Gate) ---
    let statueGate = gates.create(170, 300, null).setDisplaySize(100, 20).setData('name', 'statue');
    let statueGateColor = drawDoorGraphics(this, 120, 290, 100, 20);
    statueGate.setData('graphics', statueGateColor);

    // --- ประตูห้องที่ 3 (Torch Gate) ---
    let torchGate = gates.create(500, 490, null).setDisplaySize(20, 100).setData('name', 'torch');
    let torchGateColor = drawDoorGraphics(this, 490, 440, 20, 100);
    torchGate.setData('graphics', torchGateColor);

    exitGate = this.physics.add.image(965, 370, 'door_closed');
    exitGate.setDisplaySize(40, 80);
    exitGate.body.setImmovable(true);
    gates.add(exitGate); 

    // --- ROOM 1: THE LIBRARY ---
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

    // --- ROOM 2: STATUE ROOM ---
    this.add.text(540, 30, "ห้องที่ 2: ห้องรูปปั้น", { font: "16px Arial", fill: "#ffcc88" });
    for (let i = 0; i < 4; i++) {
        let statue = this.add.image(580 + (i * 100), 120, 'statue_img').setInteractive();
        statue.setDisplaySize(45, 45);
        this.physics.add.existing(statue, true);
        statue.setData('type', 'statue').setData('id', i);
        statue.setAngle(gameState.statueAngles[i]);
        interactables.add(statue);
    }

    // --- ROOM 3: TORCH ROOM ---
    this.add.text(40, 330, "ห้องที่ 3: ห้องคบเพลิง", { font: "16px Arial", fill: "#ff8888" });
    for (let i = 0; i < 4; i++) {
        let torch = this.add.image(90 + (i * 90), 450, 'torch_off').setInteractive();
        torch.setDisplaySize(40, 55);
        this.physics.add.existing(torch, true);
        torch.setData('type', 'torch').setData('id', i + 1);
        interactables.add(torch);
        this.add.text(85 + (i * 90), 485, `${i+1}`, { font: "12px Arial", fill: "#ffffff" });
    }

    // --- ROOM 4: NPC & CHEST ROOM ---
    this.add.text(540, 318, "ห้องที่ 4: ห้องสมบัติ & NPC", { font: "16px Arial", fill: "#88ff88" });
    
    // สร้าง NPC
    npc = interactables.create(700, 450, 'npc_img');
    npc.setDisplaySize(40, 40).setInteractive();
    npc.refreshBody();
    npc.setData('type', 'npc');
    this.add.text(685, 475, "NPC", { font: "12px Arial", fill: "#ffffff" });

    // สร้าง Chest
    chest = interactables.create(850, 450, 'chest_img');
    chest.setDisplaySize(50, 45).setInteractive();
    chest.refreshBody();
    chest.setData('type', 'chest');

    // --- PLAYER INITIALIZATION ---
    player = this.physics.add.sprite(60, 180, 'character', 0).setScale(1.5).setCollideWorldBounds(true);
    player.setDepth(2); 
    this.physics.add.collider(player, walls);
    
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
        
        // หากเคยหมุนผ่านไปแล้ว ให้แสดงรหัสลับห้องคบเพลิงซ้ำเพื่อกันลืม
        if (gameState.hasLighter) { 
            uiText.setText(`รหัสลับคบเพลิงห้องถัดไปคือ: [ ${gameState.correctTorchOrder.join(" -> ")} ]`); 
            return; 
        }

        let id = obj.getData('id');
        gameState.statueAngles[id] = (gameState.statueAngles[id] + 90) % 360;
        obj.setAngle(gameState.statueAngles[id]);

        // แปลงค่ามุมปัจจุบันให้อ่านเข้าใจง่าย
        let currentDir = "";
        if (gameState.statueAngles[id] === 0) currentDir = "ขึ้น (↑)";
        else if (gameState.statueAngles[id] === 90) currentDir = "ขวา (→)";
        else if (gameState.statueAngles[id] === 180) currentDir = "ลง (↓)";
        else if (gameState.statueAngles[id] === 270) currentDir = "ซ้าย (←)";

        // เพิ่มคำอธิบายเป้าหมายชัดเจน: 1 ขึ้น, 2 ลง, 3 ขวา, 4 ซ้าย
        let targetDir = "";
        if (id === 0) targetDir = "ขึ้น (↑)";
        else if (id === 1) targetDir = "ลง (↓)";
        else if (id === 2) targetDir = "ขวา (→)";
        else if (id === 3) targetDir = "ซ้าย (←)";

        let isCorrect = gameState.statueAngles.every((angle, index) => angle === gameState.targetAngles[index]);
        if (isCorrect) {
            gameState.hasLighter = true;
            gameState.gatesOpened.statue = true;
            if(statueGate.getData('graphics')) statueGate.getData('graphics').destroy();
            statueGate.destroy(); 
            
            // แสดงรหัสผ่านห้องที่ 3 ทันทีเมื่อแก้ปริศนาเสร็จ
            uiText.setText(`รูปปั้นชี้ทิศถูกต้องทั้งหมดแล้ว! ประตูห้อง 3 เปิดออก และคุณได้รับ "ไฟแช็กโบราณ" พร้อมรหัสลับคบเพลิง: [ ${gameState.correctTorchOrder.join(" -> ")} ]`);
        } else {
            uiText.setText(`รูปปั้นที่ ${id + 1} (เป้าหมาย: ${targetDir}) -> ปัจจุบัน: ${currentDir}`);
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
            uiText.setText(`รหัสผิดพลาด! คบเพลิงดับลงทั้งหมด รหัสที่ถูกต้องคือ: [ ${gameState.correctTorchOrder.join(" -> ")} ]`);
        } else if (gameState.torchSequence.length === 4) {
            gameState.gatesOpened.torch = true;
            if(torchGate.getData('graphics')) torchGate.getData('graphics').destroy();
            torchGate.destroy(); 
            uiText.setText("รหัสถูกต้อง! ประตูห้องที่ 4 เปิดออกแล้ว ลองเข้าไปคุยกับ NPC ดูสิ!");
        } else {
            uiText.setText(`กำลังป้อนรหัสคบเพลิง... (ลำดับที่กดไปแล้ว: ${gameState.torchSequence.join(" -> ")})`);
        }
    }

    if (type === 'npc') {
        if (gameState.torchSequence.length < 4) {
            uiText.setText("NPC: ... (เขาดูเหมือนยังไม่สนใจคุณ ลองแก้ปริศนาห้องคบเพลิงให้ผ่านก่อนนะ)");
            return; 
        } else {
            if (!gameState.chestOpened) {
                uiText.setText("NPC: 'ยินดีต้อนรับผู้กล้า! ประตูหนีออกอยู่ขวาโน่น แต่มันล็อกอยู่ เดินไปเปิดหีบสมบัตินั่นเพื่อเอาของออกมาก่อน!'");
            } else {
                uiText.setText("NPC: 'ยอดเยี่ยม! สมบัติโบราณเปิดแล้ว ข้าจะร่ายมนต์เปิดประตูทางออกให้ ณ บัดนี้!'");
                gameState.cutsceneStage = 2; // สั่งให้ NPC เดินไปเปิดประตูทางออก
            }
        }
    }

    if (type === 'chest') {
        if (gameState.torchSequence.length < 4) {
            uiText.setText("หีบสมบัติถูกลงอาคมเวทมนตร์ล็อกไว้");
            return;
        }
        
        if (!gameState.chestOpened) {
            gameState.cutsceneStage = 1; // เริ่มคัตซีนบังคับตัวละครเดินไปเปิดหีบเองอัตโนมัติ
        } else {
            uiText.setText("หีบสมบัติถูกเปิดออกเรียบร้อยแล้ว รีบกลับไปคุยกับ NPC เพื่อเปิดประตู");
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
    
    // ฉากขอบคุณหลังจบตามบรีฟ
    scene.add.text(500, 380, "💖 ขอบคุณที่ร่วมสนุกและเล่นเกมของเรา 💖", { font: "italic 20px Arial", fill: "#ff88aa" }).setOrigin(0.5).setDepth(11);
    
    uiText.setText("ยินดีด้วยกับชัยชนะ! ขอบคุณที่เล่นเกมของเรานะครับ");
}

function update() {
    if (isGameOver) return;

    // คัตซีนสเตจ 1: ตัวละครเดินไปเปิดหีบอัตโนมัติ
    if (gameState.cutsceneStage === 1) {
        if (player.x < chest.x - 45) {
            player.setVelocityX(150);
            player.setVelocityY(0);
            player.setFlipX(false);
            player.play('walk', true);
            uiText.setText("ตัวละครของคุณกำลังเดินไปเปิดหีบสมบัติเอง...");
        } else {
            player.setVelocityX(0);
            player.play('idle');
            gameState.chestOpened = true;
            uiText.setText("🏆 คุณเปิดหีบสำเร็จแล้ว! ลองเดินกลับไปคุยกับ NPC อีกครั้งเพื่อเปิดประตูทางออก");
            
            // คืนค่าให้ผู้เล่นสามารถบังคับตัวเดินกลับมาคุยกับ NPC ได้เอง
            gameState.cutsceneStage = 0; 
        }
        return;
    }

    // คัตซีนสเตจ 2: NPC เดินไปเปิดประตูทางออก
    if (gameState.cutsceneStage === 2) {
        player.setVelocity(0);
        player.play('idle');
        
        if (npc.x < 930) {
            npc.x += 2.5;
            uiText.setText("NPC กำลังเดินไปคลายผนึกประตูทางออก...");
        } else {
            exitGate.setTexture('door_open'); 
            exitGate.body.enable = false;      
            uiText.setText("NPC: 'ประตูเปิดแล้ว! รีบหนีออกไปเร็วผู้กล้า!'");
            
            this.time.delayedCall(1000, () => {
                gameState.cutsceneStage = 3; // ส่งสเตจให้ตัวละครเดินออกจากแผนที่
            });
        }
        return;
    }

    // คัตซีนสเตจ 3: ขยับตัวละครขึ้นไปหาความสูงของประตูก่อน (Y = 370) แล้วค่อยเดินออกทางขวา
    if (gameState.cutsceneStage === 3) {
        // 1. ตรวจสอบว่าความสูง (Y) ตรงกับระดับของประตูหรือยัง (ระดับประตูคือประมาณ 370)
        if (player.y > 375) {
            player.setVelocityX(50);  // เดินเยื้องไปข้างหน้าเล็กน้อย
            player.setVelocityY(-150); // เดินขึ้นด้านบนเพื่อเลี่ยงการติดมุมกำแพง
            player.setFlipX(false);
            player.play('walk', true);
            uiText.setText("ตัวละครของคุณกำลังเดินขึ้นไปที่ประตูทางออก...");
        } 
        // 2. เมื่ออยู่ในระดับเดียวกับประตูแล้ว ให้เดินตรงออกไปทางขวาทันทีแบบไม่ติดขัด
        else {
            player.setVelocityX(150);
            player.setVelocityY(0);
            player.setFlipX(false);
            player.play('walk', true);
            uiText.setText("ตัวละครของคุณกำลังเดินผ่านประตูออกจากเขาวงกต...");
            
            if (player.x >= 975) {
                player.setVelocityX(0);
                gameState.cutsceneStage = 0;
                triggerVictory(this);
            }
        }
        return;
    }

    // --- ส่วนควบคุมตัวละครปกติ ---
    const speed = 180;
    player.setVelocity(0);
    let moving = false;

    if (cursors.left.isDown || wasd.left.isDown) {
        player.setVelocityX(-speed); player.setFlipX(true); moving = true;
    } else if (cursors.right.isDown || wasd.right.isDown) {
        player.setVelocityX(speed); player.setFlipX(false); moving = true;
    }

    if (cursors.up.isDown || wasd.up.isDown) {
        player.setVelocityY(-speed); moving = true;
    } else if (cursors.down.isDown || wasd.down.isDown) {
        player.setVelocityY(speed); moving = true;
    }

    if (moving) {
        if (player.anims.currentAnim.key !== 'walk') player.play('walk');
    } else {
        if (player.anims.currentAnim.key !== 'idle') player.play('idle');
    }
}