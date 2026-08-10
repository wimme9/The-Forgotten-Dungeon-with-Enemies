export default class VictoryScene extends Phaser.Scene {

    constructor() {
        super("VictoryScene");
    }

    create() {
        // --- 1. พื้นหลังกึ่งโปร่งใส ---
        // ใช้แผ่นฟิล์มสีดำทับฉากเกมเพลย์ เพื่อให้ยังเห็นฉากจบด้านหลังลางๆ
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);

        // --- 2. เอฟเฟกต์ละอองสีทองเฉลิมฉลอง (Victory Sparks) ---
        for (let i = 0; i < 40; i++) {
            const spark = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(400, 700), // เริ่มจากด้านล่าง
                Phaser.Math.Between(2, 5),
                Phaser.Math.RND.pick([0xfcd34d, 0xfbbf24, 0xf59e0b]), // โทนสีทอง/เหลือง
                Phaser.Math.FloatBetween(0.6, 1)
            ).setDepth(0);

            this.tweens.add({
                targets: spark,
                y: spark.y - Phaser.Math.Between(200, 500),
                x: spark.x + Phaser.Math.Between(-30, 30),
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4500),
                ease: 'Sine.easeOut',
                repeat: -1,
                delay: Phaser.Math.Between(0, 1500)
            });
        }

        // --- 3. กรอบหน้าต่าง (สไตล์แผ่นหิน) ---
        // กรอบนอก
        const panelOuter = this.add.rectangle(400, 300, 640, 460, 0x2d2a26, 1)
            .setStrokeStyle(6, 0x000000, 1);
        // กรอบใน
        const panelInner = this.add.rectangle(400, 300, 610, 430, 0x1f1c19, 1)
            .setStrokeStyle(2, 0x3e3a35, 1);

        // --- 4. ประดับคบเพลิงซ้าย-ขวา ---
        this.createTorch(140, 150);
        this.createTorch(660, 150);

        // --- 5. หัวข้อ YOU ESCAPED! (สีทองสว่าง) ---
        const title = this.add.text(400, 150, 'YOU ESCAPED!', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '56px',
            fontStyle: 'bold',
            color: '#facc15', // สีทอง
            stroke: '#451a03',
            strokeThickness: 8,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // ข้อความอธิบาย
        const subText = this.add.text(400, 220, 'The cave has been conquered.\nYou survived the darkness.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            color: '#d6d3d1',
            align: 'center',
            lineSpacing: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 6. ปุ่ม PLAY AGAIN (สไตล์แท่นหิน) ---
        const playBtnBg = this.add.rectangle(400, 320, 300, 70, 0x3f3f46, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const playText = this.add.text(400, 320, 'PLAY AGAIN', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 7. ปุ่ม RETURN TO MENU ---
        const menuBtnBg = this.add.rectangle(400, 420, 300, 60, 0x27272a, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const menuText = this.add.text(400, 420, 'RETURN TO MENU', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#a1a1aa',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 8. ระบบ Hover และ คลิกของปุ่ม ---
        
        // Play Again Button
        playBtnBg.on('pointerover', () => {
            playBtnBg.setFillStyle(0x52525b, 1);
            playText.setColor('#fcd34d');
        });
        playBtnBg.on('pointerout', () => {
            playBtnBg.setFillStyle(0x3f3f46, 1);
            playText.setColor('#ffffff');
        });
        playBtnBg.on('pointerdown', () => {
            this.scene.stop('GameplayScene');
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
            this.scene.stop('GameplayScene'); // ปิดฉากเกมเผื่อไว้
            this.scene.start('MenuScene');
        });

        // --- 9. แอนิเมชันตอนเปิดหน้าจอ (Popup Effect) ---
        const uiGroup = [panelOuter, panelInner, title, subText, playBtnBg, playText, menuBtnBg, menuText];
        this.tweens.add({
            targets: uiGroup,
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            ease: 'Back.easeOut',
            duration: 400
        });
    }

    // --- Helper Function: สร้างเอฟเฟกต์คบเพลิง ---
    createTorch(x, y) {
        // ด้ามและถ้วยไฟ
        this.add.rectangle(x, y + 25, 12, 50, 0x451a03).setStrokeStyle(2, 0x000000).setDepth(0);
        this.add.rectangle(x, y + 5, 24, 12, 0x1c1917).setStrokeStyle(2, 0x000000).setDepth(0);

        // สะเก็ดไฟ
        for (let i = 0; i < 25; i++) {
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