import { Theme, drawOrnatePanel, createButton, createTitleText } from "./Theme.js";

export default class VictoryScene extends Phaser.Scene {

    constructor() {
        super("VictoryScene");
    }

    create() {
        // ================= พื้นหลังไล่เฉดโทนทองอบอุ่น =================
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x140d0a, 0x140d0a, 0x2b220f, 0x2b220f, 1);
        bg.fillRect(0, 0, 1000, 600);

        // แสงทองกระจายฉลองชัยชนะ
        this.add.circle(500, 300, 260, 0xd4af37, 0.06);
        this.add.circle(500, 300, 150, 0xd4af37, 0.06);

        // ================= แผงกรอบตกแต่งหลัก =================
        drawOrnatePanel(this, 500, 300, 580, 320);

        // ================= หัวข้อ VICTORY =================
        createTitleText(this, 500, 175, "VICTORY!", {
            fontSize: "64px",
            color: Theme.color.goldBright
        });

        this.add.text(500, 232, "★  ★  ★", {
            fontFamily: Theme.font.title,
            fontSize: "22px",
            color: Theme.color.gold
        }).setOrigin(0.5);

        this.add.text(500, 275, "คุณค้นพบกุญแจทองคำโบราณ\nและก้าวข้ามทุกกับดักของวิหารต้องคำสาปได้สำเร็จ!", {
            fontFamily: Theme.font.body,
            fontSize: "17px",
            color: Theme.color.parchment,
            align: "center"
        }).setOrigin(0.5);

        // ================= ปุ่มกลับเมนู =================
        let restartButton = createButton(this, 500, 400, "🏠  BACK TO MENU", {
            fontSize: "26px",
            onClick: () => {
                this.scene.start("MenuScene");
            }
        });
    }
}