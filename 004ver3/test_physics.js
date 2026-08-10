const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, 
            debug: false 
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let keyW;
let keyA;
let keyD;
let keyS;

// ตัวแปรสำหรับระบบพัซเซิล
let books;
let statues;
let torches; 
let popupText;
let popupBg;
let statueGate; 
let torchGate;  
let bossGate;   

let isBookSolved = false;
let isStatueSolved = false;
let isTorchSolved = false; 

// ตัวแปรห้องขวาล่าง (ปรับปรุงเป็นกลุ่มของหีบ)
let npc;
let chests; 
let exitDoor;
let exitDoorCollider; 
let openedChestsCount = 0; 
let isDoorOpened = false;

// ตัวแปรควบคุมระบบ Cutscene (เดินอัตโนมัติ)
let isCutsceneActive = false;
let cutsceneStep = 0; 
let targetX = 0;
let targetY = 0;

// ตัวแปรสำหรับนับจำนวนคลิกคุยกับ NPC
let npcClickCount = 0; 

// ตัวแปรควบคุมเวลาและการแสดงข้อความพิเศษ
let currentScene;
let dialogueTimer;
let isShowingImportantMessage = false; 

// ตัวแปรใหม่สำหรับฉากจบเกม
let endScreenBg;
let endScreenText;

function preload() {
    this.load.image('background_room', 'asset/roomm.png');
    this.load.image('book', 'asset/book.png'); 
    this.load.image('statue', 'asset/rubpun.png');
    this.load.image('torch', 'asset/kobfire.png');
    this.load.image('heep', 'asset/heep.png');         
    this.load.image('heepopen', 'asset/heepopen.png'); 
    this.load.image('npc', 'asset/npc.png');           
    
    // โหลดรูปภาพประตู
    this.load.image('door', 'asset/door.png');         
    this.load.image('opendoor', 'asset/open door.png'); 
    
    // โหลดตัวละครแบบเต็มตัว
    this.load.spritesheet('player', 'asset/AnimationSheet_Character.png', {
        frameWidth: 32,
        frameHeight: 32 
    });
}

