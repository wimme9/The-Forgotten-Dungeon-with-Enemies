import { Theme, drawOrnatePanel, createButton, createTitleText } from "./Theme.js";

export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    create() {
        // ================= พื้นหลังไล่เฉดสีถ้ำดันเจี้ยน =================
        const bg = this.add.graphics();
        bg.fillGradientStyle(
            Theme.color.bgTopHex, Theme.color.bgTopHex,
            Theme.color.bgBottomHex, Theme.color.bgBottomHex,
            1
        );
        bg.fillRect(0, 0, 1000, 600);

        // แสงคบเพลิงเรืองๆ มุมซ้ายบน/ขวาล่าง ให้บรรยากาศดูมีมิติ
        this.add.circle(80, 90, 100, 0xe8974e, 0.06);
        this.add.circle(920, 520, 120, 0xe8974e, 0.05);

        // ================= แผงกรอบตกแต่งหลัก =================
        drawOrnatePanel(this, 500, 300, 640, 340);

        // ================= ชื่อเกม =================
        createTitleText(this, 500, 190, "FORGOTTEN DUNGEON", {
            fontSize: "48px",
            color: Theme.color.goldBright
        });

        this.add.text(500, 240, "จงพิสูจน์ตัวเองในวิหารต้องคำสาป", {
            fontFamily: Theme.font.body,
            fontSize: "18px",
            color: Theme.color.parchment
        }).setOrigin(0.5);

        // เส้นคั่นตกแต่งใต้คำโปรย
        const divider = this.add.graphics();
        divider.lineStyle(2, Theme.color.borderBrightHex, 0.8);
        divider.lineBetween(320, 270, 680, 270);
        divider.fillStyle(Theme.color.borderBrightHex, 1);
        divider.fillCircle(500, 270, 4);

        // ================= ปุ่ม START =================
        let startButton = createButton(this, 500, 355, "⚔  START  ⚔", {
            fontSize: "34px",
            onClick: () => {
                console.log("เริ่มเกม");
                this.scene.start("GameplayScene");
            }
        });

        // ================= คำแนะนำการเล่นด้านล่าง =================
        this.add.text(500, 430, "ใช้ W A S D หรือลูกศรเพื่อเดิน  ·  คลิกเพื่อโต้ตอบกับสิ่งของ", {
            fontFamily: Theme.font.body,
            fontSize: "14px",
            color: "#9c8a6b"
        }).setOrigin(0.5);
    }
}