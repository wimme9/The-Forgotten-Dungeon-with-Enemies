export default class InfoScene extends Phaser.Scene {
    constructor() {
        super('InfoScene');
    }

    create() {
        // --- 1. พื้นหลังกึ่งโปร่งใส ---
        // ทำให้พื้นหลังเดิมมืดลง 75% เพื่อเน้นกระดานข้อความตรงกลาง
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75);

        // --- 2. กรอบหน้าต่างอธิบายกติกา (สไตล์แผ่นหิน) ---
        // กรอบนอก
        const panelOuter = this.add.rectangle(400, 300, 660, 460, 0x2d2a26, 1)
            .setStrokeStyle(6, 0x000000, 1);
        // กรอบใน
        const panelInner = this.add.rectangle(400, 300, 630, 430, 0x1f1c19, 1)
            .setStrokeStyle(2, 0x3e3a35, 1);

        // --- 3. ประดับคบเพลิงซ้าย-ขวาของกระดาน ---
        this.createTorch(120, 150);
        this.createTorch(680, 150);

        // --- 4. หัวข้อ HOW TO PLAY ---
        const title = this.add.text(400, 140, 'HOW TO PLAY', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#fbbf24', // สีทอง
            stroke: '#451a03',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);

        // --- 5. ข้อความกติกา ---
        // ปรับการจัดเรียงข้อความให้ดูสวยงามขึ้นเมื่ออยู่ตรงกลางกระดาน
        const rulesText = this.add.text(400, 220, `กติกาการเอาชีวิตรอด:\n\n- ค้นหากุญแจที่ซ่อนอยู่จากรูปปั้นและ NPC\n- เปิดหีบสมบัติเพื่อรวบรวมชิ้นส่วนกุญแจให้ครบ\n- นำไปปลดล็อกประตูทางออกเพื่อหลบหนีออกจากถ้ำ\n- ระวัง! ห้ามปล่อยให้เวลาหมดภายใน 1 นาที`, {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '22px',
            color: '#d6d3d1', // สีเทาสว่าง
            lineSpacing: 10,
            align: 'center',
            wordWrap: { width: 580 },
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5, 0);

        // --- 6. ปุ่ม BACK (สไตล์แท่นหิน) ---
        const closeBtnBg = this.add.rectangle(400, 460, 200, 60, 0x3f3f46, 1)
            .setStrokeStyle(4, 0x09090b, 1)
            .setInteractive({ useHandCursor: true });

        const closeText = this.add.text(400, 460, 'BACK', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);

        // --- 7. ระบบ Hover และ คลิกของปุ่ม BACK ---
        closeBtnBg.on('pointerover', () => {
            closeBtnBg.setFillStyle(0x52525b, 1); // สว่างขึ้นเมื่อเอาเมาส์ชี้
            closeText.setColor('#fcd34d'); // ตัวหนังสือเปลี่ยนเป็นสีทอง
        });
        closeBtnBg.on('pointerout', () => {
            closeBtnBg.setFillStyle(0x3f3f46, 1);
            closeText.setColor('#ffffff');
        });
        closeBtnBg.on('pointerdown', () => {
            // เมื่อกดให้ปิด Scene นี้ หน้าเมนูหลักจะยังคงอยู่ด้านล่าง
            this.scene.stop();
        });

        // --- 8. แอนิเมชันตอนเปิดหน้าจอ (Popup Effect) ---
        // จับกลุ่ม UI ตรงกลางให้เด้งขึ้นมาตอนกดปุ่ม How to play
        const uiGroup = [panelOuter, panelInner, title, rulesText, closeBtnBg, closeText];
        this.tweens.add({
            targets: uiGroup,
            scaleX: { from: 0.7, to: 1 },
            scaleY: { from: 0.7, to: 1 },
            alpha: { from: 0, to: 1 },
            ease: 'Back.easeOut', // เด้งดึ๋งเล็กน้อย
            duration: 350
        });
    }

    // --- Helper Function: สร้างเอฟเฟกต์คบเพลิง ---
    createTorch(x, y) {
        // ด้ามคบเพลิงและถ้วยใส่ไฟ
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