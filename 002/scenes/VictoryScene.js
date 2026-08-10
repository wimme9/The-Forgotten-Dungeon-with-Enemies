export default class VictoryScene extends Phaser.Scene {

    constructor() {
        super("VictoryScene");
    }

    create() {
        // หัวข้อ VICTORY!
        this.add.text(
            500,
            180,
            "🏆 VICTORY! 🏆",
            {
                fontSize: "65px",
                color: "#ffff00",
                fontStyle: "bold"
            }
        )
        .setOrigin(0.5);

        // ข้อความแสดงความยินดี
        this.add.text(
            500,
            260,
            "คุณได้หลบหนีออกจากเขาวงกตสำเร็จแล้ว!",
            {
                fontSize: "22px",
                color: "#ffffff"
            }
        )
        .setOrigin(0.5);

        // ==========================================
        // 🎮 1. ปุ่ม PLAY AGAIN (เริ่มเล่นใหม่อีกครั้ง)
        // ==========================================
        let playAgainButton = this.add.text(
            500,
            350,
            "PLAY AGAIN",
            {
                fontSize: "30px",
                color: "#ffffff",
                backgroundColor: "#2e7d32", // สีเขียว
                padding: { x: 25, y: 10 }
            }
        )
        .setOrigin(0.5);

        playAgainButton.setInteractive();
        
        // Effect Hover
        playAgainButton.on("pointerover", () => playAgainButton.setStyle({ fill: "#ffff00" }));
        playAgainButton.on("pointerout", () => playAgainButton.setStyle({ fill: "#ffffff" }));

        // คลิกเพื่อเริ่ม GameplayScene ใหม่
        playAgainButton.on("pointerdown", () => {
            this.scene.start("GameplayScene");
        });

        // ==========================================
        // 🏠 2. ปุ่ม BACK TO MENU (กลับหน้าหลัก)
        // ==========================================
        let menuButton = this.add.text(
            500,
            430,
            "BACK TO MENU",
            {
                fontSize: "26px",
                color: "#ffffff",
                backgroundColor: "#333333", // สีเทา
                padding: { x: 20, y: 10 }
            }
        )
        .setOrigin(0.5);

        menuButton.setInteractive();

        // Effect Hover
        menuButton.on("pointerover", () => menuButton.setStyle({ fill: "#ffff00" }));
        menuButton.on("pointerout", () => menuButton.setStyle({ fill: "#ffffff" }));

        // คลิกเพื่อกลับไปหน้า MenuScene
        menuButton.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });
    }
}