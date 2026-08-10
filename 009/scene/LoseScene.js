export default class LoseScene extends Phaser.Scene {
    constructor() {
        super("LoseScene");
    }

    create() {
        // --- 1. พื้นหลังกึ่งโปร่งใส ---
        // ใช้ฟิล์มสีดำทึบขึ้นเล็กน้อย (0.9) เพื่อให้ฉากหลังดูมืดมนลง
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);

        // --- 2. เอฟเฟกต์เถ้าถ่านร่วงหล่น (Falling Red Embers) ---
        for (let i = 0; i < 35; i++) {
            const ember = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(-50, 500), // ให้เริ่มร่วงจากด้านบน
                Phaser.Math.Between(2, 4),
                Phaser.Math.RND.pick([0xef4444, 0xdc2626, 0x991b1b]), // โทนสีแดง/แดงเลือดหมู
                Phaser.Math.FloatBetween(0.4, 0.8)
            ).setDepth(0);

            this.tweens.add({
                targets: ember,
                y: ember.y + Phaser.Math.Between(150, 400), // ร่วงลงล่าง
                x: ember.x + Phaser.Math.Between(-30, 30), // ลอยส่ายไปมาเล็กน้อย
                alpha: 0,
                duration: Phaser.Math.Between(2500, 5000),
                ease: 'Sine.easeOut',
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }

        // --- 3. กรอบหน้าต่าง (สไตล์แผ่นหิน) ---
        // กรอบนอก
        const panelOuter = this.add.rectangle(400, 300, 640, 420, 0x2d2a26, 1)
            .setStrokeStyle(6, 0x000000, 1);
        // กรอบใน
        const panelInner = this.add.rectangle(400, 300, 610, 390, 0x1f1c19, 1)
            .setStrokeStyle(2, 0x3e3a35, 1);

        // --- 4. ประดับคบเพลิงซ้าย-ขวา ---
        this.createTorch(140, 150);
        this.createTorch(660, 150);

        // --- 5. หัวข้อ GAME OVER (สีแดงเข้ม) ---
        const title = this.add.text(400, 160, 'GAME OVER', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '60px',
            fontStyle: 'bold',
            color: '#ef4444', // สีแดง
            stroke: '#450a0a', // ขอบแดงเข้มจัดเกือบดำ
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // ข้อความอธิบาย
        const subText = this.add.text(400, 230, 'เวลาหมดแล้ว คุณถูกทิ้งไว้ในถ้ำ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#a8a29e', // สีเทาหม่น
            align: 'center',
            wordWrap: { width: 520 },
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 6. ปุ่ม TRY AGAIN (สไตล์แท่นหิน) ---
        const retryBtnBg = this.add.rectangle(400, 320, 300, 65, 0x3f3f46, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const retryText = this.add.text(400, 320, 'TRY AGAIN', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 7. ปุ่ม BACK TO MENU ---
        const menuBtnBg = this.add.rectangle(400, 400, 300, 55, 0x27272a, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const menuText = this.add.text(400, 400, 'BACK TO MENU', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#a1a1aa',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 8. ระบบ Hover และ คลิกของปุ่ม ---
        
        // Try Again Button
        retryBtnBg.on('pointerover', () => {
            retryBtnBg.setFillStyle(0x52525b, 1);
            retryText.setColor('#ef4444'); // โฮเวอร์แล้วตัวอักษรเป็นสีแดง
        });
        retryBtnBg.on('pointerout', () => {
            retryBtnBg.setFillStyle(0x3f3f46, 1);
            retryText.setColor('#ffffff');
        });
        retryBtnBg.on('pointerdown', () => {
            this.scene.stop('LoseScene');
            this.scene.start('GameplayScene');
        });

        // Menu Button
        menuBtnBg.on('pointerover', () => {
            menuBtnBg.setFillStyle(0x3f3f46, 1);
            menuText.setColor('#ffffff');
        });
        menuBtnBg.on('pointerout', () => {
            menuBtnBg.setFillStyle(0x27272a, 1);
            menuText.setColor('#a1a1aa');
        });
        menuBtnBg.on('pointerdown', () => {
            this.scene.stop('LoseScene');
            this.scene.start('MenuScene');
        });

        // --- 9. แอนิเมชันตอนเปิดหน้าจอ (Popup Effect) ---
        const uiGroup = [panelOuter, panelInner, title, subText, retryBtnBg, retryText, menuBtnBg, menuText];
        this.tweens.add({
            targets: uiGroup,
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            ease: 'Back.easeOut', // เด้งดึ๋งเล็กน้อยเหมือนหน้าอื่นๆ
            duration: 400
        });
    }

    // --- Helper Function: สร้างเอฟเฟกต์คบเพลิง ---
    createTorch(x, y) {
        // ด้ามและถ้วยไฟ
        this.add.rectangle(x, y + 25, 12, 50, 0x451a03).setStrokeStyle(2, 0x000000).setDepth(0);
        this.add.rectangle(x, y + 5, 24, 12, 0x1c1917).setStrokeStyle(2, 0x000000).setDepth(0);

        // สะเก็ดไฟ (สีไฟปกติ เพื่อให้ตัดกับบรรยากาศแดงๆ เล็กน้อย)
        for (let i = 0; i < 20; i++) {
            const fireParticle = this.add.circle(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-5, 5),
                Phaser.Math.Between(4, 9),
                Phaser.Math.RND.pick([0xf97316, 0xef4444, 0xfacc15, 0xea580c]),
                0.85
            ).setDepth(1);

            this.tweens.add({
                targets: fireParticle,
                x: fireParticle.x + Phaser.Math.Between(-15, 15),
                y: y - Phaser.Math.Between(40, 90),
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(800, 1400),
                ease: 'Power1',
                repeat: -1,
                delay: Phaser.Math.Between(0, 800)
            });
        }
    }
}