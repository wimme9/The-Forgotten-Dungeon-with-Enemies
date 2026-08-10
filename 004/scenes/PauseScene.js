export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        // 1. พื้นหลังสีดำโปร่งแสง
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75);

        // 2. ข้อความ GAME PAUSED
        this.add.text(640, 220, 'GAME PAUSED', {
            fontSize: '48px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. ปุ่มเล่นเกมต่อ (RESUME)
        const resumeBtn = this.add.text(640, 330, '▶ RESUME', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // เพิ่ม Effect ตอนเอาเมาส์ชี้
        resumeBtn.on('pointerover', () => resumeBtn.setStyle({ fill: '#2ecc71' }));
        resumeBtn.on('pointerout', () => resumeBtn.setStyle({ fill: '#ffffff' }));

        resumeBtn.on('pointerdown', () => {
            this.resumeGame();
        });

        // 4. ปุ่มกลับหน้าเมนูหลัก (MAIN MENU)
        const menuBtn = this.add.text(640, 420, '🏠 MAIN MENU', {
            fontSize: '28px',
            color: '#ff5555',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ff7675' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#ff5555' }));

        menuBtn.on('pointerdown', () => {
            // หยุดเสียง BGM ถ้ามี
            const gameplayScene = this.scene.get('GameplayScene');
            if (gameplayScene && gameplayScene.bgMusic) {
                gameplayScene.bgMusic.stop();
            }

            this.scene.stop('PauseScene');
            this.scene.stop('GameplayScene');
            this.scene.start('MenuScene');
        });

        // 5. กด ESC หรือ P เพื่อ Resume เล่นต่อได้ด้วย
        this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
        this.input.keyboard.on('keydown-P', () => this.resumeGame());
    }

    resumeGame() {
        this.scene.stop('PauseScene');
        this.scene.resume('GameplayScene');
        
        // เล่นเพลง BGM ใน GameplayScene ต่อ
        const gameplayScene = this.scene.get('GameplayScene');
        if (gameplayScene && gameplayScene.bgMusic && gameplayScene.bgMusic.isPaused) {
            gameplayScene.bgMusic.resume();
        }
    }
}