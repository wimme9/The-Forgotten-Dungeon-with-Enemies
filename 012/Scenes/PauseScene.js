import { Theme, drawOrnatePanel, createButton, createTitleText } from "./Theme.js";

export default class PauseScene extends Phaser.Scene {

    constructor() {
        super("PauseScene");
    }

    create() {
        // ม่านมืดคลุมเต็มจอ (vignette) ให้โฟกัสไปที่กรอบเมนู
        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.78).setOrigin(0.5);

        // แผงกรอบตกแต่งหลัก
        drawOrnatePanel(this, 500, 300, 460, 260);

        // หัวข้อ PAUSED
        createTitleText(this, 500, 215, "PAUSED", {
            fontSize: "52px",
            color: Theme.color.goldBright
        });

        this.add.text(500, 265, "เกมหยุดชั่วคราว", {
            fontFamily: Theme.font.body,
            fontSize: "16px",
            color: Theme.color.parchment
        }).setOrigin(0.5);

        // ปุ่ม RESUME
        let resumeButton = createButton(this, 500, 355, "▶  RESUME", {
            fontSize: "30px",
            onClick: () => {
                console.log("Resume");
                this.scene.stop();
                this.scene.resume("GameplayScene");
            }
        });
    }
}