function create() {
    currentScene = this; 

    // 1. ใส่ภาพพื้นหลังขนาด 800x600 ให้พอดีจอ
    let bg = this.add.image(400, 300, 'background_room');
    bg.setDisplaySize(800, 600);

    // 2. สร้างกลุ่มกำแพงแบบคงที่ (Static Group)
    const walls = this.physics.add.staticGroup();

    function addWall(x, y, width, height) {
        let wallX = x + (width / 2);
        let wallY = y + (height / 2);
        return walls.create(wallX, wallY).setSize(width, height).setVisible(false);
    }

    // === 3. พิกัดกล่องกั้นชนแผนที่ ===
    addWall(48, 20, 704, 25);         
    addWall(30, 41, 22, 514);         
    addWall(746, 41, 24, 534);        
    addWall(48, 569, 704, 30);        

    addWall(38, 286, 32, 76);         
    addWall(160, 286, 202, 76);       
    addWall(404, 286, 342, 76);       

    addWall(362, 45, 34, 52);         
    addWall(362, 192, 34, 56);        

    addWall(372, 270, 30, 185);       
    addWall(372, 552, 30, 48);        

    // === ระบบประตูกั้นทางผ่าน ===
    statueGate = this.physics.add.staticSprite(380, 145, null).setSize(34, 90).setVisible(false);
    this.physics.add.existing(statueGate, true);

    torchGate = this.physics.add.staticSprite(120, 304, null).setSize(80, 40).setVisible(false);
    this.physics.add.existing(torchGate, true);

    bossGate = this.physics.add.staticSprite(377, 500, null).setSize(34, 70).setVisible(false);
    this.physics.add.existing(bossGate, true);


    // === 4. สร้างสิ่งของในแต่ละห้อง ===
    
    // 4.1 ห้องซ้ายบน: สมุด 5 เล่ม
    books = this.physics.add.group();
    const bookData = [
        { x: 100, y: 90, text: "มีรอยฝุ่นเกาะหนาเตอะ... ไม่มีอะไรน่าสนใจ", isCorrect: false },
        { x: 200, y: 90, text: "คุณพบ 'กุญแจโบราณ' ซ่อนอยู่ข้างใน! ประตูห้องรูปปั้นเปิดออกแล้ว!", isCorrect: true }, 
        { x: 290, y: 90, text: "หนังสือบันทึกประวัติศาสตร์: 'รูปปั้นเหล่านี้เคารพต่อทิศทั้งสี่...'", isCorrect: false },
        { x: 100, y: 200, text: "ตำราอาหารโบราณ: 'สูตรต้มยำกุ้งพันปี...'", isCorrect: false },
        { x: 200, y: 200, text: "เป็นเพียงหน้ากระดาษที่ว่างเปล่า", isCorrect: false }
    ];

    bookData.forEach(data => {
        let b = books.create(data.x, data.y, 'book');
        b.setDisplaySize(48, 48);
        b.setData('popupText', data.text);
        b.setData('isCorrect', data.isCorrect);
        b.body.setSize(48, 48);
    });

    // 4.2 ห้องขวาบน: รูปปั้น 4 อัน
    statues = this.physics.add.group();
    const statuePositions = [
        { x: 550, y: 110, targetAngle: 90 },  
        { x: 650, y: 110, targetAngle: 180 }, 
        { x: 550, y: 190, targetAngle: 270 }, 
        { x: 650, y: 190, targetAngle: 0 }    
    ];

    statuePositions.forEach((pos, index) => {
        let s = statues.create(pos.x, pos.y, 'statue');
        s.setDisplaySize(40, 55);
        s.setInteractive(); 
        s.setData('targetAngle', pos.targetAngle);
        s.setData('currentAngle', 0); 
        s.body.setSize(40, 55);

        s.on('pointerdown', () => {
            if (isCutsceneActive) return; 
            let distance = Phaser.Math.Distance.Between(player.x, player.y, s.x, s.y);
            if (distance > 60) return; 

            if (!isBookSolved) {
                showDialogue("คุณยังผ่านเข้าห้องนี้ไม่ได้อย่างเป็นทางการ!");
                return;
            }
            if (isStatueSolved) return; 

            let nextAngle = (s.getData('currentAngle') + 90) % 360;
            s.setData('currentAngle', nextAngle);
            s.setAngle(nextAngle); 

            showDialogue(`รูปปั้นที่ ${index + 1} ถูกหมุนไปที่ ${nextAngle} องศา`);
            checkStatuePuzzle();
        });
    });

    // 4.3 ห้องซ้ายล่าง: คบเพลิง 4 อัน
    torches = this.physics.add.group();
    const torchPositions = [
        { x: 95, y: 415 },  
        { x: 285, y: 415 }, 
        { x: 95, y: 510 },  
        { x: 285, y: 510 }  
    ];

    torchPositions.forEach((pos, index) => {
        let t = torches.create(pos.x, pos.y, 'torch');
        t.setDisplaySize(24, 48);
        t.setInteractive();
        t.setData('lit', true); 
        t.body.setSize(24, 48);

        t.on('pointerdown', () => {
            if (isCutsceneActive) return;
            let distance = Phaser.Math.Distance.Between(player.x, player.y, t.x, t.y);
            if (distance > 60) return; 

            if (!isStatueSolved) {
                showDialogue("คุณยังไม่ควรมาดับไฟที่นี่ในตอนนี้...");
                return;
            }
            if (isTorchSolved) return; 

            let isLit = !t.getData('lit');
            t.setData('lit', isLit);

            if (isLit) {
                t.setAlpha(1.0); 
                showDialogue(`คุณจุดไฟคบเพลิงอันที่ ${index + 1}`);
            } else {
                t.setAlpha(0.4); 
                showDialogue(`คุณดับไฟคบเพลิงอันที่ ${index + 1} แล้ว`);
            }

            checkTorchPuzzle(); 
        });
    });

    // === 4.4 ห้องขวาล่าง: NPC, หีบสมบัติ 3 ใบ และประตูทางออก ===
    
    npc = this.physics.add.staticSprite(450, 400, 'npc'); 
    npc.setDisplaySize(40, 64);
    npc.setInteractive();
    npc.body.setSize(40, 64);

    chests = this.physics.add.staticGroup();
    const chestPositions = [
        { x: 480, y: 490, id: 1 },
        { x: 550, y: 490, id: 2 },
        { x: 620, y: 490, id: 3 }
    ];

    chestPositions.forEach(pos => {
        let c = chests.create(pos.x, pos.y, 'heep');
        c.setDisplaySize(50, 42);
        c.setInteractive();
        c.body.setSize(50, 42);
        c.setData('id', pos.id);
        c.setData('opened', false);

        c.on('pointerdown', () => {
            if (isCutsceneActive) return;
            let distance = Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y);
            if (distance > 60) return; 

            if (openedChestsCount < 3) {
                showDialogue("หีบเหล่านี้ถูกลงกลอนอย่างแน่นหนา... ลองไปคุยกับ NPC ดูก่อน!");
            } else {
                showDialogue("หีบสมบัติทั้งหมดถูกปลดล็อกแล้ว! รีบหนีออกไปเร็ว!");
            }
        });
    });

    // ประตูทางออกขวาสุดบานสุดท้าย
    exitDoor = this.physics.add.staticSprite(710, 490, 'door');
    exitDoor.setDisplaySize(60, 80);
    exitDoor.body.setSize(40, 80);

    // คุยกับ NPC
    npc.on('pointerdown', () => {
        if (isCutsceneActive) return;
        let distance = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
        if (distance > 60) return; 

        if (openedChestsCount < 3) {
            npcClickCount++;

            if (npcClickCount === 1) {
                showDialogue("NPC: 'โอ้! ผู้กล้า... เจ้าผ่านบททดสอบทั้งหมดมาได้จนถึงห้องนี้!'");
            } 
            else if (npcClickCount === 2) {
                showDialogue("NPC: 'วิหารโบราณหลังนี้กำลังจะถล่มลงมาแล้ว เจ้าไม่มีเวลาเหลือมากแล้วนะ!'");
            } 
            else if (npcClickCount === 3) {
                showTimedDialogue("NPC: 'ข้าจะใช้เวทมนตร์เพื่อปลดล็อกหีบสมบัติทั้ง 3 ใบนี้ให้เจ้า... ไปเก็บให้ครบแล้วรีบหนีไปซะ!'", 3500);
                
                isCutsceneActive = true; 
                cutsceneStep = 1; 
                npcClickCount = 0; 
            }
        }
    });

    // 5. สร้างตัวละครผู้เล่น
    player = this.physics.add.sprite(200, 150, 'player', 0).setScale(2);
    player.setBounce(0.1); 
    player.setCollideWorldBounds(true);

    player.setBodySize(32, 26); 
    player.setOffset(0, 6); 

    // 7. ระบบแอนิเมชัน
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });

    // 8. ผูกระบบตรวจจับการชน
    this.physics.add.collider(player, walls); 
    this.physics.add.collider(player, statueGate); 
    this.physics.add.collider(player, torchGate);  
    this.physics.add.collider(player, bossGate);   
    this.physics.add.collider(player, npc);
    this.physics.add.collider(player, chests); 

    exitDoorCollider = this.physics.add.collider(player, exitDoor);

    cursors = this.input.keyboard.createCursorKeys();
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // === 10. สร้างกล่องข้อความ UI ===
    popupBg = this.add.graphics();
    popupBg.fillStyle(0x000000, 0.8);
    popupBg.fillRect(100, 480, 600, 100);
    popupBg.lineStyle(3, 0xffffff, 1);
    popupBg.strokeRect(100, 480, 600, 100);
    popupBg.setVisible(false);

    // 🛠️ แก้ไข: ขยับแกน Y ลงมาที่ 512 (จากเดิม 500) และเพิ่ม padding ด้านบนและล่างเพื่อความสมมาตร
    popupText = this.add.text(120, 512, '', {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold', // เพิ่มความหนาให้อ่านง่ายขึ้น
        wordWrap: { width: 560, useAdvancedWrap: true },
        padding: { top: 4, bottom: 4 }
    });
    popupText.setVisible(false);

    // === 11. เตรียม UI หน้าจอฉากจบเกม (Victory Screen) ===
    endScreenBg = this.add.graphics();
    endScreenBg.fillStyle(0x000000, 0.9); 
    endScreenBg.fillRect(0, 0, 800, 600);
    endScreenBg.setVisible(false);
    endScreenBg.setDepth(100); 

    endScreenText = this.add.text(400, 300, '', {
        fontSize: '32px',
        fill: '#ffd700', 
        align: 'center',
        fontStyle: 'bold',
        wordWrap: { width: 700, useAdvancedWrap: true }
    });
    endScreenText.setOrigin(0.5); 
    endScreenText.setVisible(false);
    endScreenText.setDepth(101);
}

