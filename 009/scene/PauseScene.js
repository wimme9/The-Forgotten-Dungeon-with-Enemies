export default class PauseScene extends Phaser.Scene {

    constructor() {
        super("PauseScene");
    }

    create() {
        // --- 1. พื้นหลังกึ่งโปร่งใส ---
        // ใช้สีดำโปร่งใส (Alpha 0.8) เพื่อให้เห็นเกมเพลย์ที่หยุดอยู่ด้านหลัง
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        // --- 2. กรอบหน้าต่าง Pause (สไตล์แผ่นหิน) ---
        // กรอบนอก
        const panelOuter = this.add.rectangle(400, 300, 600, 420, 0x2d2a26, 1)
            .setStrokeStyle(6, 0x000000, 1);
        // กรอบใน
        const panelInner = this.add.rectangle(400, 300, 570, 390, 0x1f1c19, 1)
            .setStrokeStyle(2, 0x3e3a35, 1);

        // --- 3. ประดับคบเพลิงซ้าย-ขวา ---
        this.createTorch(150, 160);
        this.createTorch(650, 160);

        // --- 4. หัวข้อ GAME PAUSED ---
        const title = this.add.text(400, 160, 'GAME PAUSED', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '52px',
            fontStyle: 'bold',
            color: '#fbbf24', // สีทอง
            stroke: '#451a03',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        const subText = this.add.text(400, 220, 'Take a breath and keep escaping the cave.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#d6d3d1',
            fontStyle: 'italic',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 5. ปุ่ม RESUME (สไตล์แท่นหิน) ---
        const resumeBtnBg = this.add.rectangle(400, 320, 260, 65, 0x3f3f46, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const resumeText = this.add.text(400, 320, 'RESUME', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 6. ปุ่ม BACK TO MENU ---
        const menuBtnBg = this.add.rectangle(400, 410, 260, 55, 0x27272a, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });
        
        const menuText = this.add.text(400, 410, 'BACK TO MENU', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#a1a1aa',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 7. ระบบ Hover และ คลิกของปุ่ม ---
        
        // Resume Button
        resumeBtnBg.on('pointerover', () => {
            resumeBtnBg.setFillStyle(0x52525b, 1);
            resumeText.setColor('#fcd34d');
        });
        resumeBtnBg.on('pointerout', () => {
            resumeBtnBg.setFillStyle(0x3f3f46, 1);
            resumeText.setColor('#ffffff');
        });
        resumeBtnBg.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameplayScene');
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
            this.scene.stop('GameplayScene');
            this.scene.start('MenuScene');
        });

        // --- 8. แอนิเมชันตอนเปิดหน้าจอ (Popup Effect) ---
        const uiGroup = [panelOuter, panelInner, title, subText, resumeBtnBg, resumeText, menuBtnBg, menuText];
        this.tweens.add({
            targets: uiGroup,
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            ease: 'Back.easeOut',
            duration: 300
        });
    }

    // --- Helper Function: สร้างเอฟเฟกต์คบเพลิง ---
    createTorch(x, y) {
        // ด้ามและถ้วยไฟ
        this.add.rectangle(x, y + 25, 12, 50, 0x451a03).setStrokeStyle(2, 0x000000).setDepth(0);
        this.add.rectangle(x, y + 5, 24, 12, 0x1c1917).setStrokeStyle(2, 0x000000).setDepth(0);

        // สะเก็ดไฟ
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