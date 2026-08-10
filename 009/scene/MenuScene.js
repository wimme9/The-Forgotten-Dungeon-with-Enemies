export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    create() {
        // --- 1. พื้นหลังกำแพงดันเจี้ยน ---
        // สีพื้นหลังโทนน้ำตาลเทาเข้ม สไตล์ห้องมืด
        this.cameras.main.setBackgroundColor('#1c1917');

        // วาดลายเส้นตารางจางๆ เพื่อจำลองร่องของกำแพงอิฐ
        const grid = this.add.graphics();
        grid.lineStyle(2, 0x000000, 0.4);
        for (let i = 0; i <= 800; i += 64) { // เส้นแนวตั้ง
            grid.moveTo(i, 0);
            grid.lineTo(i, 600);
        }
        for (let j = 0; j <= 600; j += 64) { // เส้นแนวนอน
            grid.moveTo(0, j);
            grid.lineTo(800, j);
        }

        // --- 2. เอฟเฟกต์คบเพลิง (Fire Particles) ซ้าย-ขวา ---
        // เรียกใช้ฟังก์ชันด้านล่างเพื่อสร้างไฟประดับฉาก
        this.createTorch(150, 160);
        this.createTorch(650, 160);

        // --- 3. ป้ายชื่อเกม (สไตล์แผ่นหิน) ---
        // กรอบนอกสีเทาเข้ม ขอบดำหนา
        const titleBg = this.add.rectangle(400, 150, 560, 130, 0x2d2a26, 1)
            .setStrokeStyle(6, 0x000000, 1);
        
        // กรอบในช่วยเพิ่มมิติ
        const titleInner = this.add.rectangle(400, 150, 540, 110, 0x1f1c19, 1)
            .setStrokeStyle(2, 0x3e3a35, 1);

        // ข้อความชื่อเกม สีทอง สไตล์ RPG
        const title = this.add.text(400, 135, 'FORGOTTEN DUNGEON', {
            fontFamily: '"Courier New", Courier, monospace', // ฟอนต์ทรงเหลี่ยมเข้ากับเกม
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#fbbf24', // สีทอง
            stroke: '#451a03', // ขอบสีน้ำตาลเข้ม
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // ข้อความอธิบาย
        const subText = this.add.text(400, 185, 'Escape the cave before time runs out', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#d6d3d1',
            fontStyle: 'italic',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 4. ปุ่ม START (สไตล์แท่นหิน) ---
        const startBtnBg = this.add.rectangle(400, 320, 240, 70, 0x3f3f46, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const startText = this.add.text(400, 320, 'START', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 5. ปุ่ม HOW TO PLAY ---
        const infoBtnBg = this.add.rectangle(400, 420, 240, 60, 0x27272a, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const infoText = this.add.text(400, 420, 'HOW TO PLAY', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#a1a1aa',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 6. ระบบ Hover และ 클릭ของปุ่ม ---
        startBtnBg.on('pointerover', () => {
            startBtnBg.setFillStyle(0x52525b, 1); // หินสีสว่างขึ้น
            startText.setColor('#fcd34d'); // ตัวหนังสือเปลี่ยนเป็นสีทองสว่าง
        });
        startBtnBg.on('pointerout', () => {
            startBtnBg.setFillStyle(0x3f3f46, 1);
            startText.setColor('#ffffff');
        });
        startBtnBg.on('pointerdown', () => {
            this.scene.start('GameplayScene');
        });

        infoBtnBg.on('pointerover', () => {
            infoBtnBg.setFillStyle(0x3f3f46, 1);
            infoText.setColor('#ffffff');
        });
        infoBtnBg.on('pointerout', () => {
            infoBtnBg.setFillStyle(0x27272a, 1);
            infoText.setColor('#a1a1aa');
        });
        infoBtnBg.on('pointerdown', () => {
            this.scene.launch('InfoScene');
        });

        // --- 7. แอนิเมชันลอยตัวเบาๆ ให้ป้ายชื่อ ---
        this.tweens.add({
            targets: [titleBg, titleInner, title, subText],
            y: '+=5',
            duration: 2500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    // --- Helper Function: สร้างเอฟเฟกต์คบเพลิงแบบไม่ต้องใช้รูปภาพ ---
    createTorch(x, y) {
        // วาดด้ามคบเพลิงจำลอง
        this.add.rectangle(x, y + 25, 12, 50, 0x451a03).setStrokeStyle(2, 0x000000).setDepth(0);
        
        // วาดถ้วยเหล็กใส่ไฟ
        this.add.rectangle(x, y + 5, 24, 12, 0x1c1917).setStrokeStyle(2, 0x000000).setDepth(0);

        // สร้างสะเก็ดไฟ 25 ดวง ลอยขึ้นแล้วจางหาย
        for (let i = 0; i < 25; i++) {
            const fireParticle = this.add.circle(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-5, 5),
                Phaser.Math.Between(4, 9),
                Phaser.Math.RND.pick([0xf97316, 0xef4444, 0xfacc15, 0xea580c]), // สุ่มสี แดง, ส้ม, เหลือง
                0.85
            ).setDepth(1);

            this.tweens.add({
                targets: fireParticle,
                x: fireParticle.x + Phaser.Math.Between(-15, 15),
                y: y - Phaser.Math.Between(40, 90), // ลอยขึ้นด้านบน
                alpha: 0, // ค่อยๆ จางหาย
                scale: 0.2, // เล็กลงเรื่อยๆ
                duration: Phaser.Math.Between(800, 1400), // ความเร็วของเปลวไฟ
                ease: 'Power1',
                repeat: -1,
                delay: Phaser.Math.Between(0, 800)
            });
        }
    }
}