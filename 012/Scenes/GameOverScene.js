import { Theme, drawOrnatePanel, createButton, createTitleText } from "./Theme.js";

export default class GameOverScene extends Phaser.Scene {

    constructor() {
        super("GameOverScene");
    }

    create() {
        this.enemy = null;
        
        // ================= พื้นหลังไล่เฉดโทนเลือด/หินไหม้ =================
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0505, 0x1a0505, 0x2b0d0d, 0x2b0d0d, 1);
        bg.fillRect(0, 0, 1000, 600);

        this.add.circle(500, 300, 240, 0x8b1e1e, 0.10);

        // ================= แผงกรอบตกแต่งหลัก =================
        drawOrnatePanel(this, 500, 300, 580, 340);

        // ================= หัวข้อ GAME OVER =================
        createTitleText(this, 500, 175, "GAME OVER", {
            fontSize: "58px",
            color: Theme.color.bloodBright
        });

        this.add.text(500, 225, "💀", {
            fontSize: "30px"
        }).setOrigin(0.5);

        this.add.text(
            500,
            270,
            "คุณพลาดครบ 3 ครั้งแล้ว...\nวิหารได้กลืนกินคุณไปแล้ว",
            {
                fontFamily: Theme.font.body,
                fontSize: "18px",
                color: Theme.color.parchment,
                align: "center"
            }
        )
        .setOrigin(0.5);

        // ----- ปุ่มลองใหม่ -----
        let retryButton = createButton(this, 500, 375, "⟳  ลองใหม่อีกครั้ง", {
            fontSize: "27px",
            colorNormal: Theme.color.emerald,
            colorHover: Theme.color.emeraldBright,
            onClick: () => {
                this.scene.start("GameplayScene");
            }
        });

        // ----- ปุ่มกลับเมนูหลัก -----
        let menuButton = createButton(this, 500, 445, "🏠  กลับเมนูหลัก", {
            fontSize: "21px",
            onClick: () => {
                this.scene.start("MenuScene");
            }
        });
    }
}