function update() {
    const speed = 160;

    // === ระบบ Cutscene เดินอัตโนมัติเปิดหีบ 3 ใบตามลำดับ ===
    if (isCutsceneActive) {
        let chest1 = chests.getChildren()[0];
        let chest2 = chests.getChildren()[1];
        let chest3 = chests.getChildren()[2];

        if (cutsceneStep === 1) {
            if (!isShowingImportantMessage) {
                cutsceneStep = 2; 
                targetX = chest1.x; 
                targetY = chest1.y - 45; 
            }
            player.setVelocity(0, 0);
            player.play('idle', true);
        } 
        else if (cutsceneStep === 2) {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

            if (distance > 5) {
                this.physics.moveTo(player, targetX, targetY, 120);
                player.play('walk', true);
                player.flipX = (player.body.velocity.x < 0);
            } else {
                player.setVelocity(0, 0);
                player.play('idle', true);
                
                chest1.setTexture('heepopen');
                openedChestsCount = 1;
                showTimedDialogue("เปิดหีบใบที่ 1 สำเร็จ! คุณพบชิ้นส่วนกุญแจส่วนที่ 1", 1200);

                cutsceneStep = 3;
                targetX = chest2.x;
                targetY = chest2.y - 45;
            }
        }
        else if (cutsceneStep === 3) {
            if (!isShowingImportantMessage) {
                cutsceneStep = 4;
            }
        }
        else if (cutsceneStep === 4) {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

            if (distance > 5) {
                this.physics.moveTo(player, targetX, targetY, 120);
                player.play('walk', true);
                player.flipX = (player.body.velocity.x < 0);
            } else {
                player.setVelocity(0, 0);
                player.play('idle', true);

                chest2.setTexture('heepopen');
                openedChestsCount = 2;
                showTimedDialogue("เปิดหีบใบที่ 2 สำเร็จ! คุณพบชิ้นส่วนกุญแจส่วนที่ 2", 1200);

                cutsceneStep = 5;
                targetX = chest3.x;
                targetY = chest3.y - 45;
            }
        }
        else if (cutsceneStep === 5) {
            if (!isShowingImportantMessage) {
                cutsceneStep = 6;
            }
        }
        else if (cutsceneStep === 6) {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

            if (distance > 5) {
                this.physics.moveTo(player, targetX, targetY, 120);
                player.play('walk', true);
                player.flipX = (player.body.velocity.x < 0);
            } else {
                player.setVelocity(0, 0);
                player.play('idle', true);

                chest3.setTexture('heepopen');
                openedChestsCount = 3;

                isDoorOpened = true;
                exitDoor.setTexture('opendoor');
                if (exitDoorCollider) {
                    exitDoorCollider.destroy(); 
                }

                showTimedDialogue("เปิดหีบใบสุดท้ายสำเร็จ! ประตูทางออกบานใหญ่เปิดออกแล้ว!", 1800);

                cutsceneStep = 7;
                targetX = exitDoor.x;
                targetY = exitDoor.y;
            }
        }
        else if (cutsceneStep === 7) {
            if (!isShowingImportantMessage) {
                cutsceneStep = 8;
            }
        }
        else if (cutsceneStep === 8) {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

            if (distance > 5) {
                this.physics.moveTo(player, targetX, targetY, 120);
                player.play('walk', true);
                player.flipX = (player.body.velocity.x < 0);

                if (distance < 40) {
                    player.setAlpha(distance / 40);
                }
            } else {
                player.setVelocity(0, 0);
                player.setVisible(false); 
                
                hideDialogue();
                showVictoryScreen(); 
                
                cutsceneStep = 9; 
            }
        }
        else if (cutsceneStep === 9) {
            player.setVelocity(0, 0);
        }
        return; 
    }

    // --- ควบคุมการเคลื่อนที่ปกติ ---
    if (cursors.right.isDown || keyD.isDown) {
        player.setVelocityX(speed);
        player.flipX = false;
    }
    else if (cursors.left.isDown || keyA.isDown) {
        player.setVelocityX(-speed);
        player.flipX = true;
    }
    else {
        player.setVelocityX(0);
    }

    if (cursors.down.isDown || keyS.isDown) {
        player.setVelocityY(speed);
    }
    else if (cursors.up.isDown || keyW.isDown) {
        player.setVelocityY(-speed);
    }
    else {
        player.setVelocityY(0);
    }

    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        player.play('walk', true); 
    } else {
        player.play('idle', true); 
    }

    // === ระบบตรวจจับสัมผัสรอบๆ เพื่อปิดข้อความอัตโนมัติ ===
    let isTouchingSomething = false;

    this.physics.overlap(player, books, (p, book) => {
        isTouchingSomething = true;
        readBook(p, book);
    });

    this.physics.overlap(player, statues, () => {
        isTouchingSomething = true;
    });

    this.physics.overlap(player, torches, () => {
        isTouchingSomething = true;
    });

    let distToNpc = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
    let distToDoor = Phaser.Math.Distance.Between(player.x, player.y, exitDoor.x, exitDoor.y);
    
    let distToChests = false;
    chests.children.iterate(c => {
        if (Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y) < 60) {
            distToChests = true;
        }
    });

    if (distToNpc < 60 || distToChests || distToDoor < 60) {
        isTouchingSomething = true;
    }

    if (!isTouchingSomething && popupText.visible && !isShowingImportantMessage) {
        hideDialogue();
    }
}

