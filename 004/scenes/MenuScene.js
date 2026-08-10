export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // โหลด Asset รูปภาพตกแต่งที่มีอยู่ในโปรเจกต์
        this.load.image('dungeon_tiles', 'asset/Dungeon Tile Set.png');
        this.load.image('book', 'asset/book.png');
        this.load.image('statue', 'asset/rubpun.png');
        this.load.image('torch', 'asset/kobfire.png');
        this.load.image('heep', 'asset/heep.png');

        // โหลด Spritesheet ตัวละครสำหรับแสดงท่าทาง Idle
        this.load.spritesheet('player', 'asset/AnimationSheet_Character.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // โหลดเสียงคลิกปุ่ม
        this.load.audio('correct', 'asset/correct_answer.mp3');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // === 1. ตกแต่งพื้นหลังด้วย Graphics (ไม่ใช้ไฟล์ภาพภายนอก) ===
        const bgGraphics = this.add.graphics();
        
        // พื้นหลังไล่เฉดสีเข้ม
        bgGraphics.fillGradientStyle(0x0f0c1b, 0x0f0c1b, 0x1f1a3a, 0x1f1a3a, 1);
        bgGraphics.fillRect(0, 0, width, height);

        // เส้นตารางสไตล์ดันเจี้ยน
        bgGraphics.lineStyle(1, 0xffffff, 0.05);
        for (let x = 0; x < width; x += 40) {
            bgGraphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 40) {
            bgGraphics.lineBetween(0, y, width, y);
        }

        // กรอบขอบหน้าจอสีทอง
        bgGraphics.lineStyle(4, 0xd4af37, 0.8);
        bgGraphics.strokeRect(10, 10, width - 20, height - 20);

        // === 2. นำ Asset รูปภาพในโปรเจกต์มาจัดวางตกแต่ง ===
        
        // คบเพลิงซ้าย-ขวา พร้อมเอฟเฟกต์ไฟกะพริบ
        const leftTorch = this.add.image(width * 0.2, height * 0.35, 'torch').setDisplaySize(45, 87);
        const rightTorch = this.add.image(width * 0.8, height * 0.35, 'torch').setDisplaySize(45, 87);

        this.tweens.add({
            targets: [leftTorch, rightTorch],
            alpha: { from: 0.7, to: 1 },
            duration: 250,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // รูปปั้นซ้าย-ขวา
        this.add.image(width * 0.15, height * 0.68, 'statue').setDisplaySize(80, 115).setAlpha(0.85);
        this.add.image(width * 0.85, height * 0.68, 'statue').setDisplaySize(80, 115).setAlpha(0.85).setFlipX(true);

        // หีบสมบัติและสมุด
        this.add.image(width * 0.25, height * 0.78, 'heep').setDisplaySize(65, 55);
        this.add.image(width * 0.75, height * 0.78, 'book').setDisplaySize(55, 55);

        // ตัวละครยืนตรงกลางแบบเล่น animation Idle
        if (!this.anims.exists('menu_idle')) {
            this.anims.create({
                key: 'menu_idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1
            });
        }
        const playerSprite = this.add.sprite(width / 2, height * 0.55, 'player').setScale(3.5);
        playerSprite.play('menu_idle');

        // === 3. ข้อความหัวข้อหน้าเมนู (MAIN MENU) ===
        // เงาหลัง
        this.add.text(width / 2 + 3, height * 0.22 + 3, 'MAIN MENU', {
            fontSize: '52px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ข้อความหลักสีทอง
        const titleText = this.add.text(width / 2, height * 0.22, 'MAIN MENU', {
            fontSize: '52px',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#5c3d11',
            strokeThickness: 6
        }).setOrigin(0.5);

        // แอนิเมชันชื่อเกมลอยขึ้น-ลง
        this.tweens.add({
            targets: titleText,
            y: height * 0.21,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // === 4. ปุ่ม START GAME พร้อมระบบ Interactive & Animation ===
        const btnX = width / 2;
        const btnY = height * 0.75;
        const btnWidth = 260;
        const btnHeight = 60;

        // วาดรูปทรงพื้นหลังปุ่ม
        const buttonBg = this.add.graphics();
        this.drawButton(buttonBg, btnX, btnY, btnWidth, btnHeight, 0x2b1e3a, 0xffd700);

        // ข้อความบนปุ่ม
        const playButtonText = this.add.text(btnX, btnY, 'START GAME', {
            fontSize: '28px',
            fill: '#00ff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // โซนรับการคลิก
        const buttonZone = this.add.zone(btnX, btnY, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true });

        // Hover Effect
        buttonZone.on('pointerover', () => {
            this.drawButton(buttonBg, btnX, btnY, btnWidth, btnHeight, 0x4a3266, 0x00ff66);
            playButtonText.setStyle({ fill: '#ffffff' });
            playButtonText.setScale(1.08);
        });

        buttonZone.on('pointerout', () => {
            this.drawButton(buttonBg, btnX, btnY, btnWidth, btnHeight, 0x2b1e3a, 0xffd700);
            playButtonText.setStyle({ fill: '#00ff66' });
            playButtonText.setScale(1.0);
        });

        // Click Event (สลับไปยัง GameplayScene)
        buttonZone.on('pointerdown', () => {
            if (this.sound.get('correct')) {
                this.sound.play('correct', { volume: 0.5 });
            }

            this.tweens.add({
                targets: playButtonText,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 80,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('GameplayScene');
                }
            });
        });
    }

    // ฟังก์ชันช่วยวาดดีไซน์ปุ่มกด
    drawButton(graphics, x, y, width, height, bgColor, borderColor) {
        graphics.clear();

        // เงาปุ่ม
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRoundedRect(x - width / 2 + 3, y - height / 2 + 3, width, height, 10);

        // พื้นหลังปุ่ม
        graphics.fillStyle(bgColor, 1);
        graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);

        // กรอบปุ่ม
        graphics.lineStyle(3, borderColor, 1);
        graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    }
}