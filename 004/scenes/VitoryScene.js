export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        // 1. พื้นหลังสีดำโปร่งแสง
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);

        // 2. หัวข้อ Victory
        this.add.text(640, 180, '🏆 VICTORY! 🏆', {
            fontSize: '52px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. ข้อความรายละเอียด
        this.add.text(640, 270, "ยินดีด้วย! คุณเปิดหีบครบทั้ง 3 ใบ\nและหลบหนีออกจากดันเจี้ยนได้สำเร็จ!\n\nขอบคุณที่เล่นเกมของเรา", {
            fontSize: '22px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        // 4. ปุ่มเล่นอีกครั้ง (PLAY AGAIN)
        const restartBtn = this.add.text(640, 420, '🔄 PLAY AGAIN', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Effect ตอนเอาเมาส์ชี้
        restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#2ecc71'));
        restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#27ae60'));

        restartBtn.on('pointerdown', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('GameplayScene'); // เริ่มเล่นเกมใหม่อีกครั้ง
        });

        // 5. ปุ่มกลับหน้าเมนูหลัก (MAIN MENU)
        const menuBtn = this.add.text(640, 500, '🏠 MAIN MENU', {
            fontSize: '24px',
            color: '#aaaaaa',
            backgroundColor: '#333333',
            padding: { x: 18, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffffff' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#aaaaaa' }));

        menuBtn.on('pointerdown', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('MenuScene'); // กลับไปหน้าเมนูหลัก
        });
    }
}