// ฟังก์ชันเปิดจอจบเกมขนาดใหญ่แบบสวยงาม
function showVictoryScreen() {
    endScreenBg.setVisible(true);
    endScreenText.setText(
        "🏆 VICTORY! 🏆\n\n" +
        "ยินดีด้วย! คุณเปิดหีบครบทั้ง 3 ใบ\n" +
        "และหลบหนีออกจากดันเจี้ยนได้สำเร็จ!\n\n" +
        "ขอบคุณที่เล่นเกมของเรา"
    );
    endScreenText.setVisible(true);
}

// ฟังก์ชันแสดงข้อความปกติ
function showDialogue(message) {
    popupBg.setVisible(true);
    popupText.setText(message);
    popupText.setVisible(true);
}

// ฟังก์ชันแสดงข้อความพิเศษ (กำหนดเวลาซ่อนได้)
function showTimedDialogue(message, duration = 3000) {
    isShowingImportantMessage = true; 
    showDialogue(message);
    
    if (dialogueTimer) {
        dialogueTimer.destroy();
    }
    
    dialogueTimer = currentScene.time.delayedCall(duration, () => {
        hideDialogue();
    }, [], currentScene);
}

function hideDialogue() {
    popupBg.setVisible(false);
    popupText.setVisible(false);
    popupText.setText('');
    isShowingImportantMessage = false; 
}

// ฟังก์ชันเปิดประตูห้องสมุด
function readBook(player, book) {
    let msg = book.getData('popupText');

    if (book.getData('isCorrect') && !isBookSolved) {
        isBookSolved = true;
        statueGate.destroy(); 
        showTimedDialogue(msg, 3000); 
    } else {
        showDialogue(msg);
    }
}

// ฟังก์ชันหมุนรูปปั้น
function checkStatuePuzzle() {
    let correctCount = 0;
    
    statues.children.iterate(s => {
        if (s.getData('currentAngle') === s.getData('targetAngle')) {
            correctCount++;
        }
    });

    if (correctCount === 4 && !isStatueSolved) {
        isStatueSolved = true;
        torchGate.destroy(); 
        showTimedDialogue("กลไกส่งเสียงครืนนน... ประตูทางลงห้องคบเพลิงถูกเปิดออกแล้ว!", 3000); 
    }
}

// ฟังก์ชันสลับคบเพลิง
function checkTorchPuzzle() {
    let activeTorches = 0;

    torches.children.iterate(t => {
        if (t.getData('lit') === true) {
            activeTorches++;
        }
    });

    if (activeTorches === 0 && !isTorchSolved) {
        isTorchSolved = true;
        bossGate.destroy(); 
        showTimedDialogue("ประตูลับเปิดออกแล้ว! ทางไปห้องขวาด้านล่างเปิดออกแล้ว!", 3000); 
    